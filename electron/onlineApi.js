import crypto from 'crypto';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { app, shell } from 'electron';
import { User, getSetting, Media } from './database.js';

// Active session in-memory state
let activeUser = null;

// Secure SHA-256 password hashing helper
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Backup list of Cobalt instances in case the directory API is down
const BACKUP_COBALT_APIS = [
  "https://api.cobalt.blackcat.sweeux.org",
  "https://api.cobalt.liubquanti.click"
];

// Domains that are broken or require Turnstile JWT authentication
const EXCLUDED_COBALT_DOMAINS = [
  'xenon.zone',       // rue-cobalt (broken streams)
  'meowing.de',       // subito-c, nuko-c (requires JWT)
  'qwkuns.me',        // api.qwkuns (requires JWT)
  'clxxped.lol',      // lime.clxxped (requires JWT)
  'wolfy.love',       // cobalt.omega, cobalt.alpha (requires JWT)
  'co.wuk.sh',
];

/**
 * Searches YouTube search results and resolves a track's audio stream url using Cobalt API.
 */
async function resolveCobaltStream(title, artist) {
  const searchQuery = `${artist} - ${title} audio`;
  console.log(`[Online Stream] Resolving stream for: "${searchQuery}"`);

  try {
    // 1. Search YouTube HTML to get first video ID
    console.log("[Online Stream] Scraping YouTube search page...");
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
    const searchRes = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 12000
    });

    const html = searchRes.data;
    const videoIdMatch = html.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
    if (!videoIdMatch) {
      throw new Error("No YouTube video ID found in search results");
    }
    const videoId = videoIdMatch[1];
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    console.log(`[Online Stream] Found YouTube Video ID: ${videoId} (${youtubeUrl})`);

    // 2. Fetch working Cobalt APIs from the directory
    console.log("[Online Stream] Fetching working Cobalt instances from directory...");
    let cobaltApis = [...BACKUP_COBALT_APIS];
    try {
      const directoryRes = await axios.get('https://cobalt.directory/api/working?type=api', { timeout: 4000 });
      if (directoryRes.data && directoryRes.data.data && directoryRes.data.data.youtube) {
        let fetchedApis = directoryRes.data.data.youtube;
        // Filter out bad/JWT-requiring domains
        fetchedApis = fetchedApis.filter(api => {
          return !EXCLUDED_COBALT_DOMAINS.some(domain => api.includes(domain));
        });
        if (fetchedApis.length > 0) {
          // Merge and prioritize fetched APIs, keeping unique entries
          cobaltApis = [...new Set([...fetchedApis, ...BACKUP_COBALT_APIS])];
          console.log(`[Online Stream] Fetched ${fetchedApis.length} verified instances from directory. Total to test: ${cobaltApis.length}`);
        }
      }
    } catch (e) {
      console.log(`[Online Stream] Directory fetch failed, using backup instances: ${e.message}`);
    }

    // 3. Resolve stream link via Cobalt in parallel
    console.log("[Online Stream] Resolving stream link via Cobalt in parallel...");
    const promises = cobaltApis.map(async (instance) => {
      try {
        const res = await axios.post(instance, {
          url: youtubeUrl,
          downloadMode: 'audio',
          audioFormat: 'mp3',
          audioBitrate: '128'
        }, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          timeout: 5000
        });

        if (res.status === 200 && res.data && (res.data.url || res.data.status === 'tunnel')) {
          const streamUrl = res.data.url;
          if (streamUrl) {
            console.log(`[Online Stream] SUCCESS resolved stream URL via ${instance}!`);
            return streamUrl;
          }
        }
      } catch (err) {
        // Silent catch for individual instances
      }
      throw new Error(`Instance ${instance} failed`);
    });

    try {
      const url = await Promise.any(promises);
      if (url) return url;
    } catch (err) {
      console.error('[Online Stream] All Cobalt instances failed to resolve stream.');
    }
  } catch (err) {
    console.error("[Online Stream] Pipeline failed:", err.message);
  }

  return null;
}

