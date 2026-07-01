import { app, BrowserWindow, ipcMain, shell } from 'electron';
import pkg from 'electron-updater';
const { autoUpdater } = pkg;
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { config as loadEnv } from 'dotenv';
import { connectDatabase, disconnectDatabase, migrateThumbnails, migrateProfileAvatars } from './database.js';
import { setupLocalApi } from './localApi.js';
import { MpvController } from './mpvController.js';

// ─── Setup __dirname for ES modules ──────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ─── Load .env ────────────────────────────────────────────────────────────────
loadEnv({ path: path.join(__dirname, '../.env') });

const isDev = !app.isPackaged;

// ─── Updater State & Logger Setup ───────────────────────────────────────────
const logDir = path.join(app.getPath('userData'), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
const updaterLogFile = path.join(logDir, 'updater.log');

function logToFile(level, ...args) {
  const time = new Date().toISOString();
  const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
  const logLine = `[${time}] [${level}] ${message}\n`;
  try {
    fs.appendFileSync(updaterLogFile, logLine);
  } catch (err) {
    console.error('Failed to write to updater log file:', err);
  }
  console.log(`[Updater:${level}]`, message);
}

// ─── Process Error Handling ──────────────────────────────────────────────────
process.on('uncaughtException', (error) => {
  console.error('[Main] Uncaught Exception:', error);
  logToFile('FATAL', 'Uncaught Exception:', error?.stack || error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Main] Unhandled Rejection at:', promise, 'reason:', reason);
  logToFile('FATAL', 'Unhandled Rejection:', reason?.stack || reason);
});

autoUpdater.logger = {
  info: (...args) => logToFile('INFO', ...args),
  warn: (...args) => logToFile('WARN', ...args),
  error: (...args) => logToFile('ERROR', ...args),
};

let updaterState = { status: 'idle', percent: 0, version: app.getVersion(), error: null };

function sendUpdaterState(status, extra = {}) {
  updaterState = {
    status,
    percent: extra.percent || 0,
    version: app.getVersion(),
    error: extra.error || null,
    updateInfo: extra.updateInfo || null,
  };
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('updater:status', updaterState);
  }
}

// ─── electron-updater Event Listeners ────────────────────────────────────────
autoUpdater.on('checking-for-update', () => {
  logToFile('INFO', 'Checking for updates...');
  sendUpdaterState('checking');
});

autoUpdater.on('update-available', (info) => {
  logToFile('INFO', 'Update available:', info);
  sendUpdaterState('available', { updateInfo: info });
});

autoUpdater.on('update-not-available', (info) => {
  logToFile('INFO', 'Update not available:', info);
  sendUpdaterState('not-available', { updateInfo: info });
});

autoUpdater.on('error', (err) => {
  logToFile('ERROR', 'Error in auto-updater:', err);
  sendUpdaterState('error', { error: err?.message || String(err) });
});

autoUpdater.on('download-progress', (progressObj) => {
  logToFile('INFO', `Download progress: ${progressObj.percent}%`);
  sendUpdaterState('downloading', { percent: Math.round(progressObj.percent) });
});

autoUpdater.on('update-downloaded', (info) => {
  logToFile('INFO', 'Update downloaded:', info);
  sendUpdaterState('downloaded', { updateInfo: info });
});

let simulationInterval = null;
function startDevSimulation() {
  if (simulationInterval) clearInterval(simulationInterval);
  
  logToFile('INFO', '[Simulation] Starting mock update check...');
  sendUpdaterState('checking');
  
  setTimeout(() => {
    logToFile('INFO', '[Simulation] Update available (v2.0.4-mock)');
    sendUpdaterState('available', {
      updateInfo: { version: '2.0.4-mock', releaseNotes: 'This is a simulation of the update flow in development mode.' }
    });
    
    setTimeout(() => {
      logToFile('INFO', '[Simulation] Starting download...');
      let progress = 0;
      sendUpdaterState('downloading', { percent: progress });
      
      simulationInterval = setInterval(() => {
        progress += 20;
        if (progress >= 100) {
          clearInterval(simulationInterval);
          logToFile('INFO', '[Simulation] Download complete.');
          sendUpdaterState('downloaded', {
            updateInfo: { version: '2.0.4-mock' }
          });
        } else {
          logToFile('INFO', `[Simulation] Download progress: ${progress}%`);
          sendUpdaterState('downloading', { percent: progress });
        }
      }, 800);
    }, 1500);
  }, 1500);
}

let mainWindow;
const mpv = new MpvController();

async function createWindow() {
  // ─── Connect MongoDB ─────────────────────────────────────────────────────
  const dbResult = await connectDatabase();
  if (dbResult.ok) {
    migrateThumbnails();
    migrateProfileAvatars();
  }

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

  // ─── Updater IPC Handlers ──────────────────────────────────────────────────
  ipcMain.handle('updater:getStatus', () => {
    return updaterState;
  });

  ipcMain.handle('updater:check', () => {
    if (isDev) {
      startDevSimulation();
      return { ok: true, simulated: true };
    } else {
      autoUpdater.checkForUpdates();
      return { ok: true };
    }
  });

  ipcMain.handle('updater:install', () => {
    if (isDev) {
      logToFile('INFO', '[Simulation] Mock installation triggered. App would restart now.');
      app.relaunch();
      app.exit(0);
      return { ok: true };
    } else {
      logToFile('INFO', 'quitAndInstall called');
      autoUpdater.quitAndInstall();
      return { ok: true };
    }
  });

  ipcMain.handle('updater:openLog', () => {
    if (fs.existsSync(updaterLogFile)) {
      shell.openPath(updaterLogFile);
      return { ok: true };
    }
    return { ok: false, error: 'Updater log file does not exist yet.' };
  });

  ipcMain.handle('app:getVersion', () => {
    return app.getVersion();
  });
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
