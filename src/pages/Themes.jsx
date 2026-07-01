import { useTheme } from '../hooks/useTheme.jsx';
import { motion } from 'framer-motion';
import { CheckCircle2, Palette } from 'lucide-react';

export default function Themes() {
  const { themeId, accentId, changeTheme, changeAccent, themes, accents } = useTheme();

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-6 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <Palette size={22} style={{ color: 'var(--text-secondary)' }} />
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>Themes</h1>
        </div>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Customize the look and feel of Offline Media Hub</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Theme selector */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Theme</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {themes.map(theme => (
              <motion.button
                key={theme.id}
                id={`theme-${theme.id}`}
                onClick={() => changeTheme(theme.id)}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.97 }}
                className={`relative rounded-2xl overflow-hidden border-2 p-4 text-left transition-all ${themeId === theme.id ? 'ring-2' : ''}`}
                style={{
                  background: theme.preview,
                  borderColor: themeId === theme.id ? 'var(--accent)' : 'var(--border)',
                  ringColor: 'var(--accent)',
                }}
              >
                {/* Preview dots */}
                <div className="flex gap-1 mb-3">
                  {['#ff5f57','#febc2e','#28c840'].map(c => (
                    <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                  ))}
                </div>
                {/* Mock content */}
                <div className="space-y-1 mb-3">
                  <div className="h-1.5 rounded-full w-3/4 opacity-60" style={{ background: theme.vars['--text-primary'] }} />
                  <div className="h-1 rounded-full w-1/2 opacity-30" style={{ background: theme.vars['--text-primary'] }} />
                </div>

                <p className="text-xs font-semibold" style={{ color: theme.vars['--text-primary'] }}>{theme.name}</p>
                <p className="text-xs opacity-60" style={{ color: theme.vars['--text-secondary'] }}>{theme.description}</p>

                {themeId === theme.id && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 size={18} style={{ color: 'var(--accent)' }} fill="currentColor" />
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Accent color */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Accent Color</h2>
          <div className="flex flex-wrap gap-3">
            {accents.map(acc => (
              <motion.button
                key={acc.id}
                id={`accent-${acc.id}`}
                onClick={() => changeAccent(acc.id)}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
                title={acc.name}
                className={`w-10 h-10 rounded-full border-2 transition-all ${accentId === acc.id ? 'ring-2 ring-offset-2' : ''}`}
                style={{
                  background:   acc.hex,
                  borderColor:  accentId === acc.id ? acc.hex : 'transparent',
                  ringColor:    acc.hex,
                  ringOffsetColor: 'var(--bg-primary)',
                  boxShadow:    accentId === acc.id ? `0 0 12px ${acc.hex}88` : '',
                }}
              >
                {accentId === acc.id && (
                  <CheckCircle2 size={16} className="text-white mx-auto" />
                )}
              </motion.button>
            ))}
          </div>
          <p className="text-xs mt-3 capitalize" style={{ color: 'var(--text-muted)' }}>
            Current: {accents.find(a => a.id === accentId)?.name}
          </p>
        </div>

        {/* Preview card */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Preview</h2>
          <div className="rounded-2xl border p-5 space-y-3" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: 'var(--accent)' }}>🎵</div>
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Sample Track Title</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Sample Artist · Sample Album</p>
              </div>
            </div>
            <div className="h-1.5 rounded-full" style={{ background: 'var(--bg-tertiary)' }}>
              <div className="h-full w-2/3 rounded-full" style={{ background: 'var(--accent)' }} />
            </div>
            <div className="flex justify-center gap-4">
              {['⏮','⏪','⏯','⏩','⏭'].map(c => (
                <span key={c} className="text-lg cursor-pointer">{c}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
