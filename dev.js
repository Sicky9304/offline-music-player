import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const viteBin     = path.join(__dirname, 'node_modules/vite/bin/vite.js');
const waitOnBin   = path.join(__dirname, 'node_modules/wait-on/bin/wait-on');
const electronBin = path.join(__dirname, 'node_modules/electron/cli.js');

console.log('[Dev] Starting Vite development server...');
const vite = spawn('node', [viteBin], { stdio: 'inherit', env: process.env });

console.log('[Dev] Waiting for http://localhost:5173 to be ready...');
const wait = spawn('node', [waitOnBin, 'http://localhost:5173'], { stdio: 'inherit' });

wait.on('exit', (code) => {
  if (code === 0) {
    console.log('[Dev] Vite is ready. Launching Electron app...');
    const electron = spawn('node', [electronBin, '.'], { stdio: 'inherit', env: process.env });

    electron.on('exit', () => {
      console.log('[Dev] Electron closed. Shutting down Vite...');
      vite.kill();
      process.exit(0);
    });
  } else {
    console.error('[Dev] Wait-on failed. Stopping Vite...');
    vite.kill();
    process.exit(code || 1);
  }
});

process.on('SIGINT', () => {
  vite.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  vite.kill();
  process.exit(0);
});
