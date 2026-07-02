import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLibrary } from '../hooks/useLibrary.jsx';
import { usePlayer } from '../hooks/usePlayer.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { ipc } from '../utils/ipc.js';
import { Download, Trash2, FolderOpen, Music, Clock, Play } from 'lucide-react';
import SectionHeader from '../components/ui/SectionHeader.jsx';
import { formatDuration, formatFileSize } from '../utils/formatters.js';

export default function Downloads() {
  const { library, reload } = useLibrary();
  const { playMedia, currentMedia } = usePlayer();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('Bollywood');
  const [confirmClear, setConfirmClear] = useState(false);

  // Filter library items to find downloaded ones
  const downloadedSongs = library.filter(m => m.isDownloaded);

  // Filter downloaded songs for the active category tab
  const filteredSongs = downloadedSongs.filter(m => m.downloadCategory === activeTab);

  const handlePlay = (song) => {
    playMedia(song, filteredSongs, filteredSongs.indexOf(song));
  };

  const handleShowFile = async (e, filePath) => {
    e.stopPropagation();
    const res = await ipc.online.showFile(filePath);
    if (!res || !res.ok) {
      toast.error(res?.error || 'Failed to reveal file in folder');
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    const confirmed = window.confirm('Are you sure you want to delete this downloaded song locally?');
    if (!confirmed) return;

    const res = await ipc.online.deleteDownload(id);
    if (res && res.ok) {
      toast.success('Song deleted locally!');
      reload();
    } else {
      toast.error(res?.error || 'Failed to delete song');
    }
  };

  const handleClearAll = async () => {
    const res = await ipc.online.clearAllDownloads();
    if (res && res.ok) {
      toast.success('All downloaded songs cleared!');
      setConfirmClear(false);
      reload();
    } else {
      toast.error(res?.error || 'Failed to clear downloads');
    }
  };

  const TABS = ['Bollywood', 'English', 'Bhojpuri', 'Others'];

  return (
    <div className="flex flex-col h-full page-enter">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--glass-border)' }}>
        <SectionHeader
          title="Downloads"
          subtitle={`${downloadedSongs.length} songs saved offline`}
          badge="Library"
          icon={Download}
        />
        {downloadedSongs.length > 0 && (
          <div className="relative">
            {!confirmClear ? (
              <button
                onClick={() => setConfirmClear(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 active:scale-95 transition-all duration-200"
              >
                <Trash2 size={13} />
                Clear All
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-zinc-950/90 border border-rose-500/30 px-3 py-1.5 rounded-xl animate-fade-in shadow-2xl z-50">
                <span className="text-[10px] text-zinc-300 font-bold uppercase tracking-wider">Are you sure?</span>
                <button
                  onClick={handleClearAll}
                  className="px-2.5 py-1 text-[10px] font-black uppercase bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors active:scale-95"
                >
                  Yes, Clear
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="px-2.5 py-1 text-[10px] font-black uppercase bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors active:scale-95"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs Menu */}
      <div className="flex-shrink-0 px-6 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--glass-border)', background: 'rgba(0,0,0,0.05)' }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
              activeTab === tab
                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20 scale-105'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredSongs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-80 text-center space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-cyan-500/5 border border-cyan-500/10 flex items-center justify-center text-cyan-400 shadow-inner">
              <Download size={26} className="animate-pulse" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-white">No downloads here</h2>
              <p className="text-xs text-zinc-500 max-w-xs leading-relaxed font-semibold">
                Go to the <span className="text-cyan-400">Online Hub</span> and download songs in the <span className="text-white">{activeTab}</span> category.
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-2.5">
            {filteredSongs.map((song, idx) => {
              const isActive = currentMedia?.id === song.id;

              return (
                <div
                  key={song.id}
                  onClick={() => handlePlay(song)}
                  className={`flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer group border transition-all duration-200 select-none ${
                    isActive
                      ? 'glass border-white/10 bg-white/[0.04] shadow-lg shadow-black/30'
                      : 'border-transparent hover:bg-white/5 hover:border-white/5'
                  }`}
                >
                  {/* Play / Index Icon */}
                  <div className="w-6 flex items-center justify-center text-sm font-bold text-zinc-500 group-hover:hidden">
                    {idx + 1}
                  </div>
                  <div className="w-6 hidden items-center justify-center group-hover:flex">
                    <Play size={14} className="text-cyan-400" fill="currentColor" />
                  </div>

                  {/* Thumbnail Artwork */}
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center bg-zinc-900 border border-white/5 shadow-inner">
                    {song.thumbnail ? (
                      <img src={song.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Music size={16} className="text-zinc-500" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-bold truncate transition-colors duration-200 ${isActive ? 'text-cyan-400' : 'text-white'}`}>
                      {song.title}
                    </h4>
                    <p className="text-xs truncate mt-0.5 text-zinc-400 font-semibold">
                      {song.artist} {song.album ? `• ${song.album}` : ''}
                    </p>
                  </div>

                  {/* File size indicator (useful for copy to mobile) */}
                  <div className="hidden md:flex flex-col items-end text-zinc-500">
                    <span className="text-[10px] font-bold uppercase tracking-wider">{formatFileSize(song.fileSize)}</span>
                    <span className="text-[9px] text-zinc-600 font-semibold mt-0.5">MP3 Audio</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    {/* Show in File Explorer */}
                    <button
                      onClick={(e) => handleShowFile(e, song.filePath)}
                      title="Show in File Explorer (Copy to Mobile)"
                      className="p-2 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-200 active:scale-95"
                    >
                      <FolderOpen size={14} />
                    </button>

                    {/* Delete locally */}
                    <button
                      onClick={(e) => handleDelete(e, song.id)}
                      title="Delete Locally"
                      className="p-2 rounded-xl border border-white/10 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/5 transition-all duration-200 active:scale-95"
                    >
                      <Trash2 size={14} />
                    </button>

                    {/* Duration */}
                    <div className="w-12 text-right flex items-center justify-end gap-1 text-xs text-zinc-500 font-mono font-bold">
                      <Clock size={12} className="text-zinc-600" />
                      {formatDuration(song.duration)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
