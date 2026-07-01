import { createContext, useContext, useState, useEffect } from 'react';
import { ipc } from '../utils/ipc.js';

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState({ name: 'User', email: '', bio: '', avatar: null });

  useEffect(() => {
    (async () => {
      try {
        const p = await ipc.profile.get();
        if (p) setProfile(p);
      } catch {}
    })();
  }, []);

  const updateProfile = async (data) => {
    try {
      const updated = await ipc.profile.update(data);
      if (updated) setProfile(updated);
      return updated;
    } catch (e) {
      console.error('[Profile] Update failed:', e);
      return null;
    }
  };

  return (
    <ProfileContext.Provider value={{ profile, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be inside ProfileProvider');
  return ctx;
}
