import { useState, useMemo } from 'react';
import { Music as MusicIcon, Grid, List } from 'lucide-react';
import { useLibrary } from '../hooks/useLibrary.jsx';
import MediaCard from '../components/player/MediaCard.jsx';
import PlaylistModal from '../components/playlist/PlaylistModal.jsx';
import { motion } from 'framer-motion';
import SectionHeader from '../components/ui/SectionHeader.jsx';
import SearchBar from '../components/ui/SearchBar.jsx';

export default function Music() {
  const { library } = useLibrary();
  const [search, setSearch] = useState('');
  const [groupBy, setGroupBy] = useState('none');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
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
    <div className="flex flex-col h-full page-enter">
      {/* Header bar */}
      <div className="flex-shrink-0 px-6 py-5 border-b" style={{ borderColor: 'var(--glass-border)' }}>
        <SectionHeader
          title="Music Library"
          subtitle={`${tracks.length} tracks found`}
          badge="Your Collection"
          icon={MusicIcon}
        />
        
        {/* Controls strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
          <div className="flex items-center gap-3 flex-1 max-w-sm">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search tracks…"
              onClear={() => setSearch('')}
              className="h-10 text-xs rounded-xl"
            />
            
            <select 
              id="music-group" 
              value={groupBy} 
              onChange={e => setGroupBy(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs border outline-none bg-zinc-900 border-white/5 text-zinc-300 font-semibold h-10"
            >
              <option value="none">No Grouping</option>
              <option value="artist">By Artist</option>
              <option value="album">By Album</option>
            </select>
          </div>

          {/* View mode buttons */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-white'}`}
              title="List View"
            >
              <List size={14} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-white'}`}
              title="Grid View"
            >
              <Grid size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Track catalog */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {tracks.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-48 text-center space-y-2">
            <span className="text-4xl">🎵</span>
            <p className="text-sm font-bold text-zinc-400">No music yet</p>
            <p className="text-xs text-zinc-500">Drop audio files or scan folder on the Library tab.</p>
          </motion.div>
        ) : (
          Object.entries(grouped).map(([group, items]) => (
            <div key={group} className="space-y-3">
              {group && <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{group}</h2>}
              <div className={viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4" : "space-y-1"}>
                {items.map((m, i) => (
                  <MediaCard
                    key={m.id}
                    media={m}
                    queue={items}
                    index={i}
                    compact={viewMode === 'list'}
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
