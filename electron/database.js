import mongoose from 'mongoose';
import { config as loadEnv } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
loadEnv({ path: path.join(__dirname, '../.env') });

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
  try {
    await History.deleteMany({});
    console.log('[DB] Play history cleared successfully on app close');
  } catch (err) {
    console.error('[DB] Failed to clear play history on close:', err.message);
  }
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
