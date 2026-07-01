import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { THEMES, ACCENT_COLORS, DEFAULT_THEME_ID, DEFAULT_ACCENT_ID } from '../data/themes.js';
import { ipc } from '../utils/ipc.js';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeId, setThemeId]   = useState(DEFAULT_THEME_ID);
  const [accentId, setAccentId] = useState(DEFAULT_ACCENT_ID);

  // Apply CSS variables to :root
  const applyTheme = useCallback((tId, aId) => {
    const theme  = THEMES.find(t => t.id === tId) || THEMES[0];
    const accent = ACCENT_COLORS.find(a => a.id === aId) || ACCENT_COLORS[0];
    const root   = document.documentElement;

    // Apply theme vars
    Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));

    // Apply accent color as HSL shades
    root.style.setProperty('--accent', accent.hex);
    root.style.setProperty('--accent-hsl', accent.hsl);

    // Generate accent shades from hex
    const shades = generateShades(accent.hex);
    shades.forEach((val, idx) => {
      const key = [50,100,200,300,400,500,600,700,800,900][idx];
      root.style.setProperty(`--accent-${key}`, val);
    });

    // Theme class for Tailwind
    root.className = '';
    if (tId === 'light') root.classList.add('light');
    else root.classList.add('dark');
  }, []);

  // Load saved theme
  useEffect(() => {
    (async () => {
      try {
        const all = await ipc.settings.getAll();
        const tid = all.themeId  || DEFAULT_THEME_ID;
        const aid = all.accentId || DEFAULT_ACCENT_ID;
        setThemeId(tid);
        setAccentId(aid);
        applyTheme(tid, aid);
      } catch {
        applyTheme(DEFAULT_THEME_ID, DEFAULT_ACCENT_ID);
      }
    })();
  }, [applyTheme]);

  const changeTheme = useCallback(async (id) => {
    setThemeId(id);
    applyTheme(id, accentId);
    await ipc.settings.set('themeId', id);
  }, [accentId, applyTheme]);

  const changeAccent = useCallback(async (id) => {
    setAccentId(id);
    applyTheme(themeId, id);
    await ipc.settings.set('accentId', id);
  }, [themeId, applyTheme]);

  return (
    <ThemeContext.Provider value={{ themeId, accentId, changeTheme, changeAccent, themes: THEMES, accents: ACCENT_COLORS }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider');
  return ctx;
}

// ─── Shade Generator ──────────────────────────────────────────────────────────
function hexToHsl(hex) {
  const r = parseInt(hex.slice(1,3),16)/255;
  const g = parseInt(hex.slice(3,5),16)/255;
  const b = parseInt(hex.slice(5,7),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h, s, l = (max+min)/2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    switch(max) {
      case r: h = ((g-b)/d + (g<b?6:0))/6; break;
      case g: h = ((b-r)/d + 2)/6; break;
      case b: h = ((r-g)/d + 4)/6; break;
    }
  }
  return [h*360, s*100, l*100];
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h/30) % 12;
  const a = s * Math.min(l, 1-l);
  const f = n => l - a * Math.max(-1, Math.min(k(n)-3, Math.min(9-k(n),1)));
  const toHex = x => Math.round(255*x).toString(16).padStart(2,'0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

function generateShades(hex) {
  const [h, s] = hexToHsl(hex);
  const lightnesses = [97, 93, 85, 74, 62, 49, 39, 30, 22, 14];
  return lightnesses.map(l => hslToHex(h, s * 0.9, l));
}
