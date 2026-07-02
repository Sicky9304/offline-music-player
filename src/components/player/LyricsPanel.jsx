import { useState, useEffect, useRef } from 'react';
import { X, Music, Radio, AlignLeft } from 'lucide-react';
import { usePlayer } from '../../hooks/usePlayer.jsx';
import { ipc } from '../../utils/ipc.js';
import { apiCache } from '../../utils/apiCache.js';

export default function LyricsPanel({ isOpen, onClose }) {
  const { currentMedia, currentTime, seekSeconds, isPlaying } = usePlayer();
  const [loading, setLoading] = useState(false);
  const [lyricsData, setLyricsData] = useState({ plain: null, synced: [] });
  const [hasLyrics, setHasLyrics] = useState(false);
  
  const containerRef = useRef(null);
  const lineRefs = useRef([]);

  // Fetch lyrics whenever current media changes
  useEffect(() => {
    if (!currentMedia) {
      setLyricsData({ plain: null, synced: [] });
      setHasLyrics(false);
      return;
    }

    const fetchLyrics = async () => {
      setLoading(true);
      setLyricsData({ plain: null, synced: [] });
      setHasLyrics(false);
      try {
        const cacheKey = `lyrics:${currentMedia.id}`;
        // Use cached result if available (30-min TTL)
        const res = await apiCache.get(
          cacheKey,
          () => ipc.online.getLyrics({
            artist:   currentMedia.artist,
            title:    currentMedia.title,
            duration: currentMedia.duration || 0,
          }),
          30
        );

        if (res && res.ok && (res.plainLyrics || res.syncedLyrics)) {
          const parsedSynced = parseLrc(res.syncedLyrics);
          setLyricsData({ plain: res.plainLyrics, synced: parsedSynced });
          setHasLyrics(true);
        }
      } catch (err) {
        console.error('[Lyrics] Fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      // Seed from cache immediately to prevent flash of loading state
      const cached = apiCache.peek(`lyrics:${currentMedia.id}`);
      if (cached?.ok && (cached.plainLyrics || cached.syncedLyrics)) {
        const parsedSynced = parseLrc(cached.syncedLyrics);
        setLyricsData({ plain: cached.plainLyrics, synced: parsedSynced });
        setHasLyrics(true);
        setLoading(false);
        return;
      }
      fetchLyrics();
    }
  }, [currentMedia, isOpen]);

  // Helper to parse LRC strings: [00:12.34] Lyric text
  const parseLrc = (lrcText) => {
    if (!lrcText) return [];
    const lines = lrcText.split('\n');
    const timeRegex = /\[(\d+):(\d+)(?:\.(\d+))?\]/g;
    const parsed = [];

    for (const line of lines) {
      const text = line.replace(timeRegex, '').trim();
      let match;
      timeRegex.lastIndex = 0;
      
      while ((match = timeRegex.exec(line)) !== null) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const ms = match[3] ? parseInt(match[3].padEnd(3, '0').slice(0, 3), 10) : 0;
        const time = minutes * 60 + seconds + ms / 1000;
        
        // Skip empty synchronization lines
        if (text || parsed.length === 0 || parsed[parsed.length - 1].text !== '') {
          parsed.push({ time, text });
        }
      }
    }

    return parsed.sort((a, b) => a.time - b.time);
  };

  // Find the active index based on currentTime
  let activeIndex = -1;
  const isSynced = lyricsData.synced && lyricsData.synced.length > 0;

  if (isSynced) {
    for (let i = 0; i < lyricsData.synced.length; i++) {
      if (currentTime >= lyricsData.synced[i].time) {
        activeIndex = i;
      } else {
        break;
      }
    }
  }

  // Smooth scroll to active line
  useEffect(() => {
    if (isSynced && activeIndex !== -1 && lineRefs.current[activeIndex]) {
      lineRefs.current[activeIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [activeIndex, isSynced]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[450px] bg-zinc-950/95 border-l border-white/10 backdrop-blur-2xl shadow-2xl z-50 flex flex-col transition-all duration-300 transform translate-x-0">
      
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <AlignLeft size={16} className="text-cyan-400" />
          <h3 className="text-sm font-black text-white uppercase tracking-wider font-display">Lyrics</h3>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl border border-white/5 text-zinc-400 hover:text-white hover:bg-white/5 transition-all active:scale-95"
        >
          <X size={16} />
        </button>
      </div>

      {/* Song details */}
      {currentMedia && (
        <div className="px-6 py-4 bg-white/[0.01] border-b border-white/5 flex items-center gap-4">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-zinc-900 border border-white/10 flex-shrink-0">
            {currentMedia.thumbnail ? (
              <img src={currentMedia.thumbnail} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-500">
                <Music size={16} />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs xs:text-sm font-bold text-white truncate">{currentMedia.title}</h4>
            <p className="text-[10px] xs:text-xs text-zinc-400 truncate mt-0.5 font-semibold">{currentMedia.artist}</p>
          </div>
        </div>
      )}

      {/* Lyrics body panel */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto px-6 py-8 scrollbar-none space-y-6"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="w-8 h-8 border-2 border-t-transparent border-cyan-400 rounded-full animate-spin" />
            <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Syncing lyrics...</p>
          </div>
        ) : !hasLyrics ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
            <Radio size={36} className="text-zinc-600 animate-pulse" />
            <div>
              <p className="text-sm font-bold text-white">No Lyrics Found</p>
              <p className="text-xs text-zinc-500 mt-1">We couldn't resolve lyrics for this track.</p>
            </div>
          </div>
        ) : isSynced ? (
          /* Synchronized Scrolling View */
          <div className="space-y-4 pb-32">
            {lyricsData.synced.map((line, idx) => {
              const active = idx === activeIndex;
              return (
                <div
                  key={`line-${idx}`}
                  ref={(el) => (lineRefs.current[idx] = el)}
                  onClick={() => seekSeconds(line.time)}
                  className={`py-2 px-3 rounded-xl cursor-pointer transition-all duration-300 font-display ${
                    active
                      ? 'text-lg font-black text-cyan-400 scale-105 bg-white/[0.03] shadow-inner'
                      : 'text-sm font-bold text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {line.text || '•••'}
                </div>
              );
            })}
          </div>
        ) : (
          /* Static Text Fallback View */
          <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line font-medium pb-20 select-text">
            {lyricsData.plain}
          </div>
        )}
      </div>
    </div>
  );
}
