import { motion } from 'framer-motion';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Shuffle, Repeat, Repeat1, ChevronUp, Heart, ListMusic,
} from 'lucide-react';
import { usePlayer, REPEAT_NONE, REPEAT_ONE, REPEAT_ALL } from '../hooks/usePlayer.jsx';
import { useLibrary } from '../hooks/useLibrary.jsx';
import { formatDuration, truncate } from '../utils/formatters.js';
import EqualizerBars from './EqualizerBars.jsx';
import { useState } from 'react';
import ThreeDArtwork from './ThreeDArtwork.jsx';

export default function MiniPlayer({ onExpand }) {
  const {
    currentMedia, isPlaying, progress, currentTime, duration,
    volume, isMuted, shuffle: isShuffle, repeat,
    togglePlay, playNext, playPrev, seekTo, changeVolume, toggleMute,
    toggleShuffle, cycleRepeat, setShowNowPlaying,
  } = usePlayer();

  const { toggleFavorite } = useLibrary();
  const [dragging, setDragging] = useState(false);

  if (!currentMedia) return null;

  const handleSeek = (e) => {
    const bar   = e.currentTarget.getBoundingClientRect();
    const frac  = (e.clientX - bar.left) / bar.width;
    seekTo(Math.max(0, Math.min(1, frac)));
  };

  const RepeatIcon = repeat === REPEAT_ONE ? Repeat1 : Repeat;

  return (
    <motion.div
      initial={{ y: 80 }}
      animate={{ y: 0 }}
      className="flex-shrink-0 border-t"
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', zIndex: 30 }}
    >
      {/* Progress bar */}
      <div
        className="h-1 cursor-pointer group"
        style={{ background: 'var(--bg-tertiary)' }}
        onClick={handleSeek}
      >
        <motion.div
          className="h-full rounded-full relative"
          style={{ width: `${progress * 100}%`, background: 'var(--accent)' }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
        </motion.div>
      </div>

      <div className="flex items-center gap-3 px-5 py-3 h-20">
        {/* Track info */}
        <div
          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
          onClick={() => setShowNowPlaying(true)}
        >
          <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center shadow-lg"
            style={{ background: 'var(--bg-tertiary)' }}>
            {currentMedia.thumbnail
              ? <img src={currentMedia.thumbnail} alt="" className="w-full h-full object-cover" />
              : currentMedia.type === 'audio'
                ? <ThreeDArtwork title={currentMedia.title} id={currentMedia.id} isCompact />
                : <span className="text-2xl">🎬</span>
            }
            {isPlaying && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <EqualizerBars isPlaying={isPlaying} bars={4} />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {truncate(currentMedia.title, 28)}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
              {truncate(currentMedia.artist, 28)}
            </p>
          </div>
        </div>

        {/* Main controls */}
        <div className="flex items-center gap-2">
          <button
            id="mini-shuffle"
            onClick={toggleShuffle}
            className={`p-2 rounded-lg transition-colors ${isShuffle ? 'text-white' : ''}`}
            style={{ color: isShuffle ? 'var(--accent)' : 'var(--text-muted)' }}
          >
            <Shuffle size={16} />
          </button>
          <button
            id="mini-prev"
            onClick={playPrev}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <SkipBack size={20} fill="currentColor" />
          </button>
          <motion.button
            id="mini-play"
            onClick={togglePlay}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors"
            style={{ background: 'var(--accent)' }}
          >
            {isPlaying
              ? <Pause size={18} fill="white" className="text-white" />
              : <Play  size={18} fill="white" className="text-white ml-0.5" />
            }
          </motion.button>
          <button
            id="mini-next"
            onClick={playNext}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <SkipForward size={20} fill="currentColor" />
          </button>
          <button
            id="mini-repeat"
            onClick={cycleRepeat}
            className="p-2 rounded-lg transition-colors"
            style={{ color: repeat !== REPEAT_NONE ? 'var(--accent)' : 'var(--text-muted)' }}
          >
            <RepeatIcon size={16} />
          </button>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3 flex-1 justify-end min-w-0">
          {/* Time */}
          <span className="text-xs font-mono hidden sm:block" style={{ color: 'var(--text-muted)' }}>
            {formatDuration(currentTime)} / {formatDuration(duration)}
          </span>

          {/* Favorite */}
          <button
            id="mini-fav"
            onClick={() => toggleFavorite(currentMedia.id)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Heart size={16} fill={currentMedia.favorite ? 'currentColor' : 'none'}
              className={currentMedia.favorite ? 'text-rose-400' : ''} style={{ color: currentMedia.favorite ? '' : 'var(--text-muted)' }} />
          </button>

          {/* Volume */}
          <div className="flex items-center gap-1.5">
            <button id="mini-mute" onClick={toggleMute} style={{ color: 'var(--text-muted)' }}>
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              type="range" min="0" max="200" value={isMuted ? 0 : volume}
              onChange={e => changeVolume(Number(e.target.value))}
              className="w-16 h-1 accent-[var(--accent)] cursor-pointer"
              id="mini-volume-slider"
            />
            <span className={`text-[9px] font-mono w-8 text-right font-bold transition-colors ${volume > 100 ? 'text-amber-400 font-extrabold' : 'text-zinc-400'}`}>
              {volume > 100 ? `+${volume - 100}%` : `${volume}%`}
            </span>
          </div>

          {/* Expand */}
          <button
            id="mini-expand"
            onClick={() => setShowNowPlaying(true)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <ChevronUp size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
