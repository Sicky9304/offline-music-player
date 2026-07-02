import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Play, TrendingUp, Flame, Music2, Radio,
  Film, Mic2, Headphones, Pause, Heart
} from 'lucide-react';
import { ipc } from '../../utils/ipc.js';
import { apiCache } from '../../utils/apiCache.js';
import { usePlayer } from '../../hooks/usePlayer.jsx';
import { useLibrary } from '../../hooks/useLibrary.jsx';
import { formatDuration } from '../../utils/formatters.js';

const TABS = [
  { key: 'worldwide', label: 'Worldwide',   icon: Globe,      color: '#22d3ee', bg: 'from-cyan-600/20 to-cyan-500/5',   badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'    },
  { key: 'bollywood', label: 'Bollywood',   icon: Film,       color: '#fb7185', bg: 'from-rose-600/20 to-rose-500/5',   badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20'    },
  { key: 'english',   label: 'English',     icon: Mic2,       color: '#a78bfa', bg: 'from-violet-600/20 to-violet-500/5', badge: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  { key: 'bhojpuri',  label: 'Bhojpuri',   icon: Headphones, color: '#fbbf24', bg: 'from-amber-600/20 to-amber-500/5', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20'   },
  { key: 'saavn',     label: 'JioSaavn',   icon: Flame,      color: '#c084fc', bg: 'from-purple-600/20 to-purple-500/5', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  { key: 'library',   label: 'My Library', icon: Music2,     color: '#34d399', bg: 'from-emerald-600/20 to-emerald-500/5', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
];

const MEDAL = ['🥇', '🥈', '🥉'];

// Cache keys — shared with OnlineSearch so both components reuse same data
const CK = {
  worldwide: 'charts:itunes:top10',
  bollywood: 'charts:home:bollywood',
  english:   'charts:home:english',
  bhojpuri:  'charts:home:bhojpuri',
  saavn:     'charts:home:saavn',
};

// Card skeleton
const SkeletonCard = () => (
  <div className="flex flex-col rounded-[22px] border border-white/[0.05] bg-white/[0.02] overflow-hidden animate-pulse">
    <div className="aspect-square bg-white/[0.06]" />
    <div className="p-3 space-y-2">
      <div className="h-3 bg-white/10 rounded w-3/4" />
      <div className="h-2.5 bg-white/5 rounded w-1/2" />
    </div>
  </div>
);

export default function WorldwideCharts({ localTracks = [] }) {
  const { playMedia, currentMedia, isPlaying } = usePlayer();
  const { toggleFavorite } = useLibrary();

  const [activeTab, setActiveTab] = useState('worldwide');
  // Seed state from cache immediately — avoids blank flash on re-mount
  const [catalogues, setCatalogues] = useState(() => ({
    worldwide: apiCache.peek(CK.worldwide) || [],
    bollywood: apiCache.peek(CK.bollywood) || [],
    english:   apiCache.peek(CK.english)   || [],
    bhojpuri:  apiCache.peek(CK.bhojpuri)  || [],
    saavn:     apiCache.peek(CK.saavn)     || [],
  }));
  const [loading, setLoading] = useState(() => ({
    worldwide: !apiCache.has(CK.worldwide),
    bollywood: !apiCache.has(CK.bollywood),
    english:   !apiCache.has(CK.english),
    bhojpuri:  !apiCache.has(CK.bhojpuri),
    saavn:     !apiCache.has(CK.saavn),
  }));
  const [hoveredId, setHoveredId] = useState(null);
  const [favs, setFavs] = useState({});

  // Fetch only stale/missing categories via shared apiCache
  useEffect(() => {
    let cancelled = false;
    const fetchers = [
      { key: 'worldwide', cacheKey: CK.worldwide, fn: () => ipc.online.getTopCharts() },
      { key: 'bollywood', cacheKey: CK.bollywood, fn: () => ipc.online.searchYouTube('Bollywood hits 2026') },
      { key: 'english',   cacheKey: CK.english,   fn: () => ipc.online.searchYouTube('Top English songs 2026') },
      { key: 'bhojpuri',  cacheKey: CK.bhojpuri,  fn: () => ipc.online.searchYouTube('Bhojpuri hits 2026') },
      { key: 'saavn',     cacheKey: CK.saavn,     fn: () => ipc.online.searchSaavn('Top hits 2026') },
    ];

    const stale = fetchers.filter(({ cacheKey }) => !apiCache.has(cacheKey));
    if (stale.length === 0) return; // all cached — skip network

    Promise.all(
      stale.map(async ({ key, cacheKey, fn }) => {
        try {
          const data = await apiCache.get(cacheKey, fn, 30);
          if (!cancelled) setCatalogues(prev => ({ ...prev, [key]: (data || []).slice(0, 20) }));
        } catch { /* silent */ }
        finally { if (!cancelled) setLoading(prev => ({ ...prev, [key]: false })); }
      })
    );
    return () => { cancelled = true; };
  }, []); // empty deps — intentional, apiCache handles freshness

  const localSorted = [...localTracks]
    .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
    .slice(0, 20);

  const currentTab   = TABS.find(t => t.key === activeTab);
  const isTabLoading = activeTab !== 'library' && loading[activeTab];
  const tracks       = activeTab === 'library' ? localSorted : (catalogues[activeTab] || []);

  return (
    <section className="space-y-5">

      {/* ── Section header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-violet-600/30 to-cyan-500/30 border border-white/10">
            <TrendingUp size={18} className="text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white font-display tracking-tight">Just For You</h2>
            <p className="text-[11px] text-zinc-500 font-medium mt-0.5">Live charts across all categories</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-[10px] font-black uppercase tracking-wider text-rose-400">
          <Radio size={10} className="animate-pulse" />
          Live
        </span>
      </div>

      {/* ── Tab row ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 flex-shrink-0 border ${
                isActive
                  ? 'bg-white/10 text-white border-white/20 shadow-lg'
                  : 'bg-transparent border-white/[0.05] text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06]'
              }`}
              style={isActive ? { color: tab.color, borderColor: `${tab.color}40` } : {}}
            >
              <tab.icon size={12} style={isActive ? { color: tab.color } : {}} />
              {tab.label}
              {/* loading pulse dot */}
              {tab.key !== 'library' && loading[tab.key] && (
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse opacity-60" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Grid content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {/* Loading skeletons */}
          {isTabLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>

          /* Empty state */
          ) : tracks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <Flame size={32} className="text-zinc-600" />
              <p className="text-sm font-bold text-white">No tracks available</p>
              <p className="text-xs text-zinc-500">
                {activeTab === 'library' ? 'Add songs to your library first.' : 'Could not load this category. Check your connection.'}
              </p>
            </div>

          /* Card grid */
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
              {tracks.map((track, idx) => {
                const isActive  = currentMedia?.id === track.id;
                const isHovered = hoveredId === track.id;
                const isFav     = favs[track.id] || track.favorite;

                return (
                  <motion.div
                    key={`${track.id}-${idx}`}
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.22, delay: idx * 0.03 }}
                    whileHover={{ y: -6, scale: 1.02 }}
                    onMouseEnter={() => setHoveredId(track.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={`group relative flex flex-col rounded-[22px] border overflow-hidden cursor-pointer transition-all duration-300 ${
                      isActive
                        ? 'border-white/20 shadow-2xl ring-1'
                        : 'border-white/[0.07] hover:border-white/15'
                    }`}
                    style={isActive ? { ringColor: currentTab.color, boxShadow: `0 20px 40px -10px ${currentTab.color}30` } : {}}
                  >
                    {/* ─ Artwork ─ */}
                    <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-900 flex-shrink-0">
                      {track.thumbnail ? (
                        <img
                          src={track.thumbnail}
                          alt={track.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div
                          className={`w-full h-full bg-gradient-to-br ${currentTab.bg} flex items-center justify-center text-4xl select-none`}
                        >
                          🎵
                        </div>
                      )}

                      {/* Rank badge — top-left */}
                      <div className="absolute top-2 left-2 z-10">
                        <span className={`text-xs font-black px-2 py-0.5 rounded-full backdrop-blur-md border ${
                          idx < 3
                            ? 'bg-black/60 border-white/20 text-white'
                            : 'bg-black/40 border-white/10 text-zinc-400'
                        }`}>
                          {idx < 3 ? MEDAL[idx] : `#${idx + 1}`}
                        </span>
                      </div>

                      {/* Source badge — top-right */}
                      <div className="absolute top-2 right-2 z-10">
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full border uppercase tracking-wide ${currentTab.badge} backdrop-blur-md`}>
                          {activeTab === 'worldwide' ? 'iTunes' : activeTab === 'saavn' ? 'Saavn' : activeTab === 'library' ? 'Local' : 'YT'}
                        </span>
                      </div>

                      {/* Hover / active overlay */}
                      <AnimatePresence>
                        {(isHovered || isActive) && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2"
                          >
                            {/* Favorite button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(track.id);
                                setFavs(prev => ({ ...prev, [track.id]: !isFav }));
                              }}
                              className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 transition-all"
                            >
                              <Heart
                                size={14}
                                fill={isFav ? '#fb7185' : 'none'}
                                className={isFav ? 'text-rose-400' : 'text-white'}
                              />
                            </button>

                            {/* Play / Pause button */}
                            <button
                              onClick={() => {
                                const isLocal = activeTab === 'library';
                                if (isLocal) {
                                  playMedia(track, tracks, idx);
                                } else {
                                  const mediaItem = {
                                    id: track.id?.startsWith('online-') ? track.id : `online-${track.id}`,
                                    title: track.title,
                                    artist: track.artist,
                                    album: track.album || '',
                                    duration: track.duration,
                                    filePath: track.previewUrl || 'online',
                                    thumbnail: track.thumbnail,
                                    type: 'audio',
                                    isOnline: true,
                                    isOnlinePreview: false,
                                    previewUrl: track.previewUrl,
                                  };
                                  const mediaQueue = tracks.map((t, i) => ({
                                    id: t.id?.startsWith('online-') ? t.id : `online-${t.id}`,
                                    title: t.title,
                                    artist: t.artist,
                                    album: t.album || '',
                                    duration: t.duration,
                                    filePath: t.previewUrl || 'online',
                                    thumbnail: t.thumbnail,
                                    type: 'audio',
                                    isOnline: true,
                                    isOnlinePreview: false,
                                    previewUrl: t.previewUrl,
                                  }));
                                  playMedia(mediaItem, mediaQueue, idx);
                                }
                              }}
                              className="w-11 h-11 rounded-full flex items-center justify-center shadow-xl border border-white/20 transition-all hover:scale-110 active:scale-95"
                              style={{ background: currentTab.color }}
                            >
                              {isActive && isPlaying
                                ? <Pause size={18} fill="black" className="text-black" />
                                : <Play  size={18} fill="black" className="text-black ml-0.5" />
                              }
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* ─ Info footer ─ */}
                    <div
                      className="px-3 py-2.5 flex flex-col gap-0.5"
                      style={{ background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(12px)' }}
                    >
                      <p className="text-xs font-bold text-white truncate leading-tight">{track.title}</p>
                      <p className="text-[10px] text-zinc-500 truncate font-medium">{track.artist || 'Unknown Artist'}</p>
                      {track.duration && track.duration < 6000 && (
                        <p className="text-[9px] font-mono text-zinc-700 mt-0.5">{formatDuration(track.duration)}</p>
                      )}
                    </div>

                    {/* Active glow line at bottom */}
                    {isActive && (
                      <div
                        className="absolute bottom-0 left-0 right-0 h-0.5"
                        style={{ background: currentTab.color }}
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
