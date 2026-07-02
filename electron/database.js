import mongoose from 'mongoose';
import './env.js';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);


const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/offline-media-hub';

// ─── Media Schema ───────────────────────────────────────────────────────────
const mediaSchema = new mongoose.Schema({
  id:        { type: String, required: true, unique: true },
  title:     { type: String, default: 'Unknown Title' },
  artist:    { type: String, default: 'Unknown Artist' },
  album:     { type: String, default: 'Unknown Album' },
  genre:     { type: String, default: '' },
  year:      { type: Number, default: null },
  duration:  { type: Number, default: 0 },
  filePath:  { type: String, required: true },
  fileName:  { type: String, default: '' },
  fileSize:  { type: Number, default: 0 },
  format:    { type: String, default: '' },
  type:      { type: String, enum: ['audio', 'video'], required: true },
  thumbnail: { type: String, default: null },
  dateAdded: { type: Date, default: Date.now },
  lastPlayed:{ type: Date, default: null },
  playCount: { type: Number, default: 0 },
  favorite:  { type: Boolean, default: false },
  rating:    { type: Number, default: 0 },
}, { timestamps: true });

// ─── Playlist Schema ─────────────────────────────────────────────────────────
const playlistSchema = new mongoose.Schema({
  id:          { type: String, required: true, unique: true },
  name:        { type: String, required: true },
  description: { type: String, default: '' },
  mediaIds:    [{ type: String }],
  thumbnail:   { type: String, default: null },
}, { timestamps: true });

// ─── History Schema ───────────────────────────────────────────────────────────
const historySchema = new mongoose.Schema({
  id:        { type: String, required: true, unique: true },
  mediaId:   { type: String, default: null },
  filePath:  { type: String, required: true },
  title:     { type: String, default: 'Unknown' },
  type:      { type: String, enum: ['audio', 'video'], default: 'audio' },
  playedAt:  { type: Date, default: Date.now },
  duration:  { type: Number, default: 0 },
  position:  { type: Number, default: 0 },
}, { timestamps: true });

