import { useLibrary } from '../hooks/useLibrary.jsx';
import { usePlayer } from '../hooks/usePlayer.jsx';
import { useToast } from '../components/Toast.jsx';
import { formatRelativeDate, formatDuration, truncate } from '../utils/formatters.js';
import { Clock, Play, Trash2, Eraser } from 'lucide-react';
import { motion } from 'framer-motion';

export default function History() {
  const { history, library, clearHistory, deleteMedia } = useLibrary();
  const { playMedia } = usePlayer();
  const toast = useToast();

  const handlePlay = (item) => {
    const media = library.find(m => m.id === item.mediaId || m.filePath === item.filePath);
    if (media) playMedia(media, [media], 0);
    else toast.error('File not found in library');
  };

  const handleClear = async () => {
    await clearHistory();
    toast.success('History cleared');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-6 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <Clock size={22} style={{ color: 'var(--text-secondary)' }} />
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>History</h1>
          </div>
          {history.length > 0 && (
            <button id="clear-history-btn" onClick={handleClear}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm border hover:bg-red-500/10 transition-colors"
              style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
              <Eraser size={15} /> Clear All
            </button>
          )}
        </div>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{history.length} plays</p>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {history.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-48 text-center">
            <Clock size={48} className="mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="text-lg font-semibold" style={{ color: 'var(--text-secondary)' }}>No history yet</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Your recently played media will appear here</p>
          </motion.div>
        ) : (
          <div className="space-y-1">
            {history.map((item, i) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                className="flex items-center gap-3 px-3 py-3 rounded-xl group transition-all hover:bg-white/5 cursor-pointer"
                onClick={() => handlePlay(item)}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-lg"
                  style={{ background: 'var(--bg-tertiary)' }}>
                  {item.type === 'video' ? '🎬' : '🎵'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{truncate(item.title, 40)}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatRelativeDate(item.playedAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDuration(item.duration)}</span>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play size={16} style={{ color: 'var(--accent)' }} fill="currentColor" />
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
