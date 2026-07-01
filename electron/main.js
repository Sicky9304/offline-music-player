import { app, BrowserWindow, ipcMain } from 'electron';
import pkg from 'electron-updater';
const { autoUpdater } = pkg;
import { fileURLToPath } from 'url';
import path from 'path';
import { config as loadEnv } from 'dotenv';
import { connectDatabase, disconnectDatabase } from './database.js';
import { setupLocalApi } from './localApi.js';
import { MpvController } from './mpvController.js';

// ─── Setup __dirname for ES modules ──────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ─── Load .env ────────────────────────────────────────────────────────────────
loadEnv({ path: path.join(__dirname, '../.env') });

const isDev = !app.isPackaged;

let mainWindow;
const mpv = new MpvController();

async function createWindow() {
  // ─── Connect MongoDB ─────────────────────────────────────────────────────
  const dbResult = await connectDatabase();

  mainWindow = new BrowserWindow({
    width:           1400,
    height:          900,
    minWidth:        960,
    minHeight:       640,
    backgroundColor: '#09090b',
    frame:           false,
    titleBarStyle:   'hidden',
    icon:            path.join(__dirname, '../assets/icon.png'),
    show:            false,
    webPreferences: {
      preload:          path.join(__dirname, 'preload/preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
      sandbox:          false,
      webSecurity:      false, // Allow local file:// media loading
    },
  });

  // ─── Setup all IPC handlers ───────────────────────────────────────────────
  mpv.init();
  setupLocalApi(ipcMain, mpv, mainWindow);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.webContents.send('db:status', dbResult);
  });

  mainWindow.on('closed', () => { mainWindow = null; });

  // ─── Load app ─────────────────────────────────────────────────────────────
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // ─── DB Status IPC ────────────────────────────────────────────────────────
  ipcMain.handle('db:status',       () => dbResult);
}

app.whenReady().then(() => {
  createWindow();
  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();
  }
});

let isQuitting = false;

app.on('before-quit', async (event) => {
  if (!isQuitting) {
    event.preventDefault();
    console.log('[Main] App is quitting. Cleaning up...');
    try { await mpv.stop(); } catch (_) {}
    await disconnectDatabase();
    isQuitting = true;
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
