import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { MOODS } from '../data/moods.js';
import { ipc } from '../utils/ipc.js';
import { useTheme } from './useTheme.jsx';

const MoodContext = createContext(null);

export function MoodProvider({ children }) {
  const [activeMood, setActiveMoodState] = useState(null);
  const { themeId, accentId, applyTheme } = useTheme();

  // Load saved mood on mount
  useEffect(() => {
    (async () => {
      try {
        const all = await ipc.settings.getAll();
        if (all?.activeMood) {
          const mood = MOODS.find(m => m.id === all.activeMood);
          if (mood) {
            setActiveMoodState(mood.id);
            applyMoodCSS(mood);
          }
        }
      } catch {}
    })();
  }, []);

  const setMood = useCallback(async (moodId) => {
    if (activeMood === moodId) {
      // Toggle off
      setActiveMoodState(null);
      clearMoodCSS();
      applyTheme(themeId, accentId);
      try { await ipc.settings.set('activeMood', null); } catch {}
      return;
    }
    const mood = MOODS.find(m => m.id === moodId);
    if (!mood) return;
    setActiveMoodState(moodId);
    applyMoodCSS(mood);
    try { await ipc.settings.set('activeMood', moodId); } catch {}
  }, [activeMood, themeId, accentId, applyTheme]);

  const clearMood = useCallback(async () => {
    setActiveMoodState(null);
    clearMoodCSS();
    applyTheme(themeId, accentId);
    try { await ipc.settings.set('activeMood', null); } catch {}
  }, [themeId, accentId, applyTheme]);

  const moodConfig = activeMood ? MOODS.find(m => m.id === activeMood) : null;

  return (
    <MoodContext.Provider value={{ activeMood, setMood, clearMood, moodConfig, MOODS }}>
      {children}
    </MoodContext.Provider>
  );
}

export function useMood() {
  const ctx = useContext(MoodContext);
  if (!ctx) throw new Error('useMood must be inside MoodProvider');
  return ctx;
}

// ─── CSS Application ──────────────────────────────────────────────────────────

function applyMoodCSS(mood) {
  const root = document.documentElement;
  if (mood.cssOverrides) {
    Object.entries(mood.cssOverrides).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }
}

function clearMoodCSS() {
  const root = document.documentElement;
  // Remove mood-specific overrides (theme will re-apply its own accent)
  root.style.removeProperty('--mood-gradient');
  // Note: accent is NOT removed here because useTheme will re-apply it
}