// Public Invidious instances
const INVIDIOUS_INSTANCES = [
  'https://inv.zoomerville.com',
  'https://invidious.projectsegfau.lt',
  'https://invidious.no-logs.com',
  'https://iv.melmac.space',
  'https://invidious.slipfox.xyz'
];

/**
 * Helper to perform search using a single Invidious instance.
 */
async function searchWithInstance(base, query) {
  const url = `${base}/api/v1/search?q=${encodeURIComponent(query)}&type=video&fields=videoId,title,author,lengthSeconds,videoThumbnails`;
  const res = await axios.get(url, {
    timeout: 3000,
    headers: { 'User-Agent': 'MusicHubPlayer/2.0' },
  });

  if (!Array.isArray(res.data) || res.data.length === 0) {
    throw new Error(`Instance ${base} returned empty results`);
  }

  const tracks = [];
  for (const item of res.data) {
    const duration = item.lengthSeconds || 0;
    if (duration === 0 || duration > 600) continue;

    const thumb =
      item.videoThumbnails?.find(t => t.quality === 'medium')?.url ||
      item.videoThumbnails?.[0]?.url ||
      `https://i.ytimg.com/vi/${item.videoId}/mqdefault.jpg`;

    tracks.push({
      id:         `youtube-${item.videoId}`,
      title:      item.title || 'Unknown Title',
      artist:     item.author || 'Unknown Artist',
      album:      'YouTube Release',
      thumbnail:  thumb,
      duration,
      previewUrl: null,
      source:     'youtube',
    });

    if (tracks.length >= 20) break;
  }

  if (tracks.length === 0) {
    throw new Error(`Instance ${base} parsed 0 tracks`);
  }

  console.log(`[YouTube API Scraper] Invidious hit (${base}): ${tracks.length} tracks`);
  return tracks;
}

/**
 * Helper to perform search by scraping YouTube search HTML.
 */
async function searchWithHtml(query) {
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%3D%3D`; // filter: video
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  };

  const res = await axios.get(searchUrl, { headers, timeout: 5000 });
  const html = res.data;

  const startIdx = html.indexOf('var ytInitialData = ');
  if (startIdx === -1) throw new Error('ytInitialData not found');
  const jsonStart = html.indexOf('{', startIdx);
  const scriptEndIdx = html.indexOf('</script>', jsonStart);
  if (scriptEndIdx === -1) throw new Error('Could not find end of script tag');
  
  let rawJson = html.slice(jsonStart, scriptEndIdx).trim();
  if (rawJson.endsWith(';')) {
    rawJson = rawJson.slice(0, -1).trim();
  }

  const data = JSON.parse(rawJson);
  const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
    ?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];

  const tracks = [];
  for (const item of contents) {
    const video = item.videoRenderer;
    if (!video) continue;

    const videoId = video.videoId;
    const title = video.title?.runs?.[0]?.text || '';
    const artist = video.ownerText?.runs?.[0]?.text || 'Unknown Artist';
    const durationText = video.lengthText?.simpleText || '';
    const thumbnail = `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;

    let duration = 0;
    if (durationText) {
      const parts = durationText.split(':').map(Number);
      if (parts.length === 3) duration = parts[0] * 3600 + parts[1] * 60 + parts[2];
      else if (parts.length === 2) duration = parts[0] * 60 + parts[1];
    }

    if (duration === 0 || duration > 600) continue;

    tracks.push({
      id: `youtube-${videoId}`, title, artist,
      album: 'YouTube Release', thumbnail, duration,
      previewUrl: null, source: 'youtube',
    });

    if (tracks.length >= 20) break;
  }

  if (tracks.length === 0) {
    throw new Error('HTML scrape returned 0 tracks');
  }

  console.log(`[YouTube API Scraper] HTML scrape success: ${tracks.length} tracks`);
  return tracks;
}

