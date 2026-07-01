import { useSettings } from '../hooks/useSettings.jsx';
import { useLibrary } from '../hooks/useLibrary.jsx';
import { useToast } from '../components/Toast.jsx';
import { Settings as SettingsIcon, Volume2, Zap, RefreshCw, Trash2, Type, Square } from 'lucide-react';

function Section({ title, children }) {
  return (
    <div className="rounded-2xl border p-5 space-y-4" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
      <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{title}</h2>
      {children}
    </div>
  );
}

function SettingRow({ label, description, children }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1">
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
        {description && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ id, value, onChange }) {
  return (
    <button
      id={id}
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-[var(--accent)]' : 'bg-zinc-600'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : ''}`} />
    </button>
  );
}

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

export default function Settings() {
  const { settings, updateSetting, resetSettings } = useSettings();
  const { clearHistory } = useLibrary();
  const toast = useToast();

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-6 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SettingsIcon size={22} style={{ color: 'var(--text-secondary)' }} />
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>Settings</h1>
          </div>
          <button id="reset-settings-btn" onClick={() => { resetSettings(); toast.success('Settings reset to defaults'); }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm border hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
            <RefreshCw size={14} /> Reset
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Playback */}
        <Section title="Playback">
          <SettingRow label="Default Volume" description="Volume level when starting the app">
            <div className="flex items-center gap-2">
              <Volume2 size={14} style={{ color: 'var(--text-muted)' }} />
              <input type="range" min="0" max="200" value={settings.defaultVolume}
                onChange={e => updateSetting('defaultVolume', Number(e.target.value))}
                className="w-24 accent-[var(--accent)] cursor-pointer" id="setting-volume" />
              <span className={`text-xs w-12 text-right font-mono font-bold ${settings.defaultVolume > 100 ? 'text-amber-400' : 'text-zinc-400'}`}>
                {settings.defaultVolume > 100 ? `+${settings.defaultVolume - 100}%` : `${settings.defaultVolume}%`}
              </span>
            </div>
          </SettingRow>
          <SettingRow label="Default Speed" description="Playback speed when starting">
            <select id="setting-speed" value={settings.defaultSpeed}
              onChange={e => updateSetting('defaultSpeed', Number(e.target.value))}
              className="px-2 py-1.5 rounded-lg text-sm border outline-none"
              style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
              {SPEED_OPTIONS.map(s => <option key={s} value={s}>{s}x</option>)}
            </select>
          </SettingRow>
          <SettingRow label="Resume Playback" description="Continue from where you left off">
            <Toggle id="setting-resume" value={settings.resumePlayback} onChange={v => updateSetting('resumePlayback', v)} />
          </SettingRow>
          <SettingRow label="Remember Position" description="Save position in long files">
            <Toggle id="setting-remember-pos" value={settings.rememberPosition} onChange={v => updateSetting('rememberPosition', v)} />
          </SettingRow>
          <SettingRow label="Crossfade" description="Smooth transition between tracks">
            <Toggle id="setting-crossfade" value={settings.crossfade} onChange={v => updateSetting('crossfade', v)} />
          </SettingRow>
          {settings.crossfade && (
            <SettingRow label="Crossfade Duration" description="Seconds of overlap">
              <div className="flex items-center gap-2">
                <input type="range" min="1" max="10" value={settings.crossfadeDuration}
                  onChange={e => updateSetting('crossfadeDuration', Number(e.target.value))}
                  className="w-24 accent-[var(--accent)] cursor-pointer" id="setting-crossfade-dur" />
                <span className="text-xs w-4" style={{ color: 'var(--text-secondary)' }}>{settings.crossfadeDuration}s</span>
              </div>
            </SettingRow>
          )}
        </Section>

        {/* Dolby Atmos Spatial Audio */}
        <Section title="Dolby Atmos Spatial Audio">
          <SettingRow label="Dolby Atmos" description="Enable 3D virtual surround sound spatializer">
            <Toggle id="setting-atmos-toggle" value={settings.dolbyAtmos} onChange={v => updateSetting('dolbyAtmos', v)} />
          </SettingRow>
          {settings.dolbyAtmos && (
            <SettingRow label="Default Atmos Mode" description="Choose soundstage configuration">
              <select id="setting-atmos-mode" value={settings.atmosMode}
                onChange={e => updateSetting('atmosMode', e.target.value)}
                className="px-2 py-1.5 rounded-lg text-sm border outline-none"
                style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                <option value="music">Music Mode (Wide stereo soundstage)</option>
                <option value="movie">Movie Mode (Boosts dialogues & bass)</option>
                <option value="spatial">Spatial Mode (Maximum 3D separation)</option>
              </select>
            </SettingRow>
          )}
        </Section>

        {/* Subtitles */}
        <Section title="Subtitles">
          <SettingRow label="Subtitle Size" description="Font size in pixels">
            <div className="flex items-center gap-2">
              <input type="range" min="12" max="48" value={settings.subtitleSize}
                onChange={e => updateSetting('subtitleSize', Number(e.target.value))}
                className="w-24 accent-[var(--accent)] cursor-pointer" id="setting-sub-size" />
              <span className="text-xs w-8" style={{ color: 'var(--text-secondary)' }}>{settings.subtitleSize}px</span>
            </div>
          </SettingRow>
          <SettingRow label="Subtitle Color">
            <input type="color" value={settings.subtitleColor}
              onChange={e => updateSetting('subtitleColor', e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent" id="setting-sub-color" />
          </SettingRow>
          <SettingRow label="Subtitle Delay" description="Seconds (negative = earlier)">
            <div className="flex items-center gap-2">
              <input type="range" min="-5" max="5" step="0.1" value={settings.subtitleDelay}
                onChange={e => updateSetting('subtitleDelay', Number(e.target.value))}
                className="w-24 accent-[var(--accent)] cursor-pointer" id="setting-sub-delay" />
              <span className="text-xs w-8" style={{ color: 'var(--text-secondary)' }}>{settings.subtitleDelay}s</span>
            </div>
          </SettingRow>
        </Section>

        {/* UI */}
        <Section title="Interface">
          <SettingRow label="Show Animations" description="Enable motion animations">
            <Toggle id="setting-animations" value={settings.animationsEnabled} onChange={v => updateSetting('animationsEnabled', v)} />
          </SettingRow>
          <SettingRow label="Compact View" description="Smaller cards and less spacing">
            <Toggle id="setting-compact" value={settings.compactView} onChange={v => updateSetting('compactView', v)} />
          </SettingRow>
          <SettingRow label="Show File Extensions" description="Show format labels on cards">
            <Toggle id="setting-extensions" value={settings.showFileExtensions} onChange={v => updateSetting('showFileExtensions', v)} />
          </SettingRow>
        </Section>

        {/* Library */}
        <Section title="Library">
          <SettingRow label="Clear Play History" description="Remove all play history records">
            <button id="clear-hist-btn"
              onClick={async () => { await clearHistory(); toast.success('History cleared'); }}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border hover:bg-red-500/10 hover:border-red-500/30 transition-colors"
              style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
              <Trash2 size={14} />
            </button>
          </SettingRow>
          <SettingRow label="Auto Scan on Start" description="Rescan watched folders on startup">
            <Toggle id="setting-autoscan" value={settings.autoScan} onChange={v => updateSetting('autoScan', v)} />
          </SettingRow>
          <SettingRow label="Group by Album" description="Group music by album in library">
            <Toggle id="setting-groupalbum" value={settings.groupByAlbum} onChange={v => updateSetting('groupByAlbum', v)} />
          </SettingRow>
        </Section>
      </div>
    </div>
  );
}
