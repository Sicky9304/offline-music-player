import { useState, useMemo } from 'react';
import { Video, Grid, List } from 'lucide-react';
import { useLibrary } from '../hooks/useLibrary.jsx';
import MediaCard from '../components/player/MediaCard.jsx';
import PlaylistModal from '../components/playlist/PlaylistModal.jsx';
import { motion } from 'framer-motion';
import SectionHeader from '../components/ui/SectionHeader.jsx';
import SearchBar from '../components/ui/SearchBar.jsx';

export default function Videos() {
  const { library } = useLibrary();
  const [search, setSearch] = useState('');
  const [view, setView] = useState('grid');
  const [plModal, setPlModal] = useState(null);

  const videos = useMemo(() => {
    let items = library.filter(m => m.type === 'video');
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(m =>
        m.title?.toLowerCase().includes(q) || m.fileName?.toLowerCase().includes(q)
      );
    }
    return items;
  }, [library, search]);

  return (
    <div className="flex flex-col h-full page-enter">
      {/* Header bar */}
      <div className="flex-shrink-0 px-6 py-5 border-b" style={{ borderColor: 'var(--glass-border)' }}>
        <SectionHeader
          title="Video Library"
          subtitle={`${videos.length} videos found`}
          badge="Visuals"
          icon={Video}
        />
        
        {/* Controls strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search videos…"
            onClear={() => setSearch('')}
            className="h-10 text-xs rounded-xl flex-1 max-w-sm"
          />

          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setView('grid')}
              className={`p-1.5 rounded-lg transition-all ${view === 'grid' ? 'bg-white text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-white'}`}
              title="Grid View"
            >
              <Grid size={14} />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-1.5 rounded-lg transition-all ${view === 'list' ? 'bg-white text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-white'}`}
              title="List View"
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Video list/grid catalog */}
      <div className="flex-1 overflow-y-auto p-6">
        {videos.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-48 text-center space-y-2">
            <span className="text-4xl">🎬</span>
            <p className="text-sm font-bold text-zinc-400">No videos yet</p>
            <p className="text-xs text-zinc-500">Drop video files or scan folder on the Library tab.</p>
          </motion.div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {videos.map((m, i) => (
              <MediaCard key={m.id} media={m} queue={videos} index={i} onAddToPlaylist={setPlModal} />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {videos.map((m, i) => (
              <MediaCard key={m.id} media={m} queue={videos} index={i} compact onAddToPlaylist={setPlModal} />
            ))}
          </div>
        )}
      </div>
      <PlaylistModal open={!!plModal} onClose={() => setPlModal(null)} mediaToAdd={plModal} />
    </div>
  );
}
