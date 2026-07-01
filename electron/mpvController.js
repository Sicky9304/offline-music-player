import { spawn } from 'child_process';
import { platform } from 'os';
import path from 'path';
import net from 'net';
import fs from 'fs';

const IS_WIN = platform() === 'win32';
const SOCKET_PATH = IS_WIN ? '\\\\.\\pipe\\mpvsocket' : '/tmp/mpvsocket';

function getMpvPath() {
  if (IS_WIN) {
    const commonPaths = [
      'C:\\Program Files\\MPV Player\\mpv.exe',
      'C:\\Program Files (x86)\\MPV Player\\mpv.exe',
      path.join(process.env.LOCALAPPDATA || '', 'Programs\\mpv\\mpv.exe')
    ];
    for (const p of commonPaths) {
      if (fs.existsSync(p)) return p;
    }
  }
  return 'mpv';
}

export class MpvController {
  constructor() {
    this.mpvProcess = null;
    this.socket = null;
    this.requestId = 1;
    this.pendingRequests = new Map();
    this.listeners = new Map();
    this.isReady = false;
    this.currentFile = null;
    this.reconnectTimer = null;
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────
  init() {
    console.log('[MPV] Controller initialized');
  }

  async loadFile(filePath, options = {}) {
    this.currentFile = filePath;
    const args = [
      filePath,
      `--input-ipc-server=${SOCKET_PATH}`,
      '--no-terminal',
      '--keep-open=yes',
      '--idle=yes',
      '--force-window=immediate',
    ];
    if (options.startTime) args.push(`--start=${options.startTime}`);
    if (options.volume !== undefined) args.push(`--volume=${options.volume}`);
    if (options.speed) args.push(`--speed=${options.speed}`);

    // Kill existing MPV
    if (this.mpvProcess) {
      try { this.mpvProcess.kill('SIGTERM'); } catch (_) {}
      this.mpvProcess = null;
    }
    this.isReady = false;

    return new Promise((resolve, reject) => {
      const mpvBinary = getMpvPath();
      this.mpvProcess = spawn(mpvBinary, args, { detached: false });

      this.mpvProcess.on('error', (err) => {
        console.error('[MPV] Spawn error:', err.message);
        reject({ error: 'MPV_NOT_FOUND', message: err.message });
      });

      this.mpvProcess.stderr?.on('data', (data) => {
        // console.debug('[MPV stderr]', data.toString());
      });

      // Wait for socket then connect
      setTimeout(() => {
        this.connectSocket().then(() => resolve({ ok: true })).catch(reject);
      }, 1500);
    });
  }

  connectSocket() {
    return new Promise((resolve, reject) => {
      if (this.socket) {
        try { this.socket.destroy(); } catch (_) {}
        this.socket = null;
      }

      const socket = net.createConnection(SOCKET_PATH);
      this.socket = socket;
      let buffer = '';

      socket.on('connect', () => {
        this.isReady = true;
        console.log('[MPV] Socket connected');
        resolve();
      });

      socket.on('data', (data) => {
        buffer += data.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop();
        lines.forEach(line => {
          if (!line.trim()) return;
          try {
            const msg = JSON.parse(line);
            if (msg.request_id && this.pendingRequests.has(msg.request_id)) {
              const { resolve, reject } = this.pendingRequests.get(msg.request_id);
              this.pendingRequests.delete(msg.request_id);
              msg.error === 'success' ? resolve(msg.data) : reject(new Error(msg.error));
            }
            // Emit events
            if (msg.event) {
              const handlers = this.listeners.get(msg.event) || [];
              handlers.forEach(fn => fn(msg));
            }
          } catch (_) {}
        });
      });

      socket.on('error', (err) => {
        console.error('[MPV] Socket error:', err.message);
        this.isReady = false;
        reject(err);
      });

      socket.on('close', () => {
        this.isReady = false;
        console.log('[MPV] Socket closed');
      });
    });
  }

  // ─── IPC Command ──────────────────────────────────────────────────────────
  sendCommand(command, args = []) {
    if (!this.isReady || !this.socket) {
      return Promise.reject(new Error('MPV not ready'));
    }
    const id = this.requestId++;
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      const msg = JSON.stringify({ command: [command, ...args], request_id: id }) + '\n';
      this.socket.write(msg);
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('MPV command timeout'));
        }
      }, 5000);
    });
  }

  getProperty(prop) {
    return this.sendCommand('get_property', [prop]);
  }

  setProperty(prop, value) {
    return this.sendCommand('set_property', [prop, value]);
  }

  // ─── Playback Controls ────────────────────────────────────────────────────
  async play()  { return this.setProperty('pause', false); }
  async pause() { return this.setProperty('pause', true);  }
  async togglePause() { return this.sendCommand('cycle', ['pause']); }
  async stop()  {
    try { await this.sendCommand('stop'); } catch (_) {}
    if (this.mpvProcess) {
      try { this.mpvProcess.kill('SIGTERM'); } catch (_) {}
      this.mpvProcess = null;
    }
    this.isReady = false;
  }

  async seek(seconds, mode = 'relative') {
    return this.sendCommand('seek', [seconds, mode]);
  }

  async seekAbsolute(seconds) {
    return this.sendCommand('seek', [seconds, 'absolute']);
  }

  async setVolume(vol) {
    return this.setProperty('volume', Math.max(0, Math.min(150, vol)));
  }

  async setSpeed(speed) {
    return this.setProperty('speed', speed);
  }

  async setMute(muted) {
    return this.setProperty('mute', muted);
  }

  async toggleFullscreen() {
    return this.sendCommand('cycle', ['fullscreen']);
  }

  async setSubtitleDelay(delay) {
    return this.setProperty('sub-delay', delay);
  }

  async loadSubtitles(filePath) {
    return this.sendCommand('sub-add', [filePath]);
  }

  async setAudioTrack(id) {
    return this.setProperty('aid', id);
  }

  async setSubtitleTrack(id) {
    return this.setProperty('sid', id);
  }

  async getPosition() {
    try { return await this.getProperty('time-pos'); } catch { return 0; }
  }

  async getDuration() {
    try { return await this.getProperty('duration'); } catch { return 0; }
  }

  async getVolume() {
    try { return await this.getProperty('volume'); } catch { return 100; }
  }

  async isPaused() {
    try { return await this.getProperty('pause'); } catch { return false; }
  }

  // ─── Event listeners ──────────────────────────────────────────────────────
  on(event, handler) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(handler);
  }

  off(event, handler) {
    if (!this.listeners.has(event)) return;
    const handlers = this.listeners.get(event).filter(h => h !== handler);
    this.listeners.set(event, handlers);
  }

  isInstalled() {
    return new Promise((resolve) => {
      const mpvBinary = getMpvPath();
      const proc = spawn(mpvBinary, ['--version'], { stdio: 'ignore' });
      proc.on('error', () => resolve(false));
      proc.on('close', (code) => resolve(code === 0));
    });
  }
}