/**
 * YouTube search helper — tries Invidious JSON API and YouTube HTML scraping in parallel,
 * returning the fastest successful response.
 */
async function searchYouTube(query) {
  console.log('[YouTube API Scraper] Searching in parallel for:', query);

  const promises = [
    searchWithHtml(query),
    ...INVIDIOUS_INSTANCES.map(base => searchWithInstance(base, query))
  ];

  try {
    const results = await Promise.any(promises);
    return results;
  } catch (err) {
    console.error('[YouTube API Scraper] All search methods failed:', err.errors ? err.errors.map(e => e.message) : err.message);
    return [];
  }
}

/**
 * iTunes search fallback (completely free and no key required)
 */
async function searchITunes(query) {
  try {
    console.log('[iTunes API] Performing fallback search for:', query);
    const searchUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=25`;
    const res = await axios.get(searchUrl, { timeout: 4000 });
    const results = res.data?.results || [];

    return results.map(item => {
      // Scale standard 100x100 artwork to higher resolution
      let highResArtwork = item.artworkUrl100 || null;
      if (highResArtwork) {
        highResArtwork = highResArtwork.replace('100x100bb', '500x500bb');
      }

      return {
        id: String(item.trackId || Math.random()),
        title: item.trackName || 'Unknown Title',
        artist: item.artistName || 'Unknown Artist',
        album: item.collectionName || '',
        thumbnail: highResArtwork,
        duration: item.trackTimeMillis ? Math.round(item.trackTimeMillis / 1000) : 0,
        previewUrl: item.previewUrl || null,
        source: 'itunes'
      };
    }).filter(track => track.duration > 0 && track.duration <= 600);
  } catch (err) {
    console.error('[iTunes API] Search failed:', err.message);
    return [];
  }
}

/**
 * JioSaavn search helper (completely free and no key required)
 */
async function searchSaavn(query) {
  try {
    console.log('[JioSaavn API] Searching for:', query);
    const searchUrl = `https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&p=1&n=25&q=${encodeURIComponent(query)}`;
    const res = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.jiosaavn.com/'
      },
      timeout: 5000
    });

    const results = res.data?.results || [];

    return results.map(item => {
      // Scale standard 150x150 artwork to higher resolution (500x500)
      let highResArtwork = item.image || null;
      if (highResArtwork) {
        highResArtwork = highResArtwork.replace('150x150', '500x500');
      }

      // Parse HTML entities from primary artists
      let artist = item.primary_artists || 'Unknown Artist';
      artist = artist.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

      const title = item.song || 'Unknown Title';

      return {
        id: `saavn-${item.id}`,
        title: title,
        artist: artist,
        album: item.album || '',
        thumbnail: highResArtwork,
        duration: item.duration ? parseInt(item.duration, 10) : 0,
        previewUrl: item.media_preview_url || null,
        source: 'saavn'
      };
    }).filter(track => track.duration > 0 && track.duration <= 600);
  } catch (err) {
    console.error('[JioSaavn API] Search failed:', err.message);
    return [];
  }
}

/**
 * Asynchronously download the Cobalt stream MP3 into cache.
 */
async function downloadStream(url, targetPath, trackId) {
  const tempPath = targetPath + '.tmp';
  try {
    console.log(`[Cache] Starting download for ${trackId}...`);
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'stream',
      timeout: 60000 // 1 minute download timeout
    });

    const writer = fs.createWriteStream(tempPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        try {
          const stats = fs.statSync(tempPath);
          if (stats.size === 0) {
            throw new Error('Downloaded file is 0 bytes');
          }
          fs.renameSync(tempPath, targetPath);
          console.log(`[Cache] Successfully downloaded and cached: ${trackId}`);
          resolve();
        } catch (e) {
          if (fs.existsSync(tempPath)) {
            try { fs.unlinkSync(tempPath); } catch (_) {}
          }
          reject(e);
        }
      });
      writer.on('error', (err) => {
        if (fs.existsSync(tempPath)) {
          try { fs.unlinkSync(tempPath); } catch (_) {}
        }
        reject(err);
      });
    });
  } catch (err) {
    if (fs.existsSync(tempPath)) {
      try { fs.unlinkSync(tempPath); } catch (_) {}
    }
    throw err;
  }
}

let cacheDir = '';

export function clearOnlineCache() {
  try {
    const dir = path.join(app.getPath('userData'), 'online_cache');
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        try {
          fs.unlinkSync(path.join(dir, file));
        } catch (_) {}
      }
      console.log(`[Cache] Cleared ${files.length} cached files from ${dir}`);
    }
  } catch (err) {
    console.error('[Cache] Failed to clear online cache:', err.message);
  }
}

export function setupOnlineApi(ipcMain, mainWindow) {
  // Set up local cache folder
  cacheDir = path.join(app.getPath('userData'), 'online_cache');
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
    console.log(`[Cache] Created cache directory at: ${cacheDir}`);
  } else {
    clearOnlineCache();
  }
  
  // ─── User Authentication ──────────────────────────────────────────────────
  
  ipcMain.handle('auth:register', async (_, { username, password }) => {
    try {
      const u = username.trim().toLowerCase();
      if (!u || !password) {
        return { ok: false, error: 'Username and password cannot be empty' };
      }

      // Check if user already exists
      const existing = await User.findOne({ username: u });
      if (existing) {
        return { ok: false, error: 'Username is already registered' };
      }

      const passwordHash = hashPassword(password);
      await User.create({
        username: u,
        password: passwordHash
      });

      console.log(`[Auth] User registered successfully: ${u}`);
      return { ok: true };
    } catch (err) {
      console.error('[Auth] Registration error:', err.message);
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('auth:login', async (_, { username, password }) => {
    try {
      const u = username.trim().toLowerCase();
      if (!u || !password) {
        return { ok: false, error: 'Username and password cannot be empty' };
      }

      const user = await User.findOne({ username: u });
      if (!user) {
        return { ok: false, error: 'Invalid username or password' };
      }

      const passwordHash = hashPassword(password);
      if (user.password !== passwordHash) {
        return { ok: false, error: 'Invalid username or password' };
      }

      // Set active session
      activeUser = { username: user.username };
      console.log(`[Auth] User logged in: ${user.username}`);
      return { ok: true, user: activeUser };
    } catch (err) {
      console.error('[Auth] Login error:', err.message);
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('auth:logout', () => {
    console.log(`[Auth] User logged out: ${activeUser?.username}`);
    activeUser = null;
    return { ok: true };
  });

  ipcMain.handle('auth:check', () => {
    return activeUser;
  });

  // ─── Online Music Search & Streaming ──────────────────────────────────────

  ipcMain.handle('online:search', async (_, { query }) => {
    const q = query.trim();
    if (!q) return [];
    // Default fallback searches YouTube
    return await searchYouTube(q);
  });

  ipcMain.handle('online:searchYouTube', async (_, { query }) => {
    const q = query.trim();
    if (!q) return [];
    return await searchYouTube(q);
  });

  ipcMain.handle('online:searchITunes', async (_, { query }) => {
    const q = query.trim();
    if (!q) return [];
    return await searchITunes(q);
  });

  ipcMain.handle('online:searchSaavn', async (_, { query }) => {
    const q = query.trim();
    if (!q) return [];
    return await searchSaavn(q);
  });

  ipcMain.handle('online:resolveStreamUrl', async (_, { trackId, title, artist }) => {
    try {
      // 1. Check local cache first (clean up track ID to be file-friendly)
      const cleanId = (trackId || '').replace(/[^a-zA-Z0-9_-]/g, '_');
      if (cleanId) {
        const cacheFilePath = path.join(cacheDir, `${cleanId}.mp3`);
        if (fs.existsSync(cacheFilePath)) {
          const stats = fs.statSync(cacheFilePath);
          if (stats.size > 0) {
            console.log(`[Cache] Cache hit for ${cleanId}: serving local file`);
            return { ok: true, url: cacheFilePath, isCached: true };
          } else {
            console.warn(`[Cache] Found 0-byte cached file for ${cleanId}. Deleting and fetching fresh stream.`);
            try { fs.unlinkSync(cacheFilePath); } catch (_) {}
          }
        }
      }

      // 2. Resolve stream URL via Cobalt
      const url = await resolveCobaltStream(title, artist);
      if (!url) {
        return { ok: false, url: null };
      }

      // No background download to prevent double-connecting and throttling remote stream

      return { ok: true, url };
    } catch (err) {
      console.error('[Online Stream] Error resolving stream url:', err.message);
      return { ok: false, url: null };
    }
  });

  ipcMain.handle('online:downloadTrack', async (_, { track, category }) => {
    try {
      const cleanId = (track.id || '').replace(/[^a-zA-Z0-9_-]/g, '_');
      const docId = 'online-download-' + cleanId;

      // Check duplicates in DB
      const existing = await Media.findOne({ id: docId });
      if (existing) {
        return { ok: false, error: 'Song is already downloaded' };
      }

      // Resolve stream URL using Cobalt
      const url = await resolveCobaltStream(track.title, track.artist);
      if (!url) {
        throw new Error('Failed to resolve audio stream from online servers');
      }

      // Prepare downloads directory
      const downloadsDir = path.join(app.getPath('userData'), 'downloads');
      if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir, { recursive: true });
      }

      // Create clean, readable filename for Windows filesystem and easy copying
      const safeName = `${track.artist} - ${track.title}`.replace(/[<>:"/\\|?*]/g, '_');
      const filePath = path.join(downloadsDir, `${safeName}.mp3`);

      // Avoid overwriting a file on disk if it already exists, but update the DB
      if (!fs.existsSync(filePath)) {
        console.log(`[Download] Starting download to: ${filePath}`);
        await downloadStream(url, filePath, cleanId);
      }

      // Verify download succeeded and file is >0 bytes
      if (!fs.existsSync(filePath)) {
        throw new Error('Downloaded file not found on disk');
      }
      const stats = fs.statSync(filePath);
      if (stats.size === 0) {
        try { fs.unlinkSync(filePath); } catch (_) {}
        throw new Error('Downloaded file is empty (0 bytes)');
      }

      // Save record in the Media collection
      const mediaItem = {
        id: docId,
        title: track.title,
        artist: track.artist,
        album: track.album || 'Online Download',
        genre: track.genre || '',
        duration: track.duration,
        filePath,
        fileName: `${safeName}.mp3`,
        fileSize: stats.size,
        format: 'mp3',
        type: 'audio',
        thumbnail: track.thumbnail || null,
        isDownloaded: true,
        downloadCategory: category || 'Others',
        dateAdded: new Date()
      };

      await Media.findOneAndUpdate(
        { id: docId },
        mediaItem,
        { upsert: true, new: true }
      );

      console.log(`[Download] SUCCESS downloaded: "${track.title}" to ${filePath}`);
      return { ok: true, mediaItem };
    } catch (err) {
      console.error('[Download] Error downloading track:', err.message);
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('online:deleteDownload', async (_, id) => {
    try {
      const doc = await Media.findOne({ id });
      if (!doc) {
        return { ok: false, error: 'Track not found in database' };
      }

      const filePath = doc.filePath;
      if (filePath && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`[Download] Deleted physical file: ${filePath}`);
        } catch (e) {
          console.warn(`[Download] Failed to delete file: ${filePath}`, e.message);
        }
      }

      await Media.deleteOne({ id });
      console.log(`[Download] Removed track database record: ${id}`);
      return { ok: true };
    } catch (err) {
      console.error('[Download] Error deleting download:', err.message);
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('online:clearAllDownloads', async () => {
    try {
      const docs = await Media.find({ isDownloaded: true });
      console.log(`[Download] Clearing all ${docs.length} downloads...`);

      for (const doc of docs) {
        if (doc.filePath && fs.existsSync(doc.filePath)) {
          try {
            fs.unlinkSync(doc.filePath);
          } catch (_) {}
        }
      }

      if (docs.length > 0) {
        for (const doc of docs) {
          await Media.deleteOne({ id: doc.id });
        }
      }

      console.log('[Download] Cleared all downloads successfully.');
      return { ok: true };
    } catch (err) {
      console.error('[Download] Error clearing all downloads:', err.message);
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('online:showFile', async (_, filePath) => {
    try {
      if (filePath && fs.existsSync(filePath)) {
        shell.showItemInFolder(filePath);
        return { ok: true };
      }
      return { ok: false, error: 'File does not exist' };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('online:getTopCharts', async () => {
    try {
      console.log('[Top Charts] Fetching iTunes Trending Charts...');
      const response = await axios.get('https://rss.applemarketingtools.com/api/v2/in/music/most-played/20/songs.json', { timeout: 5000 });
      const results = response.data?.feed?.results || [];
      return results.map(item => {
        let highResArtwork = item.artworkUrl100 || null;
        if (highResArtwork) {
          highResArtwork = highResArtwork.replace('100x100bb', '500x500bb');
        }

        return {
          id: `itunes-${item.id}`,
          title: item.name || 'Unknown Title',
          artist: item.artistName || 'Unknown Artist',
          album: item.collectionName || '',
          thumbnail: highResArtwork,
          duration: 210, // Default fallback duration (3.5 mins) since RSS charts don't provide duration
          previewUrl: null,
          source: 'itunes'
        };
      });
    } catch (err) {
      console.error('[Top Charts] Fetch failed, falling back:', err.message);
      return [];
    }
  });

  ipcMain.handle('online:getLyrics', async (_, { artist, title, duration }) => {
    try {
      console.log(`[Lyrics API] Fetching lyrics for: ${title} by ${artist}`);
      const searchUrl = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`;
      const res = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'MusicHubPlayer/2.1.5 (https://github.com/Sicky9304/offline-music-player)'
        },
        timeout: 5000
      });
      if (res.data) {
        return {
          ok: true,
          plainLyrics: res.data.plainLyrics || null,
          syncedLyrics: res.data.syncedLyrics || null
        };
      }
      return { ok: false, plainLyrics: null, syncedLyrics: null };
    } catch (err) {
      console.warn(`[Lyrics API] LRCLIB exact lookup failed:`, err.message);
      // Fallback search
      try {
        const queryUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(`${artist} ${title}`)}`;
        const searchRes = await axios.get(queryUrl, {
          headers: {
            'User-Agent': 'MusicHubPlayer/2.1.5 (https://github.com/Sicky9304/offline-music-player)'
          },
          timeout: 4000
        });
        const firstMatch = searchRes.data?.[0];
        if (firstMatch) {
          return {
            ok: true,
            plainLyrics: firstMatch.plainLyrics || null,
            syncedLyrics: firstMatch.syncedLyrics || null
          };
        }
      } catch (err2) {
        console.warn(`[Lyrics API] LRCLIB search fallback failed:`, err2.message);
      }
      return { ok: false, plainLyrics: null, syncedLyrics: null };
    }
  });

  ipcMain.handle('online:translate', async (_, { text, targetLang }) => {
    try {
      console.log(`[Translate API] Translating text to ${targetLang}`);
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
      const res = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 6000
      });

      if (res.data && res.data[0]) {
        const translated = res.data[0].map(item => item[0]).join('');
        return { ok: true, text: translated };
      }
      return { ok: false, text: text };
    } catch (err) {
      console.error('[Translate API] Failed:', err.message);
      return { ok: false, text: text };
    }
  });
}
