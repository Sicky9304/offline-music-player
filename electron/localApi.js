import { dialog, BrowserWindow, app, nativeImage } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { Media, Playlist, History, Settings, Profile, getSetting, setSetting, getAllSettings } from './database.js';
import { scanFolder, readMetadata, findSubtitlesNear } from './mediaScanner.js';
import { uploadProfileImage, isOnline } from './cloudinaryProfile.js';

export function setupLocalApi(ipcMain, mpv, mainWindow) {

  // ─── Window ───────────────────────────────────────────────────────────────
  ipcMain.on('win:minimize',  () => mainWindow?.minimize());
  ipcMain.on('win:maximize',  () => mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize());
  ipcMain.on('win:close',     () => mainWindow?.close());
  ipcMain.handle('win:isMaximized', () => mainWindow?.isMaximized() || false);

  let videoWindow = null;
  ipcMain.handle('video:open', (_, filePath) => {
    const isDev = !app.isPackaged;
    
    if (videoWindow) {
      videoWindow.focus();
      videoWindow.webContents.send('video:load', filePath);
      return;
    }

    videoWindow = new BrowserWindow({
      width: 1000,
      height: 600,
      minWidth: 480,
      minHeight: 270,
      title: 'Video Player',
      autoHideMenuBar: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload/preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
        webSecurity: false,
      }
    });

    const queryPath = encodeURIComponent(filePath);
    if (isDev) {
      videoWindow.loadURL(`http://localhost:5173/#/video-player?path=${queryPath}`);
    } else {
      videoWindow.loadURL(`file://${path.join(__dirname, '../dist/index.html')}#/video-player?path=${queryPath}`);
    }

    videoWindow.on('closed', () => {
      videoWindow = null;
    });
  });

  // ─── File / Folder Dialog ─────────────────────────────────────────────────
  ipcMain.handle('dialog:openFiles', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Media Files', extensions: ['mp4','mkv','mp3','flac','wav','aac','m4a','ogg','opus','avi','mov','webm','flv','wmv','m4v','ts','wma','aiff','ape'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });
    if (result.canceled) return [];
    const results = [];
    for (const fp of result.filePaths) {
      const meta = await readMetadata(fp);
      results.push(meta);
    }
    return results;
  });

  ipcMain.handle('dialog:openFolder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
    });
    if (result.canceled) return [];
    const folderPath = result.filePaths[0];
    const items = [];
    await scanFolder(folderPath, (item) => {
      items.push(item);
      mainWindow?.webContents.send('scan:progress', { item, folder: folderPath });
    });
    return items;
  });

  ipcMain.handle('dialog:openImage', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['jpg','jpeg','png','gif','webp'] }],
    });
    if (result.canceled) return null;
    return result.filePaths[0];
  });

  // ─── Media CRUD ───────────────────────────────────────────────────────────
  ipcMain.handle('media:addMany', async (_, items) => {
    const results = [];
    for (const item of items) {
      try {
        const doc = await Media.findOneAndUpdate(
          { filePath: item.filePath },
          { ...item, id: item.id || uuidv4() },
          { upsert: true, new: true }
        );
        results.push(doc.toObject());
      } catch (e) {
        console.error('[media:addMany]', e.message);
      }
    }
    return results;
  });

  ipcMain.handle('media:getAll', async () => {
    const docs = await Media.find({}).sort({ dateAdded: -1 });
    return docs.map(d => d.toObject());
  });

  ipcMain.handle('media:getAudio', async () => {
    const docs = await Media.find({ type: 'audio' }).sort({ title: 1 });
    return docs.map(d => d.toObject());
  });

  ipcMain.handle('media:getVideo', async () => {
    const docs = await Media.find({ type: 'video' }).sort({ title: 1 });
    return docs.map(d => d.toObject());
  });

  ipcMain.handle('media:delete', async (_, id) => {
    await Media.deleteOne({ id });
    return { ok: true };
  });

  ipcMain.handle('media:update', async (_, { id, updates }) => {
    const doc = await Media.findOneAndUpdate({ id }, updates, { new: true });
    return doc?.toObject() || null;
  });

  ipcMain.handle('media:toggleFavorite', async (_, id) => {
    const doc = await Media.findOne({ id });
    if (!doc) return null;
    doc.favorite = !doc.favorite;
    await doc.save();
    return doc.toObject();
  });

  ipcMain.handle('media:getFavorites', async () => {
    const docs = await Media.find({ favorite: true }).sort({ title: 1 });
    return docs.map(d => d.toObject());
  });

  ipcMain.handle('media:search', async (_, query) => {
    const q = query.trim();
    if (!q) return [];
    const regex = new RegExp(q, 'i');
    const docs = await Media.find({
      $or: [{ title: regex }, { artist: regex }, { album: regex }, { fileName: regex }],
    }).limit(50);
    return docs.map(d => d.toObject());
  });

  ipcMain.handle('media:getMetadata', async (_, filePath) => {
    try { return await readMetadata(filePath); } catch { return null; }
  });

  ipcMain.handle('media:findSubtitles', async (_, filePath) => {
    return findSubtitlesNear(filePath);
  });

  // ─── Playlists ────────────────────────────────────────────────────────────
  ipcMain.handle('playlist:getAll', async () => {
    const docs = await Playlist.find({}).sort({ createdAt: -1 });
    return docs.map(d => d.toObject());
  });

  ipcMain.handle('playlist:create', async (_, { name, description }) => {
    const doc = await Playlist.create({ id: uuidv4(), name, description: description || '' });
    return doc.toObject();
  });

  ipcMain.handle('playlist:update', async (_, { id, updates }) => {
    const doc = await Playlist.findOneAndUpdate({ id }, { ...updates, updatedAt: new Date() }, { new: true });
    return doc?.toObject() || null;
  });

  ipcMain.handle('playlist:delete', async (_, id) => {
    await Playlist.deleteOne({ id });
    return { ok: true };
  });

  ipcMain.handle('playlist:addMedia', async (_, { playlistId, mediaId }) => {
    const doc = await Playlist.findOne({ id: playlistId });
    if (!doc) return null;
    if (!doc.mediaIds.includes(mediaId)) {
      doc.mediaIds.push(mediaId);
      await doc.save();
    }
    return doc.toObject();
  });

  ipcMain.handle('playlist:removeMedia', async (_, { playlistId, mediaId }) => {
    const doc = await Playlist.findOne({ id: playlistId });
    if (!doc) return null;
    doc.mediaIds = doc.mediaIds.filter(id => id !== mediaId);
    await doc.save();
    return doc.toObject();
  });

  // ─── History ──────────────────────────────────────────────────────────────
  ipcMain.handle('history:add', async (_, item) => {
    try {
      const doc = await History.create({ id: uuidv4(), ...item });
      // Update media playCount and lastPlayed
      if (item.mediaId) {
        await Media.updateOne({ id: item.mediaId }, { $inc: { playCount: 1 }, lastPlayed: new Date() });
      }
      return doc.toObject();
    } catch (e) {
      console.error('[history:add]', e.message);
      return null;
    }
  });

  ipcMain.handle('history:getAll', async () => {
    const docs = await History.find({}).sort({ playedAt: -1 }).limit(500);
    return docs.map(d => d.toObject());
  });

  ipcMain.handle('history:clear', async () => {
    await History.deleteMany({});
    return { ok: true };
  });

  ipcMain.handle('history:delete', async (_, id) => {
    await History.deleteOne({ id });
    return { ok: true };
  });

  // ─── Settings ─────────────────────────────────────────────────────────────
  ipcMain.handle('settings:get', async (_, key) => {
    return await getSetting(key);
  });

  ipcMain.handle('settings:set', async (_, { key, value }) => {
    await setSetting(key, value);
    return { ok: true };
  });

  ipcMain.handle('settings:getAll', async () => {
    return await getAllSettings();
  });

  // ─── Profile ──────────────────────────────────────────────────────────────
  ipcMain.handle('profile:get', async () => {
    let doc = await Profile.findOne({ uid: 'default' });
    if (!doc) doc = await Profile.create({ uid: 'default', name: 'User' });
    return doc.toObject();
  });

  ipcMain.handle('profile:update', async (_, updates) => {
    const doc = await Profile.findOneAndUpdate(
      { uid: 'default' },
      { ...updates, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    return doc.toObject();
  });

  ipcMain.handle('profile:uploadAvatar', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['jpg','jpeg','png','gif','webp'] }],
    });
    if (result.canceled) return { ok: false, reason: 'cancelled' };
    const imagePath = result.filePaths[0];

    // Save locally first - resize to 256x256 using Electron's nativeImage to prevent DB bloat
    let b64;
    try {
      const img = nativeImage.createFromPath(imagePath);
      const resized = img.resize({ width: 256, height: 256 });
      b64 = resized.toDataURL();
    } catch (e) {
      console.warn('[profile:uploadAvatar] nativeImage resize failed, falling back to full size:', e.message);
      const imageData = fs.readFileSync(imagePath);
      const ext       = path.extname(imagePath);
      b64 = `data:image/${ext.replace('.','')};base64,${imageData.toString('base64')}`;
    }

    let cloudUrl = null;
    const online = await isOnline();
    if (online) {
      try { cloudUrl = await uploadProfileImage(imagePath); } catch (e) {
        console.warn('[profile:uploadAvatar] Cloudinary failed:', e.message);
      }
    }

    const doc = await Profile.findOneAndUpdate(
      { uid: 'default' },
      { avatar: b64, avatarCloudinaryUrl: cloudUrl },
      { upsert: true, new: true }
    );
    return { ok: true, avatar: b64, cloudUrl };
  });

  // ─── MPV Playback ─────────────────────────────────────────────────────────
  ipcMain.handle('mpv:load', async (_, { filePath, options }) => {
    try {
      return await mpv.loadFile(filePath, options || {});
    } catch (e) {
      if (e.error === 'MPV_NOT_FOUND') {
        return { error: 'MPV_NOT_FOUND', message: 'MPV is not installed. Please install MPV from https://mpv.io' };
      }
      return { error: e.message };
    }
  });

  ipcMain.handle('mpv:play',    async () => { try { await mpv.play(); return { ok: true }; } catch(e) { return { error: e.message }; } });
  ipcMain.handle('mpv:pause',   async () => { try { await mpv.pause(); return { ok: true }; } catch(e) { return { error: e.message }; } });
  ipcMain.handle('mpv:toggle',  async () => { try { await mpv.togglePause(); return { ok: true }; } catch(e) { return { error: e.message }; } });
  ipcMain.handle('mpv:stop',    async () => { try { await mpv.stop(); return { ok: true }; } catch(e) { return { error: e.message }; } });
  ipcMain.handle('mpv:seek',    async (_, { seconds, mode }) => { try { await mpv.seek(seconds, mode || 'relative'); return { ok: true }; } catch(e) { return { error: e.message }; } });
  ipcMain.handle('mpv:seekAbs', async (_, seconds) => { try { await mpv.seekAbsolute(seconds); return { ok: true }; } catch(e) { return { error: e.message }; } });
  ipcMain.handle('mpv:volume',  async (_, vol) => { try { await mpv.setVolume(vol); return { ok: true }; } catch(e) { return { error: e.message }; } });
  ipcMain.handle('mpv:speed',   async (_, speed) => { try { await mpv.setSpeed(speed); return { ok: true }; } catch(e) { return { error: e.message }; } });
  ipcMain.handle('mpv:mute',    async (_, muted) => { try { await mpv.setMute(muted); return { ok: true }; } catch(e) { return { error: e.message }; } });
  ipcMain.handle('mpv:fullscreen', async () => { try { await mpv.toggleFullscreen(); return { ok: true }; } catch(e) { return { error: e.message }; } });
  ipcMain.handle('mpv:subDelay',   async (_, delay) => { try { await mpv.setSubtitleDelay(delay); return { ok: true }; } catch(e) { return { error: e.message }; } });
  ipcMain.handle('mpv:loadSub',    async (_, fp) => { try { await mpv.loadSubtitles(fp); return { ok: true }; } catch(e) { return { error: e.message }; } });
  ipcMain.handle('mpv:audioTrack', async (_, id) => { try { await mpv.setAudioTrack(id); return { ok: true }; } catch(e) { return { error: e.message }; } });
  ipcMain.handle('mpv:subTrack',   async (_, id) => { try { await mpv.setSubtitleTrack(id); return { ok: true }; } catch(e) { return { error: e.message }; } });
  ipcMain.handle('mpv:getPos',     async () => { return mpv.getPosition(); });
  ipcMain.handle('mpv:getDur',     async () => { return mpv.getDuration(); });
  ipcMain.handle('mpv:getVol',     async () => { return mpv.getVolume(); });
  ipcMain.handle('mpv:isPaused',   async () => { return mpv.isPaused(); });
  ipcMain.handle('mpv:isInstalled',async () => { return mpv.isInstalled(); });
}
