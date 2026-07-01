import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FolderOpen, Upload, Grid, List, Music, Video as VideoIcon } from 'lucide-react';
import { useLibrary } from '../hooks/useLibrary.jsx';
import { useTheme } from '../hooks/useTheme.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import MediaCard from '../components/player/MediaCard.jsx';
import PlaylistModal from '../components/playlist/PlaylistModal.jsx';
import SearchBar from '../components/ui/SearchBar.jsx';

export default function Library() {
  const { library, loading, importFiles, importFolder } = useLibrary();
  const { themeId } = useTheme();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [view, setView] = useState('grid');
  const [filter, setFilter] = useState('all'); // all | audio | video
  const [sort, setSort] = useState('dateAdded');
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

  // Compute Stats
  const audioCount = useMemo(() => library.filter(m => m.type === 'audio').length, [library]);
  const videoCount = useMemo(() => library.filter(m => m.type === 'video').length, [library]);

  return (
    <div className="flex flex-col h-full page-enter">
      
      {/* Header bar */}
      <div className="flex-shrink-0 px-6 py-5 border-b" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
          <div>
            <span className="text-[10px] font-black tracking-widest uppercase text-gradient">Storage</span>
            <h1 className="text-2xl font-black font-display text-white mt-1">Local Library</h1>
            <p className="text-xs text-zinc-400 mt-1 font-semibold">
              {library.length} total items · {audioCount} audio · {videoCount} video
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              id="import-files-btn"
              onClick={handleImportFiles}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 active:scale-95 gradient-button"
            >
              <Upload size={14} /> Add Files
            </button>
            <button
              id="import-folder-btn"
              onClick={handleImportFolder}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all hover:bg-white/10 border text-zinc-300 border-white/10 bg-white/5 active:scale-95"
            >
              <FolderOpen size={14} /> Add Folder
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex items-center gap-3 flex-wrap justify-between mt-6">
          <div className="flex items-center gap-3 flex-wrap">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search catalog..."
              onClear={() => setSearch('')}
              className="h-10 text-xs rounded-xl flex-1 max-w-xs"
            />

            {/* Type selector */}
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
              {[['all','All'],['audio','Audio'],['video','Video']].map(([val, label]) => (
                <button
                  key={val}
                  id={`filter-${val}`}
                  onClick={() => setFilter(val)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filter === val ? 'bg-white text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-white'
                  }`}
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
              className="px-3 py-2 rounded-xl text-xs border outline-none bg-zinc-900 border-white/5 text-zinc-300 font-semibold"
            >
              <option value="dateAdded">Date Added</option>
              <option value="title">Title</option>
              <option value="artist">Artist</option>
              <option value="duration">Duration</option>
            </select>
          </div>

          {/* View toggle */}
          {!is3DTheme && (
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
              <button 
                id="view-grid" 
                onClick={() => setView('grid')} 
                className={`p-1.5 rounded-lg transition-all ${view === 'grid' ? 'bg-white text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-white'}`}
                title="Grid View"
              >
                <Grid size={14} />
              </button>
              <button 
                id="view-list" 
                onClick={() => setView('list')} 
                className={`p-1.5 rounded-lg transition-all ${view === 'list' ? 'bg-white text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-white'}`}
                title="List View"
              >
                <List size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid Content catalog */}
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
      className="flex flex-col items-center justify-center h-64 text-center space-y-4"
    >
      <div className="text-5xl">📁</div>
      <div className="space-y-1">
        <h2 className="text-base font-bold text-white">Your library is empty</h2>
        <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
          Add audio or video files from your hard drive, or drop them directly here.
        </p>
      </div>
      <div className="flex gap-2 justify-center pt-2">
        <button 
          onClick={onImportFiles}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white gradient-button active:scale-95"
        >
          Add Files
        </button>
        <button 
          onClick={onImportFolder}
          className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:bg-white/10 border border-white/10 bg-white/5 active:scale-95 text-zinc-300"
        >
          Add Folder
        </button>
      </div>
    </motion.div>
  );
}
