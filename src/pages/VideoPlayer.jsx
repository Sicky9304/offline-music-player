import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, MoveLeft, Tv, ChevronRight, PlayCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function VideoPlayer() {
  const location = useLocation();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const hudTimeoutRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [showControls, setShowControls] = useState(true);

  // Advanced features state
  const [hud, setHud] = useState({ visible: false, text: '', icon: '' });
  const [bookmarkTime, setBookmarkTime] = useState(0);
  const [showBookmark, setShowBookmark] = useState(false);
  const [pipSupported, setPipSupported] = useState(false);

  // Extract file path from query params
  const filePath = new URLSearchParams(location.search).get('path') || '';
  const title = filePath ? filePath.split('\\').pop().split('/').pop() : 'Video Player';

  useEffect(() => {
    // Check if Picture-in-Picture is supported
    if (document.pictureInPictureEnabled) {
      setPipSupported(true);
    }

    // Listen for new video load events from IPC (in case window is reused)
    const unsub = window.electron?.on('video:load', (newPath) => {
      if (videoRef.current) {
        setShowBookmark(false);
        const src = newPath.replace(/\\/g, '/');
        videoRef.current.src = `file:///${src.startsWith('/') ? src.slice(1) : src}`;
        videoRef.current.play();
      }
    });

    return () => {
      unsub && unsub();
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (videoRef.current && filePath) {
      setShowBookmark(false);
      const src = filePath.replace(/\\/g, '/');
      videoRef.current.src = `file:///${src.startsWith('/') ? src.slice(1) : src}`;
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [filePath]);

  // Save/Load Bookmark positions
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      
      // Save bookmark every few seconds (exclude start & end buffer)
      if (time > 5 && time < videoRef.current.duration - 5) {
        localStorage.setItem(`bookmark:${filePath}`, time.toString());
      } else if (time >= videoRef.current.duration - 5) {
        localStorage.removeItem(`bookmark:${filePath}`);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      
      // Look for a saved bookmark
      const saved = localStorage.getItem(`bookmark:${filePath}`);
      if (saved) {
        const time = parseFloat(saved);
        if (time > 5 && time < videoRef.current.duration - 5) {
          setBookmarkTime(time);
          setShowBookmark(true);
          // Auto hide bookmark banner after 8 seconds
          setTimeout(() => setShowBookmark(false), 8000);
        }
      }
    }
  };

  const handleResume = (e) => {
    e.stopPropagation();
    if (videoRef.current && bookmarkTime) {
      videoRef.current.currentTime = bookmarkTime;
      setCurrentTime(bookmarkTime);
      videoRef.current.play().catch(() => {});
      showHud('Resumed', 'play');
    }
    setShowBookmark(false);
  };

  const handleRestart = (e) => {
    e.stopPropagation();
    setShowBookmark(false);
    localStorage.removeItem(`bookmark:${filePath}`);
  };

  // HUD Indicator HUD
  const showHud = (text, icon) => {
    setHud({ visible: true, text, icon });
    if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
    hudTimeoutRef.current = setTimeout(() => {
      setHud(prev => ({ ...prev, visible: false }));
    }, 800);
  };

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (!videoRef.current) return;

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'arrowleft':
          e.preventDefault();
          videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
          showHud('-5s', 'rewind');
          break;
        case 'arrowright':
          e.preventDefault();
          videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 5);
          showHud('+5s', 'forward');
          break;
        case 'arrowup':
          e.preventDefault();
          setVolume(prev => {
            const next = Math.min(100, prev + 5);
            videoRef.current.volume = next / 100;
            showHud(`Volume ${next}%`, 'volume');
            return next;
          });
          break;
        case 'arrowdown':
          e.preventDefault();
          setVolume(prev => {
            const next = Math.max(0, prev - 5);
            videoRef.current.volume = next / 100;
            showHud(`Volume ${next}%`, 'volume');
            return next;
          });
          break;
        case 'f':
          e.preventDefault();
          handleToggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          handleToggleMute();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [volume, isMuted, isFullscreen, isPlaying]);

  // Double Click Skip Handler
  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const isLeft = clickX < rect.width * 0.4;
    
    if (isLeft) {
      const nextTime = Math.max(0, videoRef.current.currentTime - 10);
      videoRef.current.currentTime = nextTime;
      showHud('<< 10s', 'rewind');
    } else {
      const nextTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 10);
      videoRef.current.currentTime = nextTime;
      showHud('>> 10s', 'forward');
    }
  };

  // Handle controls visibility timer
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 2500);
  };

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
      showHud('Play', 'play');
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      showHud('Pause', 'pause');
    }
  };

  const handleSeek = (e) => {
    if (videoRef.current) {
      const val = parseFloat(e.target.value);
      videoRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const handleVolumeChange = (e) => {
    if (videoRef.current) {
      const val = parseInt(e.target.value, 10);
      setVolume(val);
      videoRef.current.volume = val / 100;
      setIsMuted(val === 0);
    }
  };

  const handleToggleMute = () => {
    if (videoRef.current) {
      const next = !isMuted;
      setIsMuted(next);
      videoRef.current.muted = next;
      showHud(next ? 'Mute' : 'Unmute', next ? 'mute' : 'volume');
    }
  };

  const handleSpeedChange = (e) => {
    const val = parseFloat(e.target.value);
    setSpeed(val);
    if (videoRef.current) {
      videoRef.current.playbackRate = val;
      showHud(`Speed ${val}x`, 'speed');
    }
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {});
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleTogglePiP = async (e) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        showHud('Exit PiP', 'pip');
      } else {
        await videoRef.current.requestPictureInPicture();
        showHud('Enter PiP', 'pip');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onDoubleClick={handleDoubleClick}
      onClick={handlePlayPause}
      className="relative w-screen h-screen bg-black flex items-center justify-center overflow-hidden select-none"
      style={{ cursor: showControls ? 'default' : 'none' }}
    >
      {/* Cinematic Ambient Glow (Backlighting effect) */}
      <div className="absolute inset-0 z-0 bg-radial-at-c from-teal-500/10 via-transparent to-transparent opacity-60 pointer-events-none blur-3xl animate-pulse" />

      <video
        ref={videoRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={(e) => {
          e.stopPropagation();
          handlePlayPause();
        }}
        className="w-full h-full object-contain z-10"
      />

      {/* Center HUD Indicator Overlay */}
      <AnimatePresence>
        {hud.visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 0.9, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            className="absolute z-20 px-6 py-4 rounded-3xl bg-zinc-950/80 backdrop-blur-md border border-white/10 text-white flex flex-col items-center gap-2 pointer-events-none"
          >
            <span className="text-3xl">
              {hud.icon === 'play' && '▶️'}
              {hud.icon === 'pause' && '⏸️'}
              {hud.icon === 'volume' && '🔊'}
              {hud.icon === 'mute' && '🔇'}
              {hud.icon === 'forward' && '⏩'}
              {hud.icon === 'rewind' && '⏪'}
              {hud.icon === 'speed' && '🚀'}
              {hud.icon === 'pip' && '📺'}
            </span>
            <span className="text-xs font-black uppercase tracking-widest">{hud.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Bookmark/Resume Banner */}
      <AnimatePresence>
        {showBookmark && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 px-5 py-3 rounded-2xl bg-zinc-900/90 backdrop-blur-md border border-white/10 shadow-2xl flex items-center gap-4 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col">
              <span className="text-xs font-bold">Resume Playback?</span>
              <span className="text-[10px] text-zinc-400 mt-0.5">Saved position at {formatTime(bookmarkTime)}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleResume}
                className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg bg-teal-400 text-black hover:bg-teal-300 transition-colors"
              >
                Resume
              </button>
              <button
                onClick={handleRestart}
                className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
              >
                Restart
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar Overlay */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`absolute top-0 left-0 right-0 p-5 bg-gradient-to-b from-black/90 via-black/40 to-transparent flex items-center justify-between transition-all duration-300 z-30 ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-white truncate max-w-xl">
            {title}
          </span>
        </div>
      </div>

      {/* Bottom Controls Overlay */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/95 via-black/55 to-transparent flex flex-col gap-4 transition-all duration-300 z-30 ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {/* Timeline Progress Slider */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-zinc-400">{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 accent-teal-400 h-1.5 rounded-lg bg-zinc-700 cursor-pointer"
          />
          <span className="text-xs font-mono text-zinc-400">{formatTime(duration)}</span>
        </div>

        {/* Action Controls Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Play / Pause */}
            <button
              onClick={handlePlayPause}
              className="w-10 h-10 rounded-full bg-teal-400/10 border border-teal-400/20 text-teal-400 hover:bg-teal-400/20 transition-all flex items-center justify-center cursor-pointer"
            >
              {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2 text-zinc-400 hover:text-white">
              <button onClick={handleToggleMute} className="cursor-pointer">
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 accent-teal-400 h-1 rounded-lg bg-zinc-700 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Playback speed */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 font-semibold uppercase">Speed</span>
              <select
                value={speed}
                onChange={handleSpeedChange}
                className="bg-zinc-900 text-xs font-semibold text-zinc-300 rounded border border-zinc-700 py-0.5 px-1.5 focus:outline-none cursor-pointer"
              >
                <option value={0.5}>0.5x</option>
                <option value={0.75}>0.75x</option>
                <option value={1.0}>1.0x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={2.0}>2.0x</option>
              </select>
            </div>

            {/* Picture-in-Picture Button */}
            {pipSupported && (
              <button
                onClick={handleTogglePiP}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Picture in Picture"
              >
                <Tv size={18} />
              </button>
            )}

            {/* Fullscreen */}
            <button
              onClick={handleToggleFullscreen}
              className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
