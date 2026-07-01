import axios from 'axios';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
loadEnv({ path: path.join(__dirname, '../.env') });

const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = process.env;

function generateSignature(params) {
  const sorted = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
  return crypto.createHash('sha1').update(sorted + CLOUDINARY_API_SECRET).digest('hex');
}

export async function uploadProfileImage(imagePath) {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary credentials not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in your .env file.');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const params    = { timestamp, folder: 'offline-media-hub/profiles' };
  const signature = generateSignature(params);
  const imageData = fs.readFileSync(imagePath);
  const base64    = imageData.toString('base64');
  const mimeType  = getMimeType(imagePath);
  const dataUri   = `data:${mimeType};base64,${base64}`;

  const formData  = new URLSearchParams();
  formData.append('file',       dataUri);
  formData.append('api_key',    CLOUDINARY_API_KEY);
  formData.append('timestamp',  timestamp.toString());
  formData.append('folder',     params.folder);
  formData.append('signature',  signature);

  const url      = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  const response = await axios.post(url, formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 30000,
  });

  return response.data.secure_url;
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp' };
  return map[ext] || 'image/jpeg';
}

export function isOnline() {
  return new Promise((resolve) => {
    axios.head('https://api.cloudinary.com', { timeout: 3000 })
      .then(() => resolve(true))
      .catch(() => resolve(false));
  });
}