// ─── Settings Schema ──────────────────────────────────────────────────────────
const settingsSchema = new mongoose.Schema({
  key:   { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

// ─── Profile Schema ───────────────────────────────────────────────────────────
const profileSchema = new mongoose.Schema({
  uid:                 { type: String, default: 'default', unique: true },
  name:                { type: String, default: 'User' },
  email:               { type: String, default: '' },
  avatar:              { type: String, default: null },
  avatarCloudinaryUrl: { type: String, default: null },
  bio:                 { type: String, default: '' },
}, { timestamps: true });

const MediaModel    = mongoose.model('Media', mediaSchema);
const PlaylistModel = mongoose.model('Playlist', playlistSchema);
const HistoryModel  = mongoose.model('History', historySchema);
const SettingsModel = mongoose.model('Settings', settingsSchema);
const ProfileModel  = mongoose.model('Profile', profileSchema);

import { LocalModel } from './localJsonDb.js';

const localMedia = new LocalModel('media');
const localPlaylist = new LocalModel('playlists');
const localHistory = new LocalModel('history');
const localSettings = new LocalModel('settings');
const localProfile = new LocalModel('profile', [{ uid: 'default', name: 'User' }]);

export const Media = {
  find(query) {
    if (isConnected) {
      return MediaModel.find(query);
    } else {
      return localMedia.find(query);
    }
  },
  async findOne(query) {
    if (isConnected) {
      return MediaModel.findOne(query);
    } else {
      return localMedia.findOne(query);
    }
  },
  async findOneAndUpdate(query, updates, options = {}) {
    if (isConnected) {
      const doc = await MediaModel.findOneAndUpdate(query, updates, options);
      try {
        const obj = doc ? doc.toObject() : null;
        if (obj) {
          await localMedia.findOneAndUpdate(query, obj, { upsert: true });
        }
      } catch (err) {
        console.error('[Mirror] Media findOneAndUpdate failed:', err.message);
      }
      return doc;
    } else {
      return localMedia.findOneAndUpdate(query, updates, options);
    }
  },
  async deleteOne(query) {
    if (isConnected) {
      const res = await MediaModel.deleteOne(query);
      try {
        await localMedia.deleteOne(query);
      } catch (err) {
        console.error('[Mirror] Media deleteOne failed:', err.message);
      }
      return res;
    } else {
      return localMedia.deleteOne(query);
    }
  },
  async updateOne(query, updates) {
    if (isConnected) {
      const res = await MediaModel.updateOne(query, updates);
      try {
        await localMedia.updateOne(query, updates);
      } catch (err) {
        console.error('[Mirror] Media updateOne failed:', err.message);
      }
      return res;
    } else {
      return localMedia.updateOne(query, updates);
    }
  }
};

export const Playlist = {
  find(query) {
    if (isConnected) {
      return PlaylistModel.find(query);
    } else {
      return localPlaylist.find(query);
    }
  },
  async findOne(query) {
    if (isConnected) {
      return PlaylistModel.findOne(query);
    } else {
      return localPlaylist.findOne(query);
    }
  },
  async findOneAndUpdate(query, updates, options = {}) {
    if (isConnected) {
      const doc = await PlaylistModel.findOneAndUpdate(query, updates, options);
      try {
        const obj = doc ? doc.toObject() : null;
        if (obj) {
          await localPlaylist.findOneAndUpdate(query, obj, { upsert: true });
        }
      } catch (err) {
        console.error('[Mirror] Playlist findOneAndUpdate failed:', err.message);
      }
      return doc;
    } else {
      return localPlaylist.findOneAndUpdate(query, updates, options);
    }
  },
  async deleteOne(query) {
    if (isConnected) {
      const res = await PlaylistModel.deleteOne(query);
      try {
        await localPlaylist.deleteOne(query);
      } catch (err) {
        console.error('[Mirror] Playlist deleteOne failed:', err.message);
      }
      return res;
    } else {
      return localPlaylist.deleteOne(query);
    }
  },
  async create(data) {
    if (isConnected) {
      const doc = await PlaylistModel.create(data);
      try {
        await localPlaylist.create(doc.toObject());
      } catch (err) {
        console.error('[Mirror] Playlist create failed:', err.message);
      }
      return doc;
    } else {
      return localPlaylist.create(data);
    }
  }
};

export const History = {
  find(query) {
    if (isConnected) {
      return HistoryModel.find(query);
    } else {
      return localHistory.find(query);
    }
  },
  async deleteOne(query) {
    if (isConnected) {
      const res = await HistoryModel.deleteOne(query);
      try {
        await localHistory.deleteOne(query);
      } catch (err) {
        console.error('[Mirror] History deleteOne failed:', err.message);
      }
      return res;
    } else {
      return localHistory.deleteOne(query);
    }
  },
  async deleteMany(query) {
    if (isConnected) {
      const res = await HistoryModel.deleteMany(query);
      try {
        await localHistory.deleteMany(query);
      } catch (err) {
        console.error('[Mirror] History deleteMany failed:', err.message);
      }
      return res;
    } else {
      return localHistory.deleteMany(query);
    }
  },
  async create(data) {
    if (isConnected) {
      const doc = await HistoryModel.create(data);
      try {
        await localHistory.create(doc.toObject());
      } catch (err) {
        console.error('[Mirror] History create failed:', err.message);
      }
      return doc;
    } else {
      return localHistory.create(data);
    }
  }
};

export const Settings = {
  find(query) {
    if (isConnected) {
      return SettingsModel.find(query);
    } else {
      return localSettings.find(query);
    }
  },
  async findOne(query) {
    if (isConnected) {
      return SettingsModel.findOne(query);
    } else {
      return localSettings.findOne(query);
    }
  },
  async findOneAndUpdate(query, updates, options = {}) {
    if (isConnected) {
      const doc = await SettingsModel.findOneAndUpdate(query, updates, options);
      try {
        const obj = doc ? doc.toObject() : null;
        if (obj) {
          await localSettings.findOneAndUpdate(query, obj, { upsert: true });
        }
      } catch (err) {
        console.error('[Mirror] Settings findOneAndUpdate failed:', err.message);
      }
      return doc;
    } else {
      return localSettings.findOneAndUpdate(query, updates, options);
    }
  }
};

export const Profile = {
  async findOne(query) {
    if (isConnected) {
      return ProfileModel.findOne(query);
    } else {
      return localProfile.findOne(query);
    }
  },
  async findOneAndUpdate(query, updates, options = {}) {
    if (isConnected) {
      const doc = await ProfileModel.findOneAndUpdate(query, updates, options);
      try {
        const obj = doc ? doc.toObject() : null;
        if (obj) {
          await localProfile.findOneAndUpdate(query, obj, { upsert: true });
        }
      } catch (err) {
        console.error('[Mirror] Profile findOneAndUpdate failed:', err.message);
      }
      return doc;
    } else {
      return localProfile.findOneAndUpdate(query, updates, options);
    }
  },
  async create(data) {
    if (isConnected) {
      const doc = await ProfileModel.create(data);
      try {
        await localProfile.create(doc.toObject());
      } catch (err) {
        console.error('[Mirror] Profile create failed:', err.message);
      }
      return doc;
    } else {
      return localProfile.create(data);
    }
  }
};

let isConnected = false;
let isSyncing = false;
let mainWindowRef = null;

export function setMainWindow(win) {
  mainWindowRef = win;
}

// ─── MongoDB connection status monitoring ──────────────────────────────────
mongoose.connection.on('disconnected', () => {
  if (isConnected) {
    isConnected = false;
    console.log('[DB Status Monitor] Lost connection to MongoDB.');
    if (mainWindowRef && !mainWindowRef.isDestroyed()) {
      mainWindowRef.webContents.send('db:status', { connected: false, ok: true });
    }
  }
});

mongoose.connection.on('connected', () => {
  if (!isConnected) {
    isConnected = true;
    console.log('[DB Status Monitor] Regained connection to MongoDB.');
    if (mainWindowRef && !mainWindowRef.isDestroyed()) {
      mainWindowRef.webContents.send('db:status', { connected: true, ok: true });
      syncDatabase().catch(err => console.error('[DB Sync] Background sync error:', err.message));
    }
  }
});

export async function syncDatabase() {
  if (!isConnected) return;
  if (isSyncing) return;
  isSyncing = true;
  console.log('[DB Sync] Starting database synchronization...');

  try {
    // 1. Sync Media
    const localMedias = localMedia.getAll();
    const remoteMedias = await MediaModel.find({});
    const remoteMediaMap = new Map(remoteMedias.map(m => [m.filePath, m]));
    const localMediaMap = new Map(localMedias.map(m => [m.filePath, m]));
    const allFilePaths = new Set([...localMediaMap.keys(), ...remoteMediaMap.keys()]);
    const mergedMedias = [];

    for (const fp of allFilePaths) {
      const local = localMediaMap.get(fp);
      const remote = remoteMediaMap.get(fp);

      if (local && !remote) {
        const created = await MediaModel.create(local);
        mergedMedias.push(created.toObject());
      } else if (remote && !local) {
        mergedMedias.push(remote.toObject());
      } else if (local && remote) {
        const localTime = new Date(local.updatedAt || local.dateAdded || 0).getTime();
        const remoteTime = new Date(remote.updatedAt || remote.dateAdded || 0).getTime();

        if (localTime > remoteTime) {
          const updated = await MediaModel.findOneAndUpdate({ filePath: fp }, local, { new: true });
          mergedMedias.push(updated.toObject());
        } else if (remoteTime > localTime) {
          mergedMedias.push(remote.toObject());
        } else {
          mergedMedias.push(local);
        }
      }
    }
    localMedia.saveAll(mergedMedias);

    // 2. Sync Playlists
    const localPlaylists = localPlaylist.getAll();
    const remotePlaylists = await PlaylistModel.find({});
    const remotePlaylistMap = new Map(remotePlaylists.map(p => [p.id, p]));
    const localPlaylistMap = new Map(localPlaylists.map(p => [p.id, p]));
    const allPlaylistIds = new Set([...localPlaylistMap.keys(), ...remotePlaylistMap.keys()]);
    const mergedPlaylists = [];

    for (const id of allPlaylistIds) {
      const local = localPlaylistMap.get(id);
      const remote = remotePlaylistMap.get(id);

      if (local && !remote) {
        const created = await PlaylistModel.create(local);
        mergedPlaylists.push(created.toObject());
      } else if (remote && !local) {
        mergedPlaylists.push(remote.toObject());
      } else if (local && remote) {
        const localTime = new Date(local.updatedAt || local.createdAt || 0).getTime();
        const remoteTime = new Date(remote.updatedAt || remote.createdAt || 0).getTime();

        if (localTime > remoteTime) {
          const updated = await PlaylistModel.findOneAndUpdate({ id }, local, { new: true });
          mergedPlaylists.push(updated.toObject());
        } else {
          mergedPlaylists.push(remote.toObject());
        }
      }
    }
    localPlaylist.saveAll(mergedPlaylists);

    // 3. Sync History
    const localHistoryItems = localHistory.getAll();
    const remoteHistoryItems = await HistoryModel.find({});
    const remoteHistoryMap = new Map(remoteHistoryItems.map(h => [h.id, h]));
    const localHistoryMap = new Map(localHistoryItems.map(h => [h.id, h]));
    const allHistoryIds = new Set([...localHistoryMap.keys(), ...remoteHistoryMap.keys()]);
    const mergedHistory = [];

    for (const id of allHistoryIds) {
      const local = localHistoryMap.get(id);
      const remote = remoteHistoryMap.get(id);

      if (local && !remote) {
        const created = await HistoryModel.create(local);
        mergedHistory.push(created.toObject());
      } else if (remote && !local) {
        mergedHistory.push(remote.toObject());
      } else {
        mergedHistory.push(local);
      }
    }
    mergedHistory.sort((a, b) => new Date(b.playedAt) - new Date(a.playedAt));
    localHistory.saveAll(mergedHistory.slice(0, 500));

    // 4. Sync Settings
    const localSettingsItems = localSettings.getAll();
    const remoteSettingsItems = await SettingsModel.find({});
    const remoteSettingsMap = new Map(remoteSettingsItems.map(s => [s.key, s]));
    const localSettingsMap = new Map(localSettingsItems.map(s => [s.key, s]));
    const allSettingKeys = new Set([...localSettingsMap.keys(), ...remoteSettingsMap.keys()]);
    const mergedSettings = [];

    for (const key of allSettingKeys) {
      const local = localSettingsMap.get(key);
      const remote = remoteSettingsMap.get(key);

      if (local && !remote) {
        const created = await SettingsModel.create(local);
        mergedSettings.push(created.toObject());
      } else if (remote && !local) {
        mergedSettings.push(remote.toObject());
      } else if (local && remote) {
        const localTime = new Date(local.updatedAt || 0).getTime();
        const remoteTime = new Date(remote.updatedAt || 0).getTime();

        if (localTime > remoteTime) {
          const updated = await SettingsModel.findOneAndUpdate({ key }, local, { new: true });
          mergedSettings.push(updated.toObject());
        } else {
          mergedSettings.push(remote.toObject());
        }
      }
    }
    localSettings.saveAll(mergedSettings);

    // 5. Sync Profile
    const localProfileItem = localProfile.getAll()[0];
    const remoteProfileItem = await ProfileModel.findOne({ uid: 'default' });

    if (localProfileItem && !remoteProfileItem) {
      await ProfileModel.create(localProfileItem);
    } else if (remoteProfileItem && !localProfileItem) {
      localProfile.saveAll([remoteProfileItem.toObject()]);
    } else if (localProfileItem && remoteProfileItem) {
      const localTime = new Date(localProfileItem.updatedAt || 0).getTime();
      const remoteTime = new Date(remoteProfileItem.updatedAt || 0).getTime();

      if (localTime > remoteTime) {
        await ProfileModel.findOneAndUpdate({ uid: 'default' }, localProfileItem);
      } else {
        localProfile.saveAll([remoteProfileItem.toObject()]);
      }
    }

    console.log('[DB Sync] Database synchronization completed successfully.');

    // Notify frontend to reload
    if (mainWindowRef && !mainWindowRef.isDestroyed()) {
      mainWindowRef.webContents.send('db:synced');
    }
  } catch (err) {
    console.error('[DB Sync] Failed to synchronize database:', err.message);
  } finally {
    isSyncing = false;
  }
}

let isConnecting = false;

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return { connected: true, ok: true };
  }
  if (isConnecting) {
    return { connected: false, ok: true, error: 'Connection already in progress' };
  }
  isConnecting = true;
  try {
    await mongoose.disconnect();
  } catch (_) {}
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    isConnected = true;
    console.log('[DB] Connected to MongoDB:', MONGODB_URI);
    
    // Start background sync
    syncDatabase().catch(err => console.error('[DB Sync] Background sync error:', err.message));
    
    return { connected: true, ok: true };
  } catch (err) {
    const isDnsError = err.message.includes('ENOTFOUND') || 
                       err.message.includes('EAI_AGAIN') || 
                       err.message.includes('ETIMEOUT') ||
                       err.message.includes('MongooseServerSelectionError') ||
                       err.name === 'MongooseServerSelectionError';

    if (isDnsError) {
      console.log('[DB] DNS resolution failed (e.g. ETIMEOUT/ENOTFOUND). Trying public DNS fallback...');
      try {
        dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
        console.log('[DB] Configured public DNS resolvers: 8.8.8.8, 1.1.1.1, 8.8.4.4');
        
        await mongoose.disconnect();
        await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
        isConnected = true;
        console.log('[DB] Connected to MongoDB using public DNS fallback:', MONGODB_URI);
        syncDatabase().catch(syncErr => console.error('[DB Sync] Background sync error:', syncErr.message));
        return { connected: true, ok: true };
      } catch (retryErr) {
        console.error('[DB] Retry with public DNS fallback failed:', retryErr.message);
      }
    }

    isConnected = false;
    console.error('[DB] Connection failed:', err.message);
    try {
      await mongoose.disconnect();
    } catch (_) {}
    return { connected: false, ok: true, error: err.message };
  } finally {
    isConnecting = false;
  }
}

