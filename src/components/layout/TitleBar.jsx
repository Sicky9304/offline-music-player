import { ipc } from '../../utils/ipc';
import { Minus, X, Maximize2, AudioLines } from 'lucide-react';

export default function TitleBar() {
  return (
    <div
      className="flex items-center justify-between h-10 px-4 select-none flex-shrink-0 border-b glass-surface z-50"
      style={{
        WebkitAppRegion: 'drag',
        borderColor: 'var(--glass-border)',
      }}
    >
      {/* App name / branding */}
      <div className="flex items-center gap-2">
        <AudioLines size={14} className="text-gradient" />
        <span className="text-xs font-bold font-brand tracking-wider uppercase text-gradient">
          Music Hub Player
        </span>
      </div>

      {/* Window controls */}
      <div
        className="flex items-center gap-1.5"
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        <button
          id="win-minimize"
          onClick={() => ipc.minimize()}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-white/5 active:scale-95 glass-button"
          style={{ color: 'var(--text-secondary)' }}
          title="Minimize"
        >
          <Minus size={13} />
        </button>
        <button
          id="win-maximize"
          onClick={() => ipc.maximize()}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-white/5 active:scale-95 glass-button"
          style={{ color: 'var(--text-secondary)' }}
          title="Maximize"
        >
          <Maximize2 size={11} />
        </button>
        <button
          id="win-close"
          onClick={() => ipc.close()}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-red-500/20 hover:text-red-400 active:scale-95 glass-button hover:border-red-500/30"
          style={{ color: 'var(--text-secondary)' }}
          title="Close"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}
