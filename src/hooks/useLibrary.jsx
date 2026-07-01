import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ipc } from '../utils/ipc.js';

const LibraryContext = createContext(null);

export function LibraryProvider({ children }) {
  const [library,   setLibrary]   = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [history,   setHistory]   = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [dbStatus,  setDbStatus]  = useState({ connected: false });

  // Initial load
  useEffect(() => {
    loadAll();
    // Listen for DB status
    const unsub = ipc.on('db:status', (status) => setDbStatus(status));
    ipc.dbStatus().then(s => s && setDbStatus(s)).catch(() => {});
    return unsub;
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [lib, pls, favs, hist] = await Promise.all([
        ipc.media.getAll(),
        ipc.playlist.getAll(),
        ipc.media.getFavorites(),
        ipc.history.getAll(),
      ]);
      setLibrary(lib   || []);
      setPlaylists(pls || []);
      setFavorites(favs|| []);
      setHistory(hist  || []);
    } catch (e) {
      console.error('[Library] Load failed:', e);
    } finally {
      setLoading(false);
    }
  }

  // ─── Import ───────────────────────────────────────────────────────────────
  const importFiles = useCallback(async () => {
    const items = await ipc.openFiles();
    if (!items?.length) return [];
    const saved = await ipc.media.addMany(items);
    setLibrary(prev => mergeById(prev, saved));
    return saved;
  }, []);

  const importFolder = useCallback(async () => {
    const items = await ipc.openFolder();
    if (!items?.length) return [];
    const saved = await ipc.media.addMany(items);
    setLibrary(prev => mergeById(prev, saved));
    return saved;
  }, []);

  const importDropped = useCallback(async (items) => {
    if (!items?.length) return [];
    const saved = await ipc.media.addMany(items);
    setLibrary(prev => mergeById(prev, saved));
    return saved;
  }, []);

  // ─── Media ops ────────────────────────────────────────────────────────────
  const deleteMedia = useCallback(async (id) => {
    await ipc.media.delete(id);
    setLibrary(prev => prev.filter(m => m.id !== id));
    setFavorites(prev => prev.filter(m => m.id !== id));
  }, []);

  const toggleFavorite = useCallback(async (id) => {
    const updated = await ipc.media.toggleFav(id);
    if (!updated) return;
    setLibrary(prev => prev.map(m => m.id === id ? { ...m, favorite: updated.favorite } : m));
    if (updated.favorite) setFavorites(prev => [...prev.filter(m => m.id !== id), updated]);
    else setFavorites(prev => prev.filter(m => m.id !== id));
    return updated;
  }, []);

  // ─── Playlists ────────────────────────────────────────────────────────────
  const createPlaylist = useCallback(async (name, description = '') => {
    const pl = await ipc.playlist.create(name, description);
    setPlaylists(prev => [pl, ...prev]);
    return pl;
  }, []);

  const updatePlaylist = useCallback(async (id, updates) => {
    const pl = await ipc.playlist.update(id, updates);
    setPlaylists(prev => prev.map(p => p.id === id ? pl : p));
    return pl;
  }, []);

  const deletePlaylist = useCallback(async (id) => {
    await ipc.playlist.delete(id);
    setPlaylists(prev => prev.filter(p => p.id !== id));
  }, []);

  const addToPlaylist = useCallback(async (playlistId, mediaId) => {
    const pl = await ipc.playlist.addMedia(playlistId, mediaId);
    setPlaylists(prev => prev.map(p => p.id === playlistId ? pl : p));
    return pl;
  }, []);

  const removeFromPlaylist = useCallback(async (playlistId, mediaId) => {
    const pl = await ipc.playlist.removeMedia(playlistId, mediaId);
    setPlaylists(prev => prev.map(p => p.id === playlistId ? pl : p));
    return pl;
  }, []);

  // ─── History ──────────────────────────────────────────────────────────────
  const addHistory = useCallback(async (item) => {
    const h = await ipc.history.add(item);
    if (h) setHistory(prev => [h, ...prev.slice(0, 499)]);
  }, []);

  const clearHistory = useCallback(async () => {
    await ipc.history.clear();
    setHistory([]);
  }, []);

  // ─── Search ───────────────────────────────────────────────────────────────
  const searchMedia = useCallback(async (query) => {
    if (!query) return library;
    return await ipc.media.search(query);
  }, [library]);

  const filterLibrary = useCallback((type, query = '') => {
    let items = library;
    if (type)  items = items.filter(m => m.type === type);
    if (query) {
      const q = query.toLowerCase();
      items = items.filter(m =>
        m.title?.toLowerCase().includes(q) ||
        m.artist?.toLowerCase().includes(q) ||
        m.album?.toLowerCase().includes(q) ||
        m.fileName?.toLowerCase().includes(q)
      );
    }
    return items;
  }, [library]);

  return (
    <LibraryContext.Provider value={{
      library, playlists, favorites, history, loading, dbStatus,
      importFiles, importFolder, importDropped,
      deleteMedia, toggleFavorite,
      createPlaylist, updatePlaylist, deletePlaylist, addToPlaylist, removeFromPlaylist,
      addHistory, clearHistory,
      searchMedia, filterLibrary,
      reload: loadAll,
    }}>
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary must be inside LibraryProvider');
  return ctx;
}

function mergeById(existing, incoming) {
  const map = new Map(existing.map(m => [m.id, m]));
  incoming.forEach(m => map.set(m.id, m));
  return Array.from(map.values()).sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
}
