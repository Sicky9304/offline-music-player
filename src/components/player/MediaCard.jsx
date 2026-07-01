import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Heart, Play, Plus, Trash2, Video } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLibrary } from '../../hooks/useLibrary.jsx';
import { usePlayer } from '../../hooks/usePlayer.jsx';
import { formatDuration, truncate } from '../../utils/formatters.js';
import { useToast } from '../ui/Toast.jsx';
import ThreeDArtwork from './ThreeDArtwork.jsx';

export default function MediaCard({ media, queue, index = 0, onAddToPlaylist, compact = false }) {
  const { playMedia, currentMedia, isPlaying } = usePlayer();
  const { toggleFavorite, deleteMedia } = useLibrary();
  const toast = useToast();
  const [imgError, setImgError] = useState(false);
  const [pulseHeart, setPulseHeart] = useState(false);

  const isActive = currentMedia?.id === media.id;
  const isAudio = media.type === 'audio';

  useEffect(() => {
    setImgError(false);
  }, [media.id]);

  const hasThumbnail = media.thumbnail && !imgError;

  const handlePlay = () => {
    playMedia(media, queue || [media], index);
  };

  const handleFav = async (e) => {
    e.stopPropagation();
    setPulseHeart(true);
    setTimeout(() => setPulseHeart(false), 600);
    const updated = await toggleFavorite(media.id);
    toast.success(updated?.favorite ? 'Added to favorites' : 'Removed from favorites');
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    await deleteMedia(media.id);
    toast.info('Removed from library');
  };

  // 3D Parallax hover animation values
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const springConfig = { damping: 22, stiffness: 180, mass: 0.6 };

  const rotateX = useSpring(useTransform(mouseY, [0, 1], [8, -8]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-8, 8]), springConfig);

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
        transition={{ type: 'spring', stiffness: 40, damping: 15, mass: 1.1 }}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={handlePlay}
        className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer group border transition-all duration-200 ${isActive
            ? 'glass border-white/10 shadow-lg'
            : 'border-transparent hover:bg-white/5 hover:border-white/5'
          }`}
      >
        {/* Thumbnail */}
        <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center bg-zinc-900 border border-white/5 shadow-inner">
          {hasThumbnail ? (
            <img src={media.thumbnail} alt="" className="w-full h-full object-cover" onError={() => setImgError(true)} />
          ) : isAudio ? (
            <ThreeDArtwork title={media.title} id={media.id} isCompact />
          ) : (
            <Video size={16} className="text-zinc-400" />
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Play size={14} className="text-white" fill="white" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold truncate transition-colors duration-200" style={{ color: isActive ? 'var(--accent)' : 'var(--text-primary)' }}>
            {truncate(media.title, 40)}
          </p>
          <p className="text-[10px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {media.artist || 'Unknown Artist'} {media.album ? `• ${media.album}` : ''}
          </p>
        </div>

        {/* Actions / Duration */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold font-mono" style={{ color: 'var(--text-muted)' }}>{formatDuration(media.duration)}</span>
          <button
            id={`fav-compact-${media.id}`}
            onClick={handleFav}
            className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-white/10 ${pulseHeart ? 'animate-heart-pulse' : ''}`}
          >
            <Heart size={12} fill={media.favorite ? 'currentColor' : 'none'} className={media.favorite ? 'text-rose-400' : 'text-zinc-500'} />
          </button>
        </div>
      </motion.div>
    );
  }

  // Premium Grid Card view
  return (
    <motion.div
      layout
      transition={{ type: 'spring', stiffness: 45, damping: 16 }}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handlePlay}
      className={`relative group rounded-2xl overflow-hidden cursor-pointer border glass-card shadow-lg ${isActive ? 'border-white/20' : 'border-white/5'
        }`}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        transformPerspective: 1000,
      }}
    >
      {/* Artwork container */}
      <div
        className="relative aspect-square flex items-center justify-center overflow-hidden bg-zinc-900 border-b border-white/5"
        style={{ transform: 'translateZ(10px)' }}
      >
        {hasThumbnail ? (
          <img src={media.thumbnail} alt={media.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" onError={() => setImgError(true)} />
        ) : isAudio ? (
          <ThreeDArtwork title={media.title} id={media.id} />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Video size={40} className="text-zinc-500" />
            <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest bg-white/5 text-zinc-400">
              {media.format || 'Video'}
            </span>
          </div>
        )}

        {/* Hover overlay with smooth play button */}
        <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center">
          <motion.div
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            className="w-12 h-12 rounded-full flex items-center justify-center shadow-2xl relative"
            style={{ background: 'var(--accent)' }}
          >
            <Play size={18} className="text-white ml-0.5" fill="white" />
          </motion.div>
        </div>

        {/* Active playback status badge */}
        {isActive && (
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-md"
            style={{ background: 'var(--accent)' }}>
            {isPlaying ? '▶ Playing' : '⏸ Paused'}
          </div>
        )}
      </div>

      {/* Info panel */}
      <div className="p-3" style={{ transform: 'translateZ(15px)' }}>
        <h4 className="font-bold text-xs truncate" style={{ color: 'var(--text-primary)' }}>
          {truncate(media.title, 24)}
        </h4>
        <p className="text-[10px] truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          {truncate(media.artist || 'Unknown Artist', 24)}
        </p>

        <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
          <span className="text-[10px] font-mono font-semibold" style={{ color: 'var(--text-muted)' }}>
            {formatDuration(media.duration)}
          </span>

          <div className="flex items-center gap-0.5">
            <button
              id={`fav-${media.id}`}
              onClick={handleFav}
              className={`p-1 rounded-lg hover:bg-white/5 transition-all hover:scale-105 active:scale-95 ${pulseHeart ? 'animate-heart-pulse' : ''}`}
            >
              <Heart size={12} fill={media.favorite ? 'currentColor' : 'none'}
                className={media.favorite ? 'text-rose-400' : 'text-zinc-500'} />
            </button>
            {onAddToPlaylist && (
              <button
                id={`add-pl-${media.id}`}
                onClick={(e) => { e.stopPropagation(); onAddToPlaylist(media); }}
                className="p-1 rounded-lg hover:bg-white/5 transition-all hover:scale-105 active:scale-95"
                style={{ color: 'var(--text-muted)' }}
              >
                <Plus size={12} />
              </button>
            )}
            <button
              id={`del-${media.id}`}
              onClick={handleDelete}
              className="p-1 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100 active:scale-95"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
