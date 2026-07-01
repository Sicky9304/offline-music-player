import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useLibrary } from '../hooks/useLibrary.jsx';
import { useTheme } from '../hooks/useTheme.jsx';
import MediaCard from '../components/MediaCard.jsx';
import PlaylistModal from '../components/PlaylistModal.jsx';
import { motion } from 'framer-motion';

export default function Music() {
  const { library } = useLibrary();
  const { themeId } = useTheme();
  const [search, setSearch] = useState('');
  const [groupBy, setGroupBy] = useState('none');
  const [plModal, setPlModal] = useState(null);

  const tracks = useMemo(() => {
    let items = library.filter(m => m.type === 'audio');
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(m =>
        m.title?.toLowerCase().includes(q) || m.artist?.toLowerCase().includes(q) || m.album?.toLowerCase().includes(q)
      );
    }
    return items;
  }, [library, search]);

  const grouped = useMemo(() => {
    if (groupBy === 'none') return { '': tracks };
    const map = {};
    tracks.forEach(m => {
      const key = (groupBy === 'artist' ? m.artist : m.album) || 'Unknown';
      if (!map[key]) map[key] = [];
      map[key].push(m);
    });
    return Object.fromEntries(Object.entries(map).sort(([a],[b]) => a.localeCompare(b)));
  }, [tracks, groupBy]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-6 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>Music</h1>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{tracks.length} tracks</p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border flex-1 max-w-xs" style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)' }}>
            <Search size={15} style={{ color: 'var(--text-muted)' }} />
            <input id="music-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tracks…"
              className="bg-transparent text-sm outline-none flex-1" style={{ color: 'var(--text-primary)' }} />
          </div>
          <select id="music-group" value={groupBy} onChange={e => setGroupBy(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm border outline-none"
            style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
            <option value="none">No grouping</option>
            <option value="artist">By Artist</option>
            <option value="album">By Album</option>
          </select>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {tracks.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-48 text-center">
            <span className="text-5xl mb-3">🎵</span>
            <p className="text-lg font-semibold" style={{ color: 'var(--text-secondary)' }}>No music yet</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Add audio files from the Library page</p>
          </motion.div>
        ) : (
          Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              {group && <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>{group}</h2>}
              <div className={themeId === 'theme3d' ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4" : "space-y-1"}>
                {items.map((m, i) => (
                  <MediaCard
                    key={m.id}
                    media={m}
                    queue={items}
                    index={i}
                    compact={themeId !== 'theme3d'}
                    onAddToPlaylist={setPlModal}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
      <PlaylistModal open={!!plModal} onClose={() => setPlModal(null)} mediaToAdd={plModal} />
    </div>
  );
}
