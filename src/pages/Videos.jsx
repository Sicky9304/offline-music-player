import { useState, useMemo } from 'react';
import { Search, Grid, List } from 'lucide-react';
import { useLibrary } from '../hooks/useLibrary.jsx';
import MediaCard from '../components/MediaCard.jsx';
import PlaylistModal from '../components/PlaylistModal.jsx';
import { motion } from 'framer-motion';

export default function Videos() {
  const { library } = useLibrary();
  const [search, setSearch] = useState('');
  const [view,   setView]   = useState('grid');
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
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-6 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>Videos</h1>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{videos.length} videos</p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border flex-1 max-w-xs" style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)' }}>
            <Search size={15} style={{ color: 'var(--text-muted)' }} />
            <input id="video-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search videos…"
              className="bg-transparent text-sm outline-none flex-1" style={{ color: 'var(--text-primary)' }} />
          </div>
          <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
            <button id="videos-grid" onClick={() => setView('grid')} className="p-2 transition-colors"
              style={{ background: view === 'grid' ? 'var(--accent)' : 'var(--bg-tertiary)', color: view === 'grid' ? 'white' : 'var(--text-muted)' }}>
              <Grid size={16} />
            </button>
            <button id="videos-list" onClick={() => setView('list')} className="p-2 transition-colors"
              style={{ background: view === 'list' ? 'var(--accent)' : 'var(--bg-tertiary)', color: view === 'list' ? 'white' : 'var(--text-muted)' }}>
              <List size={16} />
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {videos.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-48 text-center">
            <span className="text-5xl mb-3">🎬</span>
            <p className="text-lg font-semibold" style={{ color: 'var(--text-secondary)' }}>No videos yet</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Add video files from the Library page</p>
          </motion.div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {videos.map((m, i) => <MediaCard key={m.id} media={m} queue={videos} index={i} onAddToPlaylist={setPlModal} />)}
          </div>
        ) : (
          <div className="space-y-1">
            {videos.map((m, i) => <MediaCard key={m.id} media={m} queue={videos} index={i} compact onAddToPlaylist={setPlModal} />)}
          </div>
        )}
      </div>
      <PlaylistModal open={!!plModal} onClose={() => setPlModal(null)} mediaToAdd={plModal} />
    </div>
  );
}
