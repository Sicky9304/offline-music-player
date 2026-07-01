import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, 
  ArrowLeft, Tv, RefreshCw, Camera, HelpCircle, X, ChevronRight 
} from 'lucide-react';
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

  // Cinema Advanced Features
  const [aspectRatio, setAspectRatio] = useState('contain'); // 'contain' (Fit), 'cover' (Fill), 'fill' (Stretch)
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [hud, setHud] = useState({ visible: false, text: '', type: 'info' }); // type: play, pause, volume, mute, seek, speed, pip, ratio, screenshot, settings
  const [bookmarkTime, setBookmarkTime] = useState(0);
  const [showBookmark, setShowBookmark] = useState(false);
  const [pipSupported, setPipSupported] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Time tooltip hover state
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverX, setHoverX] = useState(0);

  const searchStr = window.location.search || window.location.hash.split('?')[1] || '';
  const filePath = new URLSearchParams(searchStr).get('path') || '';
  const title = filePath ? filePath.split('\\').pop().split('/').pop() : 'Video Player';

  useEffect(() => {
    if (document.pictureInPictureEnabled) {
      setPipSupported(true);
    }

    const unsub = window.electron?.on('video:load', (newPath) => {
      if (videoRef.current) {
        setShowBookmark(false);
        const src = newPath.replace(/\\/g, '/');
        const fileUrl = `file:///${src.startsWith('/') ? src.slice(1) : src}`;
        videoRef.current.src = encodeURI(fileUrl);
        videoRef.current.play().catch(() => {});
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
      const fileUrl = `file:///${src.startsWith('/') ? src.slice(1) : src}`;
      videoRef.current.src = encodeURI(fileUrl);
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [filePath]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      
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
      const saved = localStorage.getItem(`bookmark:${filePath}`);
      if (saved) {
        const time = parseFloat(saved);
        if (time > 5 && time < videoRef.current.duration - 5) {
          setBookmarkTime(time);
          setShowBookmark(true);
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
      showHud('Resumed Position', 'play');
    }
    setShowBookmark(false);
  };

  const handleRestart = (e) => {
    e.stopPropagation();
    setShowBookmark(false);
    localStorage.removeItem(`bookmark:${filePath}`);
  };

  const showHud = (text, type) => {
    setHud({ visible: true, text, type });
    if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
    hudTimeoutRef.current = setTimeout(() => {
      setHud(prev => ({ ...prev, visible: false }));
    }, 800);
  };

  // Keyboard controls
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
          showHud('-5s Seek', 'seek');
          break;
        case 'arrowright':
          e.preventDefault();
          videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 5);
          showHud('+5s Seek', 'seek');
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
        case 'a':
          e.preventDefault();
          cycleAspectRatio();
          break;
        case 's':
          e.preventDefault();
          handleScreenshot();
          break;
        case 'b':
          e.preventDefault();
          cycleBrightness();
          break;
        case 'c':
          e.preventDefault();
          cycleContrast();
          break;
        case '?':
          e.preventDefault();
          setShowHelp(prev => !prev);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [volume, isMuted, isFullscreen, isPlaying, aspectRatio, brightness, contrast]);

  const clickTimeoutRef = useRef(null);

  const handleVideoClick = (e) => {
    e.stopPropagation();
    if (e.detail === 1) {
      clickTimeoutRef.current = setTimeout(() => {
        handlePlayPause();
      }, 250);
    } else if (e.detail === 2) {
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
      if (!videoRef.current) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const isLeft = clickX < rect.width * 0.4;
      
      if (isLeft) {
        videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
        showHud('-10s Seek', 'seek');
      } else {
        videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 10);
        showHud('+10s Seek', 'seek');
      }
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !showHelp) setShowControls(false);
    }, 2800);
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

  const handleProgressBarMouseMove = (e) => {
    const bar = e.currentTarget.getBoundingClientRect();
    const frac = (e.clientX - bar.left) / bar.width;
    const time = frac * duration;
    setHoverTime(Math.max(0, Math.min(duration, time)));
    setHoverX(e.clientX - bar.left);
  };

  const handleProgressBarMouseLeave = () => {
    setHoverTime(null);
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
        showHud('Exit Picture-in-Picture', 'pip');
      } else {
        await videoRef.current.requestPictureInPicture();
        showHud('Enter Picture-in-Picture', 'pip');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const cycleAspectRatio = () => {
    setAspectRatio(prev => {
      const next = prev === 'contain' ? 'cover' : prev === 'cover' ? 'fill' : 'contain';
      showHud(`Aspect Ratio: ${next === 'contain' ? 'Fit' : next === 'cover' ? 'Fill' : 'Stretch'}`, 'ratio');
      return next;
    });
  };

  const cycleBrightness = () => {
    setBrightness(prev => {
      const next = prev === 100 ? 120 : prev === 120 ? 80 : 100;
      showHud(`Brightness: ${next}%`, 'settings');
      return next;
    });
  };

  const cycleContrast = () => {
    setContrast(prev => {
      const next = prev === 100 ? 120 : prev === 120 ? 80 : 100;
      showHud(`Contrast: ${next}%`, 'settings');
      return next;
    });
  };

  const handleScreenshot = () => {
    if (!videoRef.current) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const item = new ClipboardItem({ 'image/png': blob });
        navigator.clipboard.write([item]).then(() => {
          showHud('Screenshot Copied', 'screenshot');
        }).catch(() => {
          const link = document.createElement('a');
          link.download = `snapshot_${Date.now()}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
          showHud('Screenshot Downloaded', 'screenshot');
        });
      });
    } catch {
      showHud('Screenshot Failed', 'settings');
    }
  };

  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleBackToPlayer = () => {
    navigate('/home');
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onClick={handleVideoClick}
      className="relative w-screen h-screen bg-black flex items-center justify-center overflow-hidden select-none"
      style={{ cursor: showControls ? 'default' : 'none' }}
    >
      {/* Backlighting glow */}
      <div className="absolute inset-0 z-0 bg-radial-at-c from-teal-500/5 via-transparent to-transparent opacity-40 pointer-events-none blur-3xl" />

      {/* Main video element with filters */}
      <video
        ref={videoRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={handleVideoClick}
        className="w-full h-full z-10 transition-all duration-300"
        style={{ 
          objectFit: aspectRatio,
          filter: `brightness(${brightness}%) contrast(${contrast}%)`
        }}
      />

      {/* Center HUD Notification Overlay */}
      <AnimatePresence>
        {hud.visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.9, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute z-20 px-6 py-4 rounded-3xl bg-zinc-950/85 border border-white/10 text-white flex flex-col items-center gap-2 pointer-events-none shadow-2xl backdrop-blur-md"
          >
            <span className="text-xl font-bold uppercase tracking-widest font-brand">{hud.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Bookmark/Resume Banner */}
      <AnimatePresence>
        {showBookmark && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 z-30 px-5 py-3.5 rounded-2xl glass-panel-premium border border-white/10 shadow-2xl flex items-center gap-4 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold font-brand">Resume play?</span>
              <span className="text-[10px] text-zinc-400 mt-0.5">Saved bookmark at {formatTime(bookmarkTime)}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleResume}
                className="text-[10px] font-black uppercase tracking-wider px-3.5 py-2 rounded-xl bg-teal-400 text-zinc-950 hover:bg-teal-300 transition-colors"
              >
                Resume
              </button>
              <button
                onClick={handleRestart}
                className="text-[10px] font-black uppercase tracking-wider px-3.5 py-2 rounded-xl bg-white/5 text-zinc-300 hover:bg-white/10 transition-colors border border-white/5"
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
        className={`absolute top-0 left-0 right-0 p-5 bg-gradient-to-b from-black/85 via-black/30 to-transparent flex items-center justify-between transition-all duration-300 z-30 ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
        }`}
      >
        <div className="flex items-center gap-3">
          <button 
            onClick={handleBackToPlayer}
            className="p-2 rounded-xl glass-button text-white hover:text-teal-400 active:scale-95"
            title="Back to Catalog"
          >
            <ArrowLeft size={16} />
          </button>
          <span className="text-xs font-bold text-white truncate max-w-xl font-brand tracking-wider">
            {title}
          </span>
        </div>
      </div>

      {/* Bottom Controls Overlay */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-4 transition-all duration-300 z-30 ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {/* Click-to-seek Progress Slider */}
        <div 
          className="flex items-center gap-3 relative"
          onMouseMove={handleProgressBarMouseMove}
          onMouseLeave={handleProgressBarMouseLeave}
        >
          <span className="text-[10px] font-semibold font-mono text-zinc-400">{formatTime(currentTime)}</span>
          <div className="relative flex-1 flex items-center group">
            {/* Custom hover tooltip */}
            {hoverTime !== null && (
              <div 
                className="absolute bottom-full mb-2 bg-zinc-950 border border-white/15 px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold text-white pointer-events-none transform -translate-x-1/2"
                style={{ left: `${hoverX}px` }}
              >
                {formatTime(hoverTime)}
              </div>
            )}
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="video-progress-bar flex-1"
            />
          </div>
          <span className="text-[10px] font-semibold font-mono text-zinc-400">{formatTime(duration)}</span>
        </div>

        {/* Control bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            {/* Play/Pause */}
            <button
              onClick={handlePlayPause}
              className="w-10 h-10 rounded-full bg-teal-400/10 border border-teal-400/20 text-teal-400 hover:bg-teal-400/25 transition-all flex items-center justify-center cursor-pointer active:scale-95"
            >
              {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
            </button>

            {/* Mute & Volume */}
            <div className="flex items-center gap-2 text-zinc-400 hover:text-white">
              <button onClick={handleToggleMute} className="cursor-pointer active:scale-95">
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 accent-teal-400 h-1 rounded-lg bg-zinc-800 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center gap-5">
            {/* Playback speed selector */}
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Speed</span>
              <select
                value={speed}
                onChange={handleSpeedChange}
                className="bg-zinc-950/80 text-[10px] font-semibold text-zinc-300 rounded-lg border border-white/5 py-1 px-2 focus:outline-none cursor-pointer hover:border-white/10"
              >
                <option value={0.5}>0.5x</option>
                <option value={0.75}>0.75x</option>
                <option value={1.0}>1.0x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={2.0}>2.0x</option>
              </select>
            </div>

            {/* Aspect Ratio Cycling */}
            <button 
              onClick={cycleAspectRatio}
              className="text-zinc-400 hover:text-white transition-colors active:scale-95"
              title="Aspect Ratio"
            >
              <RefreshCw size={16} />
            </button>

            {/* Take Screenshot */}
            <button 
              onClick={handleScreenshot}
              className="text-zinc-400 hover:text-white transition-colors active:scale-95"
              title="Screenshot"
            >
              <Camera size={16} />
            </button>

            {/* Pip */}
            {pipSupported && (
              <button
                onClick={handleTogglePiP}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer active:scale-95"
                title="Picture in Picture"
              >
                <Tv size={16} />
              </button>
            )}

            {/* Help guidelines */}
            <button 
              onClick={() => setShowHelp(true)}
              className="text-zinc-400 hover:text-white transition-colors active:scale-95"
              title="Shortcut guidelines"
            >
              <HelpCircle size={16} />
            </button>

            {/* Fullscreen */}
            <button
              onClick={handleToggleFullscreen}
              className="text-zinc-400 hover:text-white transition-colors cursor-pointer active:scale-95"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Keyboard shortcuts modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowHelp(false)} />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm rounded-3xl border border-white/10 p-6 glass-panel-premium z-10 text-white"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                <span className="text-xs font-black uppercase tracking-wider text-teal-400 font-brand">Shortcuts Guide</span>
                <button onClick={() => setShowHelp(false)} className="p-1 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-2 text-xs text-zinc-300 font-medium">
                <div className="flex justify-between py-1 border-b border-white/5"><span>Space</span> <span>Play / Pause</span></div>
                <div className="flex justify-between py-1 border-b border-white/5"><span>Arrow Left/Right</span> <span>Seek ±5s</span></div>
                <div className="flex justify-between py-1 border-b border-white/5"><span>Arrow Up/Down</span> <span>Volume ±5%</span></div>
                <div className="flex justify-between py-1 border-b border-white/5"><span>F</span> <span>Toggle Fullscreen</span></div>
                <div className="flex justify-between py-1 border-b border-white/5"><span>M</span> <span>Mute / Unmute</span></div>
                <div className="flex justify-between py-1 border-b border-white/5"><span>A</span> <span>Cycle Aspect Ratio</span></div>
                <div className="flex justify-between py-1 border-b border-white/5"><span>S</span> <span>Capture Screenshot</span></div>
                <div className="flex justify-between py-1 border-b border-white/5"><span>B / C</span> <span>Cycle Brightness / Contrast</span></div>
                <div className="flex justify-between py-1"><span>?</span> <span>Toggle Guide</span></div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
