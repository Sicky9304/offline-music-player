import { ipc } from '../utils/ipc.js';
import { Minus, Square, X, Maximize2 } from 'lucide-react';

export default function TitleBar() {
  return (
    <div
      className="flex items-center justify-between h-10 px-4 select-none flex-shrink-0 border-b"
      style={{
        WebkitAppRegion: 'drag',
        background: 'var(--bg-primary)',
        borderColor: 'var(--border)',
      }}
    >
      {/* App name */}
      <div className="flex items-center gap-2.5">
        <div className="w-5 h-5 rounded-md flex items-center justify-center text-xs"
          style={{ background: 'var(--accent)' }}>
          🎵
        </div>
        <span className="text-xs font-semibold tracking-wide" style={{ color: 'var(--text-secondary)' }}>
          Offline Media Hub
        </span>
      </div>

      {/* Window controls */}
      <div
        className="flex items-center gap-1"
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        <button
          id="win-minimize"
          onClick={() => ipc.minimize()}
          className="w-8 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-white/10"
          style={{ color: 'var(--text-muted)' }}
        >
          <Minus size={14} />
        </button>
        <button
          id="win-maximize"
          onClick={() => ipc.maximize()}
          className="w-8 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-white/10"
          style={{ color: 'var(--text-muted)' }}
        >
          <Maximize2 size={12} />
        </button>
        <button
          id="win-close"
          onClick={() => ipc.close()}
          className="w-8 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-red-500/80 hover:text-white"
          style={{ color: 'var(--text-muted)' }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
