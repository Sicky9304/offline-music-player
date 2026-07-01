import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Heart, Radio, Disc, BarChart2, Star, Sparkles, Smile, Flame, Sun, Compass } from 'lucide-react';
import { useLibrary } from '../hooks/useLibrary.jsx';
import { usePlayer } from '../hooks/usePlayer.jsx';
import MediaCard from '../components/MediaCard.jsx';
import ThreeDArtwork from '../components/ThreeDArtwork.jsx';

const MOODS = [
  { id: 'relieved',  emoji: '😌', label: 'Relieved',  color: '#21d8b9', desc: 'Chill & Relaxing' },
  { id: 'happy',     emoji: '😊', label: 'Happy',     color: '#febc2e', desc: 'Upbeat & Cheerful' },
  { id: 'energetic', emoji: '⚡', label: 'Energetic',  color: '#ff5f57', desc: 'High Energy & Dance' },
  { id: 'focus',     emoji: '🧠', label: 'Focus',     color: '#3b82f6', desc: 'Lofi & Instrumental' },
  { id: 'romantic',  emoji: '💖', label: 'Romantic',  color: '#ec4899', desc: 'Love & Acoustic' }
];

export default function Home() {
  const { library } = useLibrary();
  const { playMedia, currentMedia, isPlaying } = usePlayer();

  const [activeMood, setActiveMood] = useState(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Audio tracks
  const tracks = useMemo(() => library.filter(m => m.type === 'audio'), [library]);

  // Stacked Carousel tracks (featured tracks)
  const featuredTracks = useMemo(() => tracks.slice(0, 5), [tracks]);

  // Filtered tracks based on active mood
  const filteredTracks = useMemo(() => {
    if (!activeMood) return tracks.slice(0, 4);
    // Deterministic selection of tracks per mood for demonstration
    const seed = activeMood.charCodeAt(0) || 0;
    return tracks.filter((_, idx) => (idx + seed) % 3 === 0).slice(0, 4);
  }, [tracks, activeMood]);

  const handleMoodClick = (moodId) => {
    if (activeMood === moodId) {
      setActiveMood(null);
    } else {
      setActiveMood(moodId);
    }
  };

  const currentFeatured = featuredTracks[carouselIndex] || null;

  const nextCarousel = () => {
    setCarouselIndex((prev) => (prev + 1) % featuredTracks.length);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto px-8 py-6 space-y-8" style={{ background: 'var(--bg-primary)' }}>
      {/* Welcome Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-sm font-semibold tracking-wide uppercase text-zinc-500 mb-1">Good Morning Mohi 👋</h1>
          <div className="flex items-center gap-2 text-3xl font-extrabold" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <span>Your</span>
            <div className="flex items-center gap-1">
              <span className="text-yellow-400">M</span>
              <span className="text-teal-400">o</span>
              <span className="text-pink-400">o</span>
              <span className="text-indigo-400">D</span>
            </div>
            <span>Today?</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl glass hover:bg-white/10 transition-colors cursor-pointer">
            <Sparkles size={18} className="text-teal-400" />
          </div>
          <div className="p-2.5 rounded-xl glass hover:bg-white/10 transition-colors cursor-pointer">
            <Compass size={18} className="text-indigo-400" />
          </div>
        </div>
      </div>

      {/* Hero Banner Grid (Mood Selector + Stacked Card Carousel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Mood Selector Widget */}
        <div className="lg:col-span-7 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between h-72 border border-white/5"
          style={{ background: 'linear-gradient(135deg, rgba(24,24,37,0.7) 0%, rgba(13,14,21,0.9) 100%)' }}>
          
          <div className="absolute inset-0 bg-radial-at-t from-teal-500/10 via-transparent to-transparent pointer-events-none" />

          {/* Interactive Mood Selector radar circle */}
          <div className="flex-1 flex items-center justify-center relative">
            {/* Center Mic Node */}
            <div className="w-14 h-14 rounded-full flex items-center justify-center bg-zinc-950/80 border border-white/10 shadow-2xl relative z-10 z-index">
              <div className="w-3.5 h-3.5 rounded-full bg-teal-400 animate-ping absolute opacity-70" />
              <Radio size={22} className="text-teal-400" />
            </div>

            {/* Orbit paths */}
            <div className="absolute w-44 h-44 rounded-full border border-dashed border-white/10" />
            <div className="absolute w-56 h-56 rounded-full border border-white/5" />

            {/* Emojis arranged in orbit circle */}
            {MODS.map((m, idx) => {
              const angle = (idx * 2 * Math.PI) / MODS.length - Math.PI / 2;
              const radius = 95; // orbit radius
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;

              const isSelected = activeMood === m.id;

              return (
                <div
                  key={m.id}
                  onClick={() => handleMoodClick(m.id)}
                  className="absolute cursor-pointer transition-all duration-300 select-none z-20 group"
                  style={{
                    transform: `translate(${x}px, ${y}px)`,
                  }}
                >
                  <motion.div
                    whileHover={{ scale: 1.25 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-11 h-11 rounded-full flex items-center justify-center text-xl transition-all shadow-xl ${
                      isSelected
                        ? 'bg-white border-2'
                        : 'bg-zinc-900/90 border hover:bg-zinc-800'
                    }`}
                    style={{
                      borderColor: isSelected ? m.color : 'rgba(255,255,255,0.06)',
                      boxShadow: isSelected ? `0 0 15px ${m.color}cc` : '',
                    }}
                  >
                    {m.emoji}
                  </motion.div>

                  {/* Tooltip bubble on active / hover */}
                  <AnimatePresence>
                    {(isSelected) && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.8 }}
                        animate={{ opacity: 1, y: -2, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.8 }}
                        className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-zinc-950 text-white border border-white/10 pointer-events-none whitespace-nowrap"
                        style={{ color: m.color }}
                      >
                        {m.label}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-2 z-10">
            <div>
              <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Active Playlist Filter</p>
              <p className="text-sm font-bold text-white mt-0.5">
                {activeMood ? `${MODS.find(m => m.id === activeMood).label} Mode - ${MODS.find(m => m.id === activeMood).desc}` : 'Standard Catalog Selection'}
              </p>
            </div>
            {activeMood && (
              <button
                onClick={() => setActiveMood(null)}
                className="text-xs px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/5 hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Stacked Album Carousel Card */}
        <div className="lg:col-span-5 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between h-72 border border-white/5"
          style={{ background: 'linear-gradient(135deg, rgba(28,26,44,0.7) 0%, rgba(13,11,20,0.9) 100%)' }}>
          
          <div className="absolute inset-0 bg-radial-at-t from-indigo-500/10 via-transparent to-transparent pointer-events-none" />

          {currentFeatured ? (
            <div className="flex-1 flex gap-4 items-center justify-center relative">
              {/* Stack effect background cards */}
              <div className="absolute w-44 h-44 rounded-2xl bg-zinc-950/20 border border-white/5 scale-90 -rotate-6 translate-x-4 opacity-50 pointer-events-none z-0" />
              <div className="absolute w-44 h-44 rounded-2xl bg-zinc-950/40 border border-white/5 scale-95 rotate-3 translate-x-8 opacity-75 pointer-events-none z-0" />

              {/* Main Card */}
              <motion.div
                key={carouselIndex}
                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 100, damping: 14 }}
                onClick={nextCarousel}
                className="w-44 h-44 rounded-3xl overflow-hidden shadow-2xl relative group cursor-pointer border border-white/10 z-10"
              >
                {currentFeatured.thumbnail ? (
                  <img src={currentFeatured.thumbnail} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ThreeDArtwork title={currentFeatured.title} id={currentFeatured.id} />
                )}
                {/* Visualizer play bar */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-11 h-11 rounded-full bg-teal-400 flex items-center justify-center shadow-lg">
                    <Play size={18} fill="white" className="text-white ml-0.5" />
                  </div>
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <Disc className="w-12 h-12 text-zinc-700 animate-spin-slow mb-2" />
              <p className="text-sm font-semibold text-zinc-500">No Featured Tracks</p>
            </div>
          )}

          <div className="flex items-center justify-between mt-2 z-10">
            <div>
              <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Featured Release</p>
              <p className="text-sm font-bold text-white mt-0.5 truncate max-w-[200px]">
                {currentFeatured ? currentFeatured.title : 'Loading Featured Track…'}
              </p>
            </div>
            <button
              onClick={nextCarousel}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-white/10 hover:bg-zinc-900 transition-all text-teal-400 font-bold active:scale-95 shadow-md"
            >
              Next Card
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid (Just For You / Stats / Recently Playlist) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Just For You & Grid */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>Just For You</h2>
            <div className="flex items-center gap-4 text-xs font-semibold text-zinc-500">
              <span className="text-teal-400 border-b border-teal-400 pb-0.5 cursor-pointer">Album</span>
              <span className="hover:text-zinc-300 cursor-pointer">Single</span>
              <span className="hover:text-zinc-300 cursor-pointer">See All</span>
            </div>
          </div>

          {/* Cards scroll grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filteredTracks.map((m, i) => (
              <MediaCard key={m.id} media={m} queue={filteredTracks} index={i} />
            ))}
            {filteredTracks.length === 0 && (
              <div className="col-span-4 py-8 flex flex-col items-center justify-center glass border border-white/5 rounded-2xl text-center">
                <span className="text-3xl mb-2">🎶</span>
                <p className="text-sm font-medium text-zinc-400">Add tracks matching this mood in Library</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Statistics Neon Chart & Playlist Overview */}
        <div className="lg:col-span-4 space-y-6">
          {/* Neon Statistics Chart Card */}
          <div className="rounded-3xl p-5 border border-white/5"
            style={{ background: 'linear-gradient(135deg, rgba(20,20,30,0.7) 0%, rgba(10,11,18,0.9) 100%)' }}>
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart2 size={16} className="text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Top Monthly Stats</h3>
              </div>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-extrabold px-1.5 py-0.5 rounded border border-indigo-500/20 uppercase">Active</span>
            </div>

            {/* Glowing Neon Chart SVG */}
            <div className="h-28 w-full relative">
              <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="neon-glow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#21d8b9" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#21d8b9" stopOpacity="0" />
                  </linearGradient>
                  <filter id="shadow-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#21d8b9" floodOpacity="0.8" />
                  </filter>
                </defs>

                {/* Shading fill */}
                <path d="M 0 35 Q 20 10, 40 28 T 80 8 T 100 15 L 100 40 L 0 40 Z" fill="url(#neon-glow)" />

                {/* Glowing neon path */}
                <path
                  d="M 0 35 Q 20 10, 40 28 T 80 8 T 100 15"
                  fill="none"
                  stroke="#21d8b9"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  filter="url(#shadow-glow)"
                />

                {/* Circular Node dot */}
                <circle cx="80" cy="8" r="1.5" fill="white" stroke="#21d8b9" strokeWidth="1" />
              </svg>

              {/* Mock active tooltip overlay */}
              <div className="absolute top-1 right-8 bg-zinc-950 border border-white/10 px-2 py-0.5 rounded-lg text-[9px] shadow-2xl flex items-center gap-1.5 pointer-events-none">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                <span className="text-white font-bold">Ariana L.</span>
                <span className="text-zinc-500">3,458m</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-[9px] text-zinc-500 font-mono mt-1.5">
              <span>JUL</span>
              <span>AUG</span>
              <span>SEP</span>
              <span>OCT</span>
              <span>NOV</span>
            </div>
          </div>

          {/* Recently Playlist Circular Grid Card */}
          <div className="rounded-3xl p-5 border border-white/5 flex flex-col justify-between"
            style={{ background: 'linear-gradient(135deg, rgba(24,24,37,0.7) 0%, rgba(13,14,21,0.9) 100%)' }}>
            
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-4">Recently Playlist</h3>

            <div className="space-y-4">
              {/* Item 1 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Overlapping circular profile grid */}
                  <div className="flex -space-x-3.5">
                    <div className="w-8 h-8 rounded-full border border-zinc-900 bg-teal-600 flex-shrink-0 flex items-center justify-center text-xs shadow-md">🎵</div>
                    <div className="w-8 h-8 rounded-full border border-zinc-900 bg-indigo-600 flex-shrink-0 flex items-center justify-center text-xs shadow-md">🎧</div>
                    <div className="w-8 h-8 rounded-full border border-zinc-900 bg-zinc-800 flex-shrink-0 flex items-center justify-center text-xs text-teal-400 font-black shadow-md">16</div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Daily Fresh Mix</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Created By <span className="text-zinc-400 font-bold">Mohi</span></p>
                  </div>
                </div>
                <button className="w-7 h-7 rounded-full bg-teal-400/10 border border-teal-400/20 hover:bg-teal-400/20 flex items-center justify-center text-teal-400 transition-colors active:scale-95">
                  <Play size={10} fill="currentColor" className="ml-0.5" />
                </button>
              </div>

              {/* Item 2 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Overlapping circular profile grid */}
                  <div className="flex -space-x-3.5">
                    <div className="w-8 h-8 rounded-full border border-zinc-900 bg-pink-600 flex-shrink-0 flex items-center justify-center text-xs shadow-md">😌</div>
                    <div className="w-8 h-8 rounded-full border border-zinc-900 bg-yellow-600 flex-shrink-0 flex items-center justify-center text-xs shadow-md">⚡</div>
                    <div className="w-8 h-8 rounded-full border border-zinc-900 bg-zinc-800 flex-shrink-0 flex items-center justify-center text-xs text-teal-400 font-black shadow-md">05</div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Focus & Chillout</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Created By <span className="text-zinc-400 font-bold">Hatam</span></p>
                  </div>
                </div>
                <button className="w-7 h-7 rounded-full bg-teal-400/10 border border-teal-400/20 hover:bg-teal-400/20 flex items-center justify-center text-teal-400 transition-colors active:scale-95">
                  <Play size={10} fill="currentColor" className="ml-0.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
