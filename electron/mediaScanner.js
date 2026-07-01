import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { parseFile } from 'music-metadata';

const AUDIO_EXTS = new Set(['.mp3', '.flac', '.wav', '.aac', '.m4a', '.ogg', '.opus', '.wma', '.aiff', '.ape', '.alac']);
const VIDEO_EXTS = new Set(['.mp4', '.mkv', '.avi', '.mov', '.webm', '.flv', '.wmv', '.m4v', '.ts', '.3gp', '.mpeg', '.mpg']);
const SUBTITLE_EXTS = new Set(['.srt', '.vtt', '.ass', '.ssa', '.sub']);

export function isAudio(ext) { return AUDIO_EXTS.has(ext.toLowerCase()); }
export function isVideo(ext) { return VIDEO_EXTS.has(ext.toLowerCase()); }
export function isSubtitle(ext) { return SUBTITLE_EXTS.has(ext.toLowerCase()); }
export function isMedia(ext) { return isAudio(ext) || isVideo(ext); }

export async function scanFolder(folderPath, onProgress = null) {
  const results = [];
  await walkDir(folderPath, results, onProgress);
  return results;
}

async function walkDir(dirPath, results, onProgress) {
  let entries;
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      await walkDir(fullPath, results, onProgress);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (isMedia(ext)) {
        try {
          const meta = await readMetadata(fullPath);
          results.push(meta);
          if (onProgress) onProgress(meta);
        } catch {
          // Skip unreadable files
        }
      }
    }
  }
}

export async function readMetadata(filePath) {
  const ext      = path.extname(filePath).toLowerCase();
  const fileName = path.basename(filePath);
  const type     = isAudio(ext) ? 'audio' : 'video';

  let stat;
  try { stat = fs.statSync(filePath); } catch { stat = { size: 0 }; }

  const base = {
    id:        uuidv4(),
    filePath,
    fileName,
    fileSize:  stat.size || 0,
    format:    ext.replace('.', '').toUpperCase(),
    type,
    title:     path.basename(filePath, ext),
    artist:    'Unknown Artist',
    album:     'Unknown Album',
    genre:     '',
    year:      null,
    duration:  0,
    thumbnail: null,
    dateAdded: new Date(),
  };

  if (type === 'audio') {
    try {
      const meta = await parseFile(filePath, { duration: true, skipCovers: false });
      const { common, format } = meta;

      base.title     = common.title     || base.title;
      base.artist    = common.artist    || common.albumartist || base.artist;
      base.album     = common.album     || base.album;
      base.genre     = common.genre?.[0] || '';
      base.year      = common.year      || null;
      base.duration  = format.duration  || 0;

      // Extract embedded cover art as base64
      if (common.picture && common.picture.length > 0) {
        const pic = common.picture[0];
        const b64 = pic.data.toString('base64');
        base.thumbnail = `data:${pic.format};base64,${b64}`;
      }
    } catch { /* use defaults */ }
  }

  return base;
}

export function findSubtitlesNear(filePath) {
  const dir    = path.dirname(filePath);
  const base   = path.basename(filePath, path.extname(filePath));
  const subs   = [];

  try {
    const entries = fs.readdirSync(dir);
    entries.forEach(f => {
      const ext = path.extname(f).toLowerCase();
      if (isSubtitle(ext) && f.startsWith(base)) {
        subs.push(path.join(dir, f));
      }
    });
  } catch { /* ignore */ }

  return subs;
}
