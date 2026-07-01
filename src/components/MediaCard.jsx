import { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Music, Video, Heart, MoreVertical, Play, Plus, Trash2, Star } from 'lucide-react';
import { formatDuration, formatRelativeDate, truncate } from '../utils/formatters.js';
import { usePlayer } from '../hooks/usePlayer.jsx';
import { useLibrary } from '../hooks/useLibrary.jsx';
import { useToast } from './Toast.jsx';
import ThreeDArtwork from './ThreeDArtwork.jsx';

export default function MediaCard({ media, queue, index = 0, onAddToPlaylist, compact = false }) {
  const { playMedia, currentMedia, isPlaying } = usePlayer();
  const { toggleFavorite, deleteMedia } = useLibrary();
  const toast = useToast();
  const [showMenu, setShowMenu] = useState(false);

  const isActive  = currentMedia?.id === media.id;
  const isAudio   = media.type === 'audio';

  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [media.id]);

  const hasThumbnail = media.thumbnail && !imgError;

  const handlePlay = () => {
    playMedia(media, queue || [media], index);
  };

  const handleFav = async (e) => {
    e.stopPropagation();
    const updated = await toggleFavorite(media.id);
    toast.success(updated?.favorite ? 'Added to favorites' : 'Removed from favorites');
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    setShowMenu(false);
    await deleteMedia(media.id);
    toast.info('Removed from library');
  };

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const springConfig = { damping: 22, stiffness: 180, mass: 0.6 };

  const rotateX = useSpring(useTransform(mouseY, [0, 1], [10, -10]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-10, 10]), springConfig);

  const handleMouseMove = (e) => {
    const card = e.currentTarget.getBoundingClientRect();
    const xVal = (e.clientX - card.left) / card.width;
    const yVal = (e.clientY - card.top) / card.height;
    mouseX.set(xVal);
    mouseY.set(yVal);
  };

  const handleMouseLeave = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  if (compact) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
        onClick={handlePlay}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer group transition-all ${isActive ? 'ring-1' : ''}`}
        style={{ ringColor: isActive ? 'var(--accent)' : 'transparent', background: isActive ? 'rgba(255,255,255,0.06)' : '' }}
      >
        {/* Thumbnail */}
        <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center"
          style={{ background: 'var(--bg-tertiary)' }}>
          {hasThumbnail
            ? <img src={media.thumbnail} alt="" className="w-full h-full object-cover" onError={() => setImgError(true)} />
            : isAudio
              ? <ThreeDArtwork title={media.title} id={media.id} isCompact />
              : <span className="text-xl">🎬</span>
          }
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Play size={16} className="text-white" fill="white" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: isActive ? 'var(--accent)' : 'var(--text-primary)' }}>
            {truncate(media.title, 40)}
          </p>
          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
            {media.artist} {media.album ? `• ${media.album}` : ''}
          </p>
        </div>

        {/* Duration */}
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDuration(media.duration)}</span>
          <button onClick={handleFav} className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Heart size={14} fill={media.favorite ? 'currentColor' : 'none'} className={media.favorite ? 'text-rose-400' : ''} style={{ color: media.favorite ? '' : 'var(--text-muted)' }} />
          </button>
        </div>
      </motion.div>
    );
  }

  // Card view
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      style={{
        background: 'var(--bg-card)',
        borderColor: isActive ? 'var(--accent)' : 'var(--border)',
        ringColor: 'var(--accent)',
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        transformPerspective: 1000
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative group rounded-2xl overflow-hidden cursor-pointer border transition-all duration-75 ${isActive ? 'ring-2' : ''}`}
      onClick={handlePlay}
    >
      {/* Art */}
      <div className="relative aspect-square flex items-center justify-center overflow-hidden"
        style={{ background: 'var(--bg-tertiary)' }}>
        {hasThumbnail
          ? <img src={media.thumbnail} alt={media.title} className="w-full h-full object-cover" onError={() => setImgError(true)} />
          : isAudio
            ? <ThreeDArtwork title={media.title} id={media.id} />
            : (
              <div className="flex flex-col items-center gap-2">
                <span className="text-5xl">🎬</span>
                <span className="text-xs px-2 py-1 rounded-md font-mono" style={{ background: 'var(--bg-primary)', color: 'var(--accent)' }}>
                  {media.format}
                </span>
              </div>
            )
        }
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center">
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="w-12 h-12 rounded-full flex items-center justify-center shadow-xl"
            style={{ background: 'var(--accent)' }}
          >
            <Play size={20} className="text-white ml-0.5" fill="white" />
          </motion.div>
        </div>
        {/* Favorite badge */}
        {media.favorite && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
            <Heart size={12} fill="currentColor" className="text-rose-400" />
          </div>
        )}
        {/* Active indicator */}
        {isActive && (
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold text-white"
            style={{ background: 'var(--accent)' }}>
            {isPlaying ? '▶ Playing' : '⏸ Paused'}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{truncate(media.title, 25)}</p>
        <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>{truncate(media.artist, 25)}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDuration(media.duration)}</span>
          <div className="flex items-center gap-1">
            <button id={`fav-${media.id}`} onClick={handleFav}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors">
              <Heart size={13} fill={media.favorite ? 'currentColor' : 'none'}
                className={media.favorite ? 'text-rose-400' : ''} style={{ color: media.favorite ? '' : 'var(--text-muted)' }} />
            </button>
            {onAddToPlaylist && (
              <button id={`add-pl-${media.id}`} onClick={(e) => { e.stopPropagation(); onAddToPlaylist(media); }}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors" style={{ color: 'var(--text-muted)' }}>
                <Plus size={13} />
              </button>
            )}
            <button id={`del-${media.id}`} onClick={handleDelete}
              className="p-1 rounded-lg hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100" style={{ color: 'var(--text-muted)' }}>
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