export async function disconnectDatabase() {
  if (!isConnected) return;
  try {
    await mongoose.disconnect();
  } catch (_) {}
  isConnected = false;
  console.log('[DB] Disconnected from MongoDB');
  if (mainWindowRef && !mainWindowRef.isDestroyed()) {
    mainWindowRef.webContents.send('db:status', { connected: false, ok: true });
  }
}

export function getDatabaseStatus() {
  return { connected: isConnected, uri: MONGODB_URI };
}

// ─── Setting helpers ──────────────────────────────────────────────────────────
export async function getSetting(key, defaultValue = null) {
  const doc = await Settings.findOne({ key });
  return doc ? doc.value : defaultValue;
}

export async function setSetting(key, value) {
  await Settings.findOneAndUpdate({ key }, { key, value }, { upsert: true, new: true });
}

export async function getAllSettings() {
  const docs = await Settings.find({});
  const result = {};
  docs.forEach(d => { result[d.key] = d.value; });
  return result;
}

export async function migrateThumbnails() {
  if (!isConnected) return;
  try {
    const docs = await MediaModel.find({ thumbnail: { $ne: null } });
    let migratedCount = 0;
    for (const doc of docs) {
      if (doc.thumbnail && doc.thumbnail.startsWith('data:image/')) {
        const parts = doc.thumbnail.split(';base64,');
        if (parts.length === 2) {
          const mime = parts[0];
          const dataPart = parts[1];
          if (dataPart.includes(',')) {
            const bytes = dataPart.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
            if (bytes.length > 0) {
              const buf = Buffer.from(bytes);
              const b64 = buf.toString('base64');
              doc.thumbnail = `${mime};base64,${b64}`;
              await doc.save();
              migratedCount++;
            }
          }
        }
      }
    }
    if (migratedCount > 0) {
      console.log(`[DB Migration] Migrated ${migratedCount} media thumbnails from comma-separated bytes to base64 format.`);
    }
  } catch (err) {
    console.error('[DB Migration] Thumbnail migration failed:', err);
  }
}

export async function migrateProfileAvatars() {
  if (!isConnected) return;
  try {
    const doc = await ProfileModel.findOne({ uid: 'default' });
    if (doc && doc.avatar && doc.avatar.startsWith('data:image/')) {
      if (doc.avatar.length > 200000) {
        console.log('[DB Migration] High-resolution profile avatar detected. Resizing to prevent database/Atlas crashes...');
        const { nativeImage } = await import('electron');
        const img = nativeImage.createFromDataURL(doc.avatar);
        const resized = img.resize({ width: 256, height: 256 });
        doc.avatar = resized.toDataURL();
        await doc.save();
        console.log('[DB Migration] Profile avatar successfully resized and optimized.');
      }
    }
  } catch (err) {
    console.error('[DB Migration] Profile avatar migration failed:', err);
  }
}
