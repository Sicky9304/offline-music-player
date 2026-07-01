import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DEFAULT_SETTINGS } from '../data/defaultSettings.js';
import { ipc } from '../utils/ipc.js';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loaded, setLoaded]     = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await ipc.settings.getAll();
        setSettings(prev => ({ ...prev, ...saved }));
      } catch (e) {
        console.error('Failed to load settings:', e);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const updateSetting = useCallback(async (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    try { await ipc.settings.set(key, value); } catch (e) { console.error(e); }
  }, []);

  const updateMany = useCallback(async (updates) => {
    setSettings(prev => ({ ...prev, ...updates }));
    for (const [key, value] of Object.entries(updates)) {
      try { await ipc.settings.set(key, value); } catch (e) { console.error(e); }
    }
  }, []);

  const resetSettings = useCallback(async () => {
    setSettings(DEFAULT_SETTINGS);
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      try { await ipc.settings.set(key, value); } catch (e) { console.error(e); }
    }
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, updateMany, resetSettings, loaded }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be inside SettingsProvider');
  return ctx;
}
