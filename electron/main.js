import { app, BrowserWindow, ipcMain, shell } from 'electron';
import pkg from 'electron-updater';
const { autoUpdater } = pkg;
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import './env.js';
import { connectDatabase, disconnectDatabase, migrateThumbnails, migrateProfileAvatars, setMainWindow, getDatabaseStatus } from './database.js';
import { setupLocalApi } from './localApi.js';
import { setupOnlineApi, clearOnlineCache } from './onlineApi.js';
import { MpvController } from './mpvController.js';

// ─── Setup __dirname for ES modules ──────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);


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
let reconnectInterval = null;
const mpv = new MpvController();

async function createWindow() {
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

  setMainWindow(mainWindow);

  // Connect MongoDB asynchronously so the window opens instantly on startup
  connectDatabase().then((dbResult) => {
    if (dbResult.connected) {
      migrateThumbnails();
      migrateProfileAvatars();
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('db:status', { connected: dbResult.connected, ok: true });
    }
  }).catch((err) => {
    console.error('[DB Startup] Connection failed asynchronously:', err.message);
  });

  // ─── Setup all IPC handlers ───────────────────────────────────────────────
  mpv.init();
  setupLocalApi(ipcMain, mpv, mainWindow);
  setupOnlineApi(ipcMain, mainWindow);

  ipcMain.on('win:reload', () => {
    console.log('[Main] Reloading window...');
    if (isDev) {
      mainWindow?.loadURL('http://localhost:5173');
    } else {
      mainWindow?.loadFile(path.join(__dirname, '../dist/index.html'));
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    const status = getDatabaseStatus();
    mainWindow.webContents.send('db:status', { connected: status.connected, ok: true });
  });

  mainWindow.on('closed', () => { mainWindow = null; });

  // ─── Load app ─────────────────────────────────────────────────────────────
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // ─── DB Status IPC ────────────────────────────────────────────────────────
  ipcMain.handle('db:status', () => {
    const status = getDatabaseStatus();
    return { connected: status.connected, ok: true };
  });

  ipcMain.handle('db:reconnect', async () => {
    const status = getDatabaseStatus();
    if (status.connected) {
      return { connected: true, ok: true };
    }
    console.log('[DB Reconnector] Instant reconnect triggered from IPC...');
    const result = await connectDatabase();
    if (result.connected && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('db:status', result);
    }
    return result;
  });

  ipcMain.handle('db:disconnect', async () => {
    console.log('[DB Disconnector] Disconnect triggered from IPC due to offline status...');
    await disconnectDatabase();
    return { connected: false, ok: true };
  });

  // Try to reconnect in the background every 15 seconds if disconnected
  reconnectInterval = setInterval(async () => {
    const status = getDatabaseStatus();
    if (!status.connected) {
      console.log('[DB Reconnector] Background reconnecting...');
      const result = await connectDatabase();
      if (result.connected && mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('db:status', result);
      }
    }
  }, 15000);

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

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();
    if (!isDev) {
      autoUpdater.checkForUpdatesAndNotify();
    }
  });
}

let isQuitting = false;

app.on('before-quit', async (event) => {
  if (!isQuitting) {
    event.preventDefault();
    console.log('[Main] App is quitting. Cleaning up...');
    if (reconnectInterval) clearInterval(reconnectInterval);
    try { await mpv.stop(); } catch (_) {}
    await disconnectDatabase();
    try { clearOnlineCache(); } catch (_) {}
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
