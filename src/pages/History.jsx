import { useLibrary } from '../hooks/useLibrary.jsx';
import { usePlayer } from '../hooks/usePlayer.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { formatRelativeDate, formatDuration, truncate } from '../utils/formatters.js';
import { Clock, Play, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import ThreeDArtwork from '../components/player/ThreeDArtwork.jsx';
import SectionHeader from '../components/ui/SectionHeader.jsx';

export default function History() {
  const { history, library, clearHistory } = useLibrary();
  const { playMedia } = usePlayer();
  const toast = useToast();

  const getThumbnail = (item) => {
    const media = library.find(m => m.id === item.mediaId || m.filePath === item.filePath);
    return media?.thumbnail || null;
  };

  const handlePlay = (item) => {
    const media = library.find(m => m.id === item.mediaId || m.filePath === item.filePath);
    if (media) playMedia(media, [media], 0);
    else toast.error('File not found in library');
  };

  const handleClear = async () => {
    if (window.confirm("Are you sure you want to clear your listening history?")) {
      await clearHistory();
      toast.success('History cleared');
    }
  };

  return (
    <div className="flex flex-col h-full page-enter">
      {/* Header bar */}
      <div className="flex-shrink-0 px-6 py-5 border-b" style={{ borderColor: 'var(--glass-border)' }}>
        <SectionHeader
          title="History"
          subtitle={`${history.length} played files`}
          badge="Collections"
          icon={Clock}
          actionText={history.length > 0 ? "Clear History" : undefined}
          onAction={handleClear}
        />
      </div>

      {/* Timeline listing */}
      <div className="flex-1 overflow-y-auto p-6">
        {history.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="flex flex-col items-center justify-center h-64 text-center space-y-3"
          >
            <div className="w-16 h-16 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-500 shadow-inner">
              <Clock size={28} />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-white">No history yet</h2>
              <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
                Your recently played music tracks and videos will list here chronologically.
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {history.map((item, i) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.015, 0.3) }}
                className="flex items-center gap-3 px-3 py-3 rounded-2xl group transition-all duration-200 border border-transparent hover:border-white/5 hover:bg-white/5 cursor-pointer"
                onClick={() => handlePlay(item)}
              >
                <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 text-base bg-zinc-900 border border-white/5 shadow-inner" style={{ borderColor: 'var(--glass-border)' }}>
                  {getThumbnail(item) ? (
                    <img src={getThumbnail(item)} alt="" className="w-full h-full object-cover" />
                  ) : item.type === 'video' ? (
                    '🎬'
                  ) : (
                    <ThreeDArtwork title={item.title} id={item.mediaId || item.id} isCompact />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate text-white">{truncate(item.title, 48)}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">{formatRelativeDate(item.playedAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono font-semibold text-zinc-400">{formatDuration(item.duration)}</span>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play size={14} style={{ color: 'var(--accent)' }} fill="currentColor" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
