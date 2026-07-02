import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, Shuffle, Repeat, Repeat1, Heart,
  ListMusic, FastForward, Rewind, Zap, Clock, X, Info, AlignLeft,
  Maximize2, Minimize2, Music, Languages, ChevronDown as ChevDown
} from 'lucide-react';
import { usePlayer, REPEAT_NONE, REPEAT_ONE } from '../../hooks/usePlayer.jsx';
import { useLibrary } from '../../hooks/useLibrary.jsx';
import { formatDuration, truncate } from '../../utils/formatters.js';
import { ipc } from '../../utils/ipc.js';
import { apiCache } from '../../utils/apiCache.js';
import EqualizerBars from './EqualizerBars.jsx';
import MediaCard from './MediaCard.jsx';
import ThreeDArtwork from './ThreeDArtwork.jsx';

const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
const SLEEP_OPTIONS = [
  { label: 'Off', value: 0 },
  { label: '5 Min', value: 5 },
  { label: '15 Min', value: 15 },
  { label: '30 Min', value: 30 },
  { label: '45 Min', value: 45 },
  { label: '60 Min', value: 60 },
];

export default function NowPlaying() {
  const {
    currentMedia, isPlaying, progress, currentTime, duration,
    volume, isMuted, shuffle: isShuffle, repeat, speed,
    queue, playNext, playPrev, seekTo, seekSeconds, togglePlay,
    changeVolume, toggleMute, changeSpeed, toggleShuffle, cycleRepeat,
    showNowPlaying, setShowNowPlaying,
    audioRef, mpvMode,
    dolbyAtmos, setDolbyAtmos,
    atmosMode, setAtmosMode,
    analyser, initAudioGraph,
    sleepTimerEnd, setSleepTimer, clearSleepTimer,
  } = usePlayer();

  const { toggleFavorite } = useLibrary();
  const [showQueue, setShowQueue] = useState(false);
  const [showSpeed, setShowSpeed] = useState(false);
  const [showSleep, setShowSleep] = useState(false);
  const [activeTab, setActiveTab] = useState('artwork'); // 'artwork' | 'lyrics' | 'info'
  const [remainingTime, setRemainingTime] = useState('');
  const [isWideMode, setIsWideMode] = useState(() => localStorage.getItem('nowplaying-widemode') === 'true');

  const toggleWideMode = () => {
    setIsWideMode(prev => {
      const next = !prev;
      localStorage.setItem('nowplaying-widemode', next.toString());
      if (next && activeTab === 'artwork') {
        setActiveTab('lyrics');
      }
      return next;
    });
  };

  useEffect(() => {
    if (isWideMode && activeTab === 'artwork') {
      setActiveTab('lyrics');
    }
  }, [isWideMode, activeTab]);

  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const videoContainerRef = useRef(null);

  const [dominantColor, setDominantColor] = useState('124, 58, 237'); // Default violet
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);
  const [imgError, setImgError] = useState(false);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [lyricsData, setLyricsData] = useState({ plain: null, synced: [] });
  const [hasLyrics, setHasLyrics] = useState(false);
  const [lyricsLang, setLyricsLang] = useState('original'); // 'original' or BCP-47 lang code
  const [translating, setTranslating] = useState(false);
  const [translatedLines, setTranslatedLines] = useState([]); // translated synced lines
  const [translatedPlain, setTranslatedPlain] = useState(null);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const lyricsContainerRef = useRef(null);
  const lyricLinesRef = useRef([]);

  useEffect(() => {
    setImgError(false);
  }, [currentMedia?.id]);

  // Video fallback mounter
  useEffect(() => {
    if (videoContainerRef.current && audioRef?.current && currentMedia?.type === 'video' && !mpvMode) {
      const videoElement = audioRef.current;
      videoElement.className = "w-full h-full object-contain bg-black rounded-2xl";
      videoContainerRef.current.appendChild(videoElement);

      return () => {
        if (videoElement.parentNode === videoContainerRef.current) {
          videoContainerRef.current.removeChild(videoElement);
        }
      };
    }
  }, [currentMedia?.id, mpvMode, showNowPlaying, audioRef]);

  // Sleep timer ticker
  useEffect(() => {
    if (!sleepTimerEnd) {
      setRemainingTime('');
      return;
    }
    const interval = setInterval(() => {
      const diff = sleepTimerEnd - Date.now();
      if (diff <= 0) {
        setRemainingTime('');
        clearInterval(interval);
      } else {
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setRemainingTime(`${m}:${s.toString().padStart(2, '0')}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [sleepTimerEnd]);

  // Parallax tilt mouse triggers
  const handleContainerMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    const angleX = (yc - y) / 12;
    const angleY = (x - xc) / 12;
    setTiltX(angleX);
    setTiltY(angleY);
  };

  const handleContainerMouseLeave = () => {
    setTiltX(0);
    setTiltY(0);
  };

  // Canvas audio visualizer logic
  useEffect(() => {
    if (!showNowPlaying || !audioRef?.current) return;
    initAudioGraph();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resizeCanvas = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particles for ambient flow
    const particles = [];
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.2 - Math.random() * 0.6,
        size: 1 + Math.random() * 2,
        alpha: 0.1 + Math.random() * 0.4,
      });
    }

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Draw particle flow
      particles.forEach(p => {
        p.y += p.vy;
        p.x += p.vx;
        if (p.y < 0) p.y = h;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        ctx.fillStyle = `rgba(${dominantColor}, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw bottom waves matching equalizer
      if (analyser) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        ctx.fillStyle = `rgba(${dominantColor}, 0.05)`;
        ctx.beginPath();
        const sliceWidth = w / bufferLength;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = h - (v * h) / 4;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.fill();
      }
    };
    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [showNowPlaying, audioRef, dominantColor, analyser]);

  // Art dominant color sampling
  useEffect(() => {
    if (!currentMedia?.thumbnail) {
      setDominantColor('124, 58, 237'); // fallback purple
      return;
    }
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = currentMedia.thumbnail;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 1, 1);
        const data = ctx.getImageData(0, 0, 1, 1).data;
        if (data[3] > 0) {
          setDominantColor(`${data[0]}, ${data[1]}, ${data[2]}`);
        }
      } catch {
        setDominantColor('124, 58, 237');
      }
    };
    img.onerror = () => setDominantColor('124, 58, 237');
  }, [currentMedia?.thumbnail]);

  // Load and parse lyrics when active tab is selected or track changes
  useEffect(() => {
    if (!currentMedia || !showNowPlaying) return;

    const fetchLyrics = async () => {
      setLyricsLoading(true);
      setLyricsData({ plain: null, synced: [] });
      setHasLyrics(false);
      try {
        const cacheKey = `lyrics:${currentMedia.id}`;
        // Seed from cache to avoid loading flash when re-opening same track
        const cached = apiCache.peek(cacheKey);
        if (cached?.ok && (cached.plainLyrics || cached.syncedLyrics)) {
          const parsed = parseLrc(cached.syncedLyrics);
          setLyricsData({ plain: cached.plainLyrics, synced: parsed });
          setHasLyrics(true);
          setLyricsLoading(false);
          return;
        }
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
          const parsed = parseLrc(res.syncedLyrics);
          setLyricsData({ plain: res.plainLyrics, synced: parsed });
          setHasLyrics(true);
        }
      } catch (err) {
        console.error('[Lyrics] NowPlaying fetch failed:', err);
      } finally {
        setLyricsLoading(false);
      }
    };

    fetchLyrics();
  }, [currentMedia?.id, showNowPlaying]);

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
        if (text || parsed.length === 0 || parsed[parsed.length - 1].text !== '') {
          parsed.push({ time, text });
        }
      }
    }
    return parsed.sort((a, b) => a.time - b.time);
  };

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

  useEffect(() => {
    if (isSynced && activeIndex !== -1 && lyricLinesRef.current[activeIndex]) {
      lyricLinesRef.current[activeIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [activeIndex, isSynced, activeTab]);

  // Reset lang to original when track changes
  useEffect(() => {
    setLyricsLang('original');
    setTranslatedLines([]);
    setTranslatedPlain(null);
  }, [currentMedia?.id]);

  // Translate lyrics — cached per trackId+lang so same combo never re-fetches
  useEffect(() => {
    if (lyricsLang === 'original' || !hasLyrics) {
      setTranslatedLines([]);
      setTranslatedPlain(null);
      return;
    }

    const doTranslate = async () => {
      setTranslating(true);
      try {
        if (isSynced && lyricsData.synced.length > 0) {
          const batchText = lyricsData.synced.map(l => l.text || '•••').join('\n');
          const cacheKey  = `translate:${currentMedia?.id}:${lyricsLang}:synced`;
          const res = await apiCache.get(
            cacheKey,
            () => ipc.online.translate({ text: batchText, targetLang: lyricsLang }),
            60 // translations are stable — cache 1 hour
          );
          if (res?.ok) setTranslatedLines(res.text.split('\n'));
        } else if (lyricsData.plain) {
          const cacheKey = `translate:${currentMedia?.id}:${lyricsLang}:plain`;
          const res = await apiCache.get(
            cacheKey,
            () => ipc.online.translate({ text: lyricsData.plain, targetLang: lyricsLang }),
            60
          );
          if (res?.ok) setTranslatedPlain(res.text);
        }
      } catch (err) {
        console.error('[Translate] Failed:', err);
      } finally {
        setTranslating(false);
      }
    };

    // Seed from cache if available
    const syncKey  = `translate:${currentMedia?.id}:${lyricsLang}:synced`;
    const plainKey = `translate:${currentMedia?.id}:${lyricsLang}:plain`;
    const cachedSync  = apiCache.peek(syncKey);
    const cachedPlain = apiCache.peek(plainKey);
    if (isSynced && cachedSync?.ok) {
      setTranslatedLines(cachedSync.text.split('\n'));
      return;
    }
    if (!isSynced && cachedPlain?.ok) {
      setTranslatedPlain(cachedPlain.text);
      return;
    }

    doTranslate();
  }, [lyricsLang, hasLyrics]);

  const LANG_OPTIONS = [
    { code: 'original', label: 'Original' },
    { code: 'en', label: '🇬🇧 English' },
    { code: 'hi', label: '🇮🇳 Hindi' },
    { code: 'pa', label: '🌾 Punjabi' },
    { code: 'bho', label: '🌻 Bhojpuri' },
    { code: 'mr', label: '🟠 Marathi' },
    { code: 'ta', label: '🌺 Tamil' },
    { code: 'te', label: '🌸 Telugu' },
    { code: 'es', label: '🇪🇸 Spanish' },
    { code: 'fr', label: '🇫🇷 French' },
    { code: 'de', label: '🇩🇪 German' },
    { code: 'ja', label: '🇯🇵 Japanese' },
    { code: 'ko', label: '🇰🇷 Korean' },
    { code: 'ar', label: '🇸🇦 Arabic' },
    { code: 'zh-CN', label: '🇨🇳 Chinese' },
  ];

  if (!currentMedia) return null;

  const handleSeek = (e) => {
    const bar  = e.currentTarget.getBoundingClientRect();
    const frac = (e.clientX - bar.left) / bar.width;
    seekTo(Math.max(0, Math.min(1, frac)));
  };

  const RepeatIcon = repeat === REPEAT_ONE ? Repeat1 : Repeat;

  const renderControlsDashboard = (compact = false) => {
    return (
      <div
        className={`w-full flex flex-col items-center gap-5 glass border border-white/5 p-5 rounded-3xl shadow-2xl relative transition-all duration-300 ${
          compact ? 'max-w-sm' : 'max-w-md'
        }`}
        style={{ borderColor: 'var(--glass-border)' }}
      >
        {/* Title & Artist */}
        <div className="text-center w-full min-w-0">
          <h2 className="text-xl font-bold font-brand tracking-tight text-white truncate px-2">{currentMedia.title}</h2>
          <p className="text-xs text-zinc-400 mt-1 truncate px-2">{currentMedia.artist || 'Unknown Artist'}</p>
        </div>

        {/* Slider Progress bar */}
        <div className="w-full">
          <div className="h-1 rounded-full cursor-pointer group relative" style={{ background: 'rgba(255,255,255,0.06)' }} onClick={handleSeek}>
            <div className="h-full rounded-full relative transition-all" style={{ width: `${progress * 100}%`, background: `rgb(${dominantColor})` }}>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div className="flex justify-between mt-2 text-[10px] font-semibold text-zinc-500 font-mono">
            <span>{formatDuration(currentTime)}</span>
            <span>{formatDuration(duration)}</span>
          </div>
        </div>

        {/* Primary playback control row */}
        <div className="flex items-center justify-between w-full px-2">
          <button
            id="np-shuffle"
            onClick={toggleShuffle}
            className="p-1 text-zinc-400 hover:text-white transition-colors active:scale-95"
            style={{ color: isShuffle ? `rgb(${dominantColor})` : '' }}
          >
            <Shuffle size={16} />
          </button>

          <div className="flex items-center gap-3">
            <button id="np-prev" onClick={playPrev} className="p-2 rounded-xl glass-button text-zinc-300 active:scale-95">
              <SkipBack size={18} fill="currentColor" />
            </button>
            <button id="np-back10" onClick={() => seekSeconds(-10)} className="p-2 rounded-xl glass-button text-zinc-400 active:scale-95">
              <Rewind size={14} />
            </button>

            <motion.button
              id="np-play"
              onClick={togglePlay}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-xl active:scale-95"
              style={{
                background: `rgb(${dominantColor})`,
                boxShadow: `0 0 20px rgba(${dominantColor}, 0.4)`
              }}
            >
              {isPlaying ? (
                <Pause size={20} fill="white" className="text-white" />
              ) : (
                <Play size={20} fill="white" className="text-white ml-0.5" />
              )}
            </motion.button>

            <button id="np-fwd10" onClick={() => seekSeconds(10)} className="p-2 rounded-xl glass-button text-zinc-400 active:scale-95">
              <FastForward size={14} />
            </button>
            <button id="np-next" onClick={playNext} className="p-2 rounded-xl glass-button text-zinc-300 active:scale-95">
              <SkipForward size={18} fill="currentColor" />
            </button>
          </div>

          <button
            id="np-repeat"
            onClick={cycleRepeat}
            className="p-1 text-zinc-400 hover:text-white transition-colors active:scale-95"
            style={{ color: repeat !== REPEAT_NONE ? `rgb(${dominantColor})` : '' }}
          >
            <RepeatIcon size={16} />
          </button>
        </div>

        {/* Dolby Atmos spatial controls */}
        <div className="w-full pt-3 border-t border-white/5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDolbyAtmos(!dolbyAtmos)}
              className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all ${
                dolbyAtmos
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white border-transparent shadow-lg'
                  : 'bg-zinc-800/80 text-zinc-400 border-zinc-700/50 hover:bg-zinc-700/80'
              }`}
            >
              Dolby Atmos
            </button>
            {dolbyAtmos && (
              <span className="text-[9px] font-bold uppercase tracking-wider text-violet-400 animate-pulse">
                3D {atmosMode} Active
              </span>
            )}
          </div>

          {dolbyAtmos && (
            <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/5">
              {['music', 'movie', 'spatial'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setAtmosMode(mode)}
                  className={`px-2 py-0.5 rounded-md text-[8px] uppercase tracking-wider font-bold transition-all ${
                    atmosMode === mode ? 'bg-zinc-800 text-white border border-white/10' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {mode === 'spatial' ? '3D' : mode}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Parameters & Tools (Speed, Sleep timer, Favorite, Queue) */}
        <div className="w-full pt-3 border-t border-white/5 flex items-center justify-between relative">

          {/* Volume bar */}
          <div className="flex items-center gap-2">
            <button onClick={toggleMute} className="text-zinc-400 hover:text-white transition-colors">
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <input
              type="range" min="0" max="200" value={isMuted ? 0 : volume}
              onChange={e => changeVolume(Number(e.target.value))}
              className="w-16 h-0.5 accent-[var(--accent)] cursor-pointer"
            />
          </div>

          {/* Speed toggle */}
          <div className="relative">
            <button
              onClick={() => { setShowSpeed(!showSpeed); setShowSleep(false); }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold font-mono glass hover:bg-white/10 text-zinc-300"
            >
              <Zap size={10} />
              {speed}x
            </button>
            <AnimatePresence>
              {showSpeed && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 rounded-xl border border-white/5 shadow-2xl p-1 flex flex-col gap-0.5 z-50 glass min-w-[64px]"
                >
                  {SPEED_OPTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => { changeSpeed(s); setShowSpeed(false); }}
                      className={`px-2 py-1 rounded-lg text-[9px] font-mono hover:bg-white/5 transition-colors ${
                        speed === s ? 'font-bold text-white' : 'text-zinc-400'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sleep Timer */}
          <div className="relative">
            <button
              onClick={() => { setShowSleep(!showSleep); setShowSpeed(false); }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold font-mono glass hover:bg-white/10 text-zinc-300"
              style={{ color: sleepTimerEnd ? `rgb(${dominantColor})` : '' }}
            >
              <Clock size={10} />
              {remainingTime || 'Timer'}
            </button>
            <AnimatePresence>
              {showSleep && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 rounded-xl border border-white/5 shadow-2xl p-1 flex flex-col gap-0.5 z-50 glass min-w-[76px]"
                >
                  {SLEEP_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        if (opt.value === 0) clearSleepTimer();
                        else setSleepTimer(opt.value);
                        setShowSleep(false);
                      }}
                      className={`px-2 py-1 rounded-lg text-[9px] font-semibold hover:bg-white/5 transition-colors ${
                        (opt.value === 0 && !sleepTimerEnd) ? 'text-white font-bold' : 'text-zinc-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-2">
            <button onClick={() => toggleFavorite(currentMedia.id)} className="text-zinc-400 hover:text-white transition-colors">
              <Heart size={15} fill={currentMedia.favorite ? 'currentColor' : 'none'} className={currentMedia.favorite ? 'text-rose-400 animate-pulse' : ''} />
            </button>
            <button onClick={() => setShowQueue(!showQueue)} className="text-zinc-400 hover:text-white transition-colors">
              <ListMusic size={15} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {showNowPlaying && (
        <motion.div
          className="fixed inset-0 z-50 flex overflow-hidden glass-panel-premium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Ambient background visualizer */}
          <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none w-full h-full z-0" />

          {/* Large blurred art background */}
          {currentMedia.thumbnail && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none opacity-20 blur-3xl">
              <img src={currentMedia.thumbnail} alt="" className="w-full h-full object-cover scale-105" />
            </div>
          )}

          {/* Central content frame */}
          <div className={`relative z-10 flex-grow flex flex-col justify-between py-6 px-6 md:px-12 h-full gap-4 transition-all duration-300 ${
            isWideMode ? 'w-full max-w-7xl mx-auto' : 'max-w-5xl mx-auto w-full'
          }`}>

            {/* Header top bar */}
            <div className="w-full flex items-center justify-between">
              <button
                id="nowplaying-close"
                onClick={() => setShowNowPlaying(false)}
                className="p-2 rounded-xl glass-button text-zinc-300"
              >
                <ChevronDown size={20} />
              </button>
              <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/5">
                {['artwork', 'lyrics', 'info'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                      activeTab === tab ? 'bg-white text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {tab === 'artwork' ? 'Player' : tab === 'lyrics' ? 'Lyrics' : 'Details'}
                  </button>
                ))}
              </div>
              <div className="w-9 h-9" />
            </div>

            {/* Dynamic Content Panel Grid */}
            <div className={`flex-grow w-full flex min-h-0 transition-all duration-300 ${
              isWideMode
                ? 'flex-col md:flex-row items-center justify-center gap-10 md:gap-16 py-4'
                : 'flex-col items-center justify-center py-2'
            }`}>

              {/* Tab view area */}
              <div className={`flex items-center justify-center min-h-0 transition-all duration-300 ${
                isWideMode ? 'w-full md:w-1/2 h-full max-w-xl' : 'max-w-lg w-full'
              }`}>
                <AnimatePresence mode="wait">
                  {activeTab === 'artwork' && (
                    <motion.div
                      key="art-tab"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onMouseMove={handleContainerMouseMove}
                      onMouseLeave={handleContainerMouseLeave}
                      className="relative flex items-center justify-center h-64 md:h-72 w-full perspective-1000 preserve-3d cursor-pointer select-none"
                    >
                      {/* Cover Art Box */}
                      <motion.div
                        animate={{
                          x: isPlaying && (currentMedia.type !== 'video' || mpvMode) ? -60 : 0,
                          rotateY: tiltY,
                          rotateX: tiltX
                        }}
                        transition={{ type: 'spring', stiffness: 120, damping: 16 }}
                        className="absolute z-10 w-56 h-56 md:w-60 md:h-60 rounded-2xl overflow-hidden glass shadow-2xl flex-shrink-0"
                        style={{
                          boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 40px rgba(${dominantColor}, 0.25)`,
                        }}
                      >
                        {currentMedia.type === 'video' && !mpvMode ? (
                          <div ref={videoContainerRef} className="w-full h-full bg-black flex items-center justify-center" />
                        ) : currentMedia.thumbnail && !imgError ? (
                          <img src={currentMedia.thumbnail} alt="" className="w-full h-full object-cover" onError={() => setImgError(true)} />
                        ) : (
                          <ThreeDArtwork title={currentMedia.title} id={currentMedia.id} />
                        )}
                      </motion.div>

                      {/* Spinning Vinyl element */}
                      {(currentMedia.type !== 'video' || mpvMode) && (
                        <motion.div
                          animate={{ x: isPlaying ? 65 : 15 }}
                          transition={{ type: 'spring', stiffness: 120, damping: 16 }}
                          className="absolute w-52 h-52 md:w-56 md:h-56 rounded-full vinyl-grooves flex items-center justify-center shadow-2xl z-0"
                        >
                          <div className={`absolute inset-0 rounded-full vinyl-reflection conic-rotate ${isPlaying ? '' : 'animation-paused'}`} />
                          <div className={`absolute inset-0 rounded-full vinyl-reflection-holographic conic-rotate ${isPlaying ? '' : 'animation-paused'}`} />
                          <div className="w-20 h-20 rounded-full bg-zinc-900 border-4 border-zinc-800 flex items-center justify-center overflow-hidden relative">
                            {currentMedia.thumbnail && !imgError ? (
                              <img src={currentMedia.thumbnail} alt="" className={`w-full h-full object-cover rounded-full conic-rotate ${isPlaying ? '' : 'animation-paused'}`} onError={() => setImgError(true)} />
                            ) : (
                              <div className={`w-full h-full conic-rotate ${isPlaying ? '' : 'animation-paused'}`}>
                                <ThreeDArtwork title={currentMedia.title} id={currentMedia.id} isCompact />
                              </div>
                            )}
                            <div className="absolute w-3 h-3 rounded-full bg-black shadow-inner border border-zinc-800" />
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {activeTab === 'lyrics' && (
                    <motion.div
                      key="lyrics-tab"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      className="w-full h-72 md:h-[380px] rounded-3xl glass border border-white/5 flex flex-col min-h-0 overflow-hidden"
                    >
                      {/* Language selector header */}
                      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/[0.06] flex-shrink-0">
                        <div className="flex items-center gap-2">
                          <AlignLeft size={14} className="text-cyan-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-white">Lyrics</span>
                          {lyricsLang !== 'original' && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 font-bold">
                              {LANG_OPTIONS.find(l => l.code === lyricsLang)?.label}
                            </span>
                          )}
                        </div>
                        {/* Language dropdown */}
                        <div className="relative">
                          <button
                            onClick={() => setShowLangMenu(v => !v)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl glass border border-white/10 text-[10px] font-bold text-zinc-300 hover:text-white hover:border-white/20 transition-all"
                          >
                            <Languages size={11} />
                            <span>{lyricsLang === 'original' ? 'Language' : LANG_OPTIONS.find(l => l.code === lyricsLang)?.label.slice(0,8)}</span>
                          </button>
                          <AnimatePresence>
                            {showLangMenu && (
                              <motion.div
                                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="absolute top-full mt-1.5 right-0 z-50 glass-panel-premium border border-white/10 rounded-2xl shadow-2xl p-1.5 min-w-[140px] max-h-56 overflow-y-auto scrollbar-none"
                              >
                                {LANG_OPTIONS.map(lang => (
                                  <button
                                    key={lang.code}
                                    onClick={() => { setLyricsLang(lang.code); setShowLangMenu(false); }}
                                    className={`w-full text-left px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all ${
                                      lyricsLang === lang.code
                                        ? 'bg-cyan-500/20 text-cyan-300 font-black'
                                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                    }`}
                                  >
                                    {lang.label}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* Lyrics content — premium animated view */}
                      <div className="relative flex-grow min-h-0 overflow-hidden">

                        {/* Top fade */}
                        <div className="absolute top-0 left-0 right-0 h-10 z-10 pointer-events-none"
                          style={{ background: 'linear-gradient(to bottom, rgba(10,10,14,0.95), transparent)' }}
                        />
                        {/* Bottom fade */}
                        <div className="absolute bottom-0 left-0 right-0 h-14 z-10 pointer-events-none"
                          style={{ background: 'linear-gradient(to top, rgba(10,10,14,0.95), transparent)' }}
                        />

                        <div
                          ref={lyricsContainerRef}
                          className="h-full overflow-y-auto px-5 scrollbar-none"
                        >
                          {lyricsLoading ? (
                            <div className="flex flex-col items-center justify-center h-full space-y-4">
                              <div className="relative">
                                <div className="w-10 h-10 border-2 border-t-transparent border-cyan-400 rounded-full animate-spin" />
                                <div className="absolute inset-1 border border-t-transparent border-violet-500/50 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.7s' }} />
                              </div>
                              <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest animate-pulse">Syncing lyrics...</p>
                            </div>
                          ) : !hasLyrics ? (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                                <Music size={28} className="text-zinc-600" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-white">No Lyrics Found</p>
                                <p className="text-xs text-zinc-600 mt-1">We couldn't resolve lyrics for this track.</p>
                              </div>
                            </div>
                          ) : translating ? (
                            <div className="flex flex-col items-center justify-center h-full space-y-3">
                              <div className="w-7 h-7 border-2 border-t-transparent border-violet-400 rounded-full animate-spin" />
                              <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest animate-pulse">Translating...</p>
                            </div>
                          ) : isSynced ? (
                            <div className="py-10 pb-24 space-y-1">
                              {lyricsData.synced.map((line, idx) => {
                                const active  = idx === activeIndex;
                                const near    = Math.abs(idx - activeIndex) <= 2;
                                const displayText = (lyricsLang !== 'original' && translatedLines[idx])
                                  ? translatedLines[idx]
                                  : (line.text || '•••');
                                return (
                                  <motion.div
                                    key={`l-${idx}`}
                                    ref={(el) => (lyricLinesRef.current[idx] = el)}
                                    onClick={() => seekSeconds(line.time)}
                                    animate={{
                                      opacity: active ? 1 : near ? 0.55 : 0.22,
                                      scale:   active ? 1.03 : 1,
                                      filter:  active ? 'blur(0px)' : near ? 'blur(0.5px)' : 'blur(1.5px)',
                                      y:       active ? 0 : 0,
                                    }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    className="relative cursor-pointer select-none text-left rounded-2xl px-4 py-2.5 group"
                                  >
                                    {/* Active line highlight bar */}
                                    {active && (
                                      <motion.div
                                        layoutId="lyricsActiveBg"
                                        className="absolute inset-0 rounded-2xl"
                                        style={{
                                          background: 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)',
                                          border: '1px solid rgba(255,255,255,0.08)',
                                          backdropFilter: 'blur(12px)',
                                        }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                                      />
                                    )}

                                    {/* Left accent bar on active */}
                                    {active && (
                                      <motion.div
                                        layoutId="lyricsAccentBar"
                                        className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
                                        style={{ background: 'linear-gradient(to bottom, #67e8f9, #818cf8)' }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                                      />
                                    )}

                                    <span
                                      className={`relative z-10 leading-snug font-display block ${
                                        active
                                          ? 'text-sm md:text-base font-black'
                                          : 'text-xs md:text-sm font-semibold'
                                      }`}
                                      style={active ? {
                                        color: '#ffffff',
                                        textShadow: '0 0 20px rgba(103,232,249,0.6), 0 0 40px rgba(129,140,248,0.3)',
                                      } : {
                                        color: 'rgba(255,255,255,0.5)',
                                      }}
                                    >
                                      {displayText}
                                    </span>
                                  </motion.div>
                                );
                              })}
                            </div>
                          ) : (
                            <div
                              className="text-zinc-300 text-sm leading-loose whitespace-pre-line font-medium text-left py-8 pb-16 select-text"
                              style={{ textShadow: '0 1px 8px rgba(0,0,0,0.8)' }}
                            >
                              {(lyricsLang !== 'original' && translatedPlain) ? translatedPlain : lyricsData.plain}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'info' && (
                    <motion.div
                      key="info-tab"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      className="w-full h-72 rounded-3xl glass border border-white/5 p-6 flex flex-col justify-between"
                    >
                      <div className="space-y-3 text-left">
                        <div className="flex items-center gap-2">
                          <Info size={16} className="text-violet-400" />
                          <span className="text-xs font-bold text-white uppercase tracking-wider">Song Specifications</span>
                        </div>
                        <div className="space-y-1.5 text-xs text-zinc-300">
                          <p><span className="font-semibold text-zinc-500">File Name:</span> {currentMedia.fileName}</p>
                          <p><span className="font-semibold text-zinc-500">Format extension:</span> {currentMedia.format?.toUpperCase() || 'AUDIO'}</p>
                          <p><span className="font-semibold text-zinc-500">Path:</span> <span className="font-mono text-[10px] break-all">{currentMedia.filePath}</span></p>
                        </div>
                      </div>
                      <div className="text-[10px] text-zinc-500 font-bold uppercase border-t border-white/5 pt-3">
                        Offline Storage scan verified
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Side-by-side controls (Only shown in Wide mode) */}
              {isWideMode && (
                <div className="w-full md:w-1/2 flex items-center justify-center">
                  {renderControlsDashboard(true)}
                </div>
              )}
            </div>

            {/* Bottom Controls Dashboard (Only shown in Standard Mode) */}
            {!isWideMode && (
              <div className="w-full flex justify-center pb-4">
                {renderControlsDashboard(false)}
              </div>
            )}

          </div>

          {/* Floating wide-mode toggle button in bottom right corner */}
          <button
            onClick={toggleWideMode}
            className="absolute bottom-6 right-6 p-2.5 rounded-xl glass-button text-zinc-400 hover:text-white transition-all shadow-xl active:scale-95 z-30"
            title={isWideMode ? "Focused Layout" : "Full Screen Wide Layout"}
          >
            {isWideMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>

          {/* Queue Panel Overlay */}
          <AnimatePresence>
            {showQueue && (
              <motion.div
                initial={{ x: 340 }}
                animate={{ x: 0 }}
                exit={{ x: 340 }}
                className="w-80 h-full border-l flex flex-col z-20 glass-panel-premium relative shadow-2xl"
                style={{ borderColor: 'rgba(255,255,255,0.08)' }}
              >
                <div className="flex items-center justify-between px-4 py-4 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <ListMusic size={16} className="text-violet-400" />
                    <h3 className="font-bold text-xs text-white uppercase tracking-wider">Play Queue</h3>
                    <span className="text-[10px] text-zinc-500 font-bold">({queue.length})</span>
                  </div>
                  <button onClick={() => setShowQueue(false)} className="p-1 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white">
                    <X size={16} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                  {queue.map((m, i) => (
                    <MediaCard key={m.id} media={m} queue={queue} index={i} compact />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
