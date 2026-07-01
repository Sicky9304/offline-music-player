import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FolderOpen, Upload, Search, Grid, List, SortAsc, Filter, Music, Video as VideoIcon } from 'lucide-react';
import { useLibrary } from '../hooks/useLibrary.jsx';
import { useTheme } from '../hooks/useTheme.jsx';
import { useToast } from '../components/Toast.jsx';
import MediaCard from '../components/MediaCard.jsx';
import PlaylistModal from '../components/PlaylistModal.jsx';

export default function Library() {
  const { library, loading, importFiles, importFolder } = useLibrary();
  const { themeId } = useTheme();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [view,   setView]   = useState('grid');
  const [filter, setFilter] = useState('all'); // all | audio | video
  const [sort,   setSort]   = useState('dateAdded');
  const [plModal, setPlModal] = useState(null);

  const is3DTheme = themeId === 'theme3d';
  const effectiveView = is3DTheme ? 'grid' : view;

  const filtered = useMemo(() => {
    let items = [...library];
    if (filter !== 'all') items = items.filter(m => m.type === filter);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(m =>
        m.title?.toLowerCase().includes(q) || m.artist?.toLowerCase().includes(q) ||
        m.album?.toLowerCase().includes(q) || m.fileName?.toLowerCase().includes(q)
      );
    }
    items.sort((a, b) => {
      if (sort === 'title')     return (a.title||'').localeCompare(b.title||'');
      if (sort === 'artist')    return (a.artist||'').localeCompare(b.artist||'');
      if (sort === 'duration')  return (b.duration||0) - (a.duration||0);
      return new Date(b.dateAdded) - new Date(a.dateAdded);
    });
    return items;
  }, [library, search, filter, sort]);

  const handleImportFiles = async () => {
    const added = await importFiles();
    if (added?.length) toast.success(`Added ${added.length} file(s)`);
  };

  const handleImportFolder = async () => {
    toast.info('Scanning folder…');
    const added = await importFolder();
    if (added?.length) toast.success(`Added ${added.length} file(s) from folder`);
    else toast.warning('No media files found');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>
              Library
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {library.length} items · {library.filter(m => m.type === 'audio').length} audio · {library.filter(m => m.type === 'video').length} video
            </p>
          </div>
          <div className="flex gap-2">
            <button
              id="import-files-btn"
              onClick={handleImportFiles}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'var(--accent)' }}
            >
              <Upload size={16} /> Add Files
            </button>
            <button
              id="import-folder-btn"
              onClick={handleImportFolder}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-white/10 border"
              style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
            >
              <FolderOpen size={16} /> Add Folder
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border flex-1 max-w-xs" style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)' }}>
            <Search size={15} style={{ color: 'var(--text-muted)' }} />
            <input
              id="library-search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search library..."
              className="bg-transparent text-sm outline-none flex-1"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>

          {/* Type filter */}
          <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
            {[['all','All'],['audio','Audio'],['video','Video']].map(([val, label]) => (
              <button
                key={val}
                id={`filter-${val}`}
                onClick={() => setFilter(val)}
                className="px-3 py-2 text-sm transition-colors"
                style={{
                  background: filter === val ? 'var(--accent)' : 'var(--bg-tertiary)',
                  color: filter === val ? 'white' : 'var(--text-secondary)',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            id="library-sort"
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm border outline-none"
            style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            <option value="dateAdded">Date Added</option>
            <option value="title">Title</option>
            <option value="artist">Artist</option>
            <option value="duration">Duration</option>
          </select>

          {/* View toggle */}
          {!is3DTheme && (
            <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
              <button id="view-grid" onClick={() => setView('grid')} className="p-2 transition-colors"
                style={{ background: view === 'grid' ? 'var(--accent)' : 'var(--bg-tertiary)', color: view === 'grid' ? 'white' : 'var(--text-muted)' }}>
                <Grid size={16} />
              </button>
              <button id="view-list" onClick={() => setView('list')} className="p-2 transition-colors"
                style={{ background: view === 'list' ? 'var(--accent)' : 'var(--bg-tertiary)', color: view === 'list' ? 'white' : 'var(--text-muted)' }}>
                <List size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)' }} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyLibrary onImportFiles={handleImportFiles} onImportFolder={handleImportFolder} />
        ) : effectiveView === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filtered.map((m, i) => (
              <MediaCard key={m.id} media={m} queue={filtered} index={i} onAddToPlaylist={setPlModal} />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map((m, i) => (
              <MediaCard key={m.id} media={m} queue={filtered} index={i} compact onAddToPlaylist={setPlModal} />
            ))}
          </div>
        )}
      </div>

      <PlaylistModal open={!!plModal} onClose={() => setPlModal(null)} mediaToAdd={plModal} />
    </div>
  );
}

function EmptyLibrary({ onImportFiles, onImportFolder }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-64 text-center"
    >
      <div className="text-6xl mb-4">🎵</div>
      <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Your library is empty</h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Add music or videos to get started. You can also drag & drop files here.</p>
      <div className="flex gap-3">
        <button onClick={onImportFiles}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'var(--accent)' }}>
          Add Files
        </button>
        <button onClick={onImportFolder}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold border"
          style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)', background: 'var(--bg-tertiary)' }}>
          Add Folder
        </button>
      </div>
    </motion.div>
  );
}
