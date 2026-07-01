import mongoose from 'mongoose';
import './env.js';
import path from 'path';
import { fileURLToPath } from 'url';

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

export const Media    = mongoose.model('Media', mediaSchema);
export const Playlist = mongoose.model('Playlist', playlistSchema);
export const History  = mongoose.model('History', historySchema);
export const Settings = mongoose.model('Settings', settingsSchema);
export const Profile  = mongoose.model('Profile', profileSchema);

let isConnected = false;

export async function connectDatabase() {
  if (isConnected) return { ok: true };
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    isConnected = true;
    console.log('[DB] Connected to MongoDB:', MONGODB_URI);
    return { connected: true, ok: true };
  } catch (err) {
    console.error('[DB] Connection failed:', err.message);
    return { connected: false, ok: false, error: err.message };
  }
}

export async function disconnectDatabase() {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log('[DB] Disconnected from MongoDB');
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
  try {
    const docs = await Media.find({ thumbnail: { $ne: null } });
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
  try {
    const doc = await Profile.findOne({ uid: 'default' });
    if (doc && doc.avatar && doc.avatar.startsWith('data:image/')) {
      // If the base64 string is massive (longer than 200,000 characters, representing a large image)
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
