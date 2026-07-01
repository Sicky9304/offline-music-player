import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const envPaths = [
  path.join(__dirname, '../.env'), // Dev or packaged ASAR root
  path.join(path.dirname(process.execPath), '.env'), // Next to executable
];

try {
  if (app) {
    envPaths.push(path.join(app.getPath('userData'), '.env'));
  }
} catch (e) {
  // Ignore if app is not initialized or in non-electron test context
}

let loaded = false;
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    loadEnv({ path: envPath });
    console.log(`[Env] Loaded environment variables from: ${envPath}`);
    loaded = true;
    break;
  }
}

if (!loaded) {
  console.log('[Env] No external .env file found. Using default environment/system variables.');
}
