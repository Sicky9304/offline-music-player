import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronDown, Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, Shuffle, Repeat, Repeat1, Heart,
  ListMusic, FastForward, Rewind, Zap,
} from 'lucide-react';
import { usePlayer, REPEAT_NONE, REPEAT_ONE, REPEAT_ALL } from '../hooks/usePlayer.jsx';
import { useLibrary } from '../hooks/useLibrary.jsx';
import { formatDuration, truncate } from '../utils/formatters.js';
import EqualizerBars from './EqualizerBars.jsx';
import MediaCard from './MediaCard.jsx';
import ThreeDArtwork from './ThreeDArtwork.jsx';

const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

export default function NowPlaying() {
  const {
    currentMedia, isPlaying, progress, currentTime, duration,
    volume, isMuted, shuffle: isShuffle, repeat, speed,
    queue, queueIndex,
    togglePlay, playNext, playPrev, seekTo, seekSeconds,
    changeVolume, toggleMute, changeSpeed, toggleShuffle, cycleRepeat,
    showNowPlaying, setShowNowPlaying,
    audioRef,
    // Dolby Atmos fields
    dolbyAtmos, setDolbyAtmos,
    atmosMode, setAtmosMode,
    analyser, initAudioGraph,
  } = usePlayer();

  const { toggleFavorite } = useLibrary();
  const [showQueue, setShowQueue] = useState(false);
  const [showSpeed, setShowSpeed] = useState(false);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  const RepeatIcon = repeat === REPEAT_ONE ? Repeat1 : Repeat;

  const [dominantColor, setDominantColor] = useState('124, 58, 237'); // Default purple
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);

  const handleContainerMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    const angleX = (yc - y) / 10;
    const angleY = (x - xc) / 10;
    setTiltX(angleX);
    setTiltY(angleY);
  };

  const handleContainerMouseLeave = () => {
    setTiltX(0);
    setTiltY(0);
  };

  // Extract dominant color from track thumbnail
  useEffect(() => {
    if (!currentMedia?.thumbnail) {
      setDominantColor('124, 58, 237');
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
      } catch (err) {
        setDominantColor('124, 58, 237');
      }
    };
    img.onerror = () => {
      setDominantColor('124, 58, 237');
    };
  }, [currentMedia?.thumbnail]);

  // Analyser and canvas animation loop
  useEffect(() => {
    if (!showNowPlaying || !audioRef?.current) return;

    // Make sure graph is initialized
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

    // Particle pool for reactive visualizer
    const particles = [];
    const maxParticles = 60;
    for (let i = 0; i < maxParticles; i++) {
      particles.push({
        x: (Math.random() - 0.5) * 0.2,
        y: (Math.random() - 0.5) * 0.2,
        speed: 0.8 + Math.random() * 1.8,
        size: 1 + Math.random() * 2.2,
      });
    }

    let bufferLength = analyser ? analyser.frequencyBinCount : 128;
    let dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      // Dark futuristic background trail
      ctx.fillStyle = 'rgba(9, 9, 11, 0.22)';
      ctx.fillRect(0, 0, w, h);

      let averageFreq = 0;
      let bass = 0;
      let mids = 0;
      let treble = 0;

      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(dataArray);
        
        let bassSum = 0;
        for (let i = 0; i < 16; i++) bassSum += dataArray[i];
        bass = bassSum / 16;

        let midsSum = 0;
        for (let i = 16; i < 64; i++) midsSum += dataArray[i];
        mids = midsSum / 48;

        let trebleSum = 0;
        for (let i = 64; i < 128; i++) trebleSum += dataArray[i];
        treble = trebleSum / 64;

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        averageFreq = sum / bufferLength;
      } else {
        // Fallback animation: math-based holographic loops
        const time = Date.now() * 0.0015;
        bass = (Math.sin(time) * 0.5 + 0.5) * 35 + 10;
        mids = (Math.cos(time * 1.2) * 0.5 + 0.5) * 25 + 5;
        treble = (Math.sin(time * 1.8) * 0.5 + 0.5) * 15 + 2;

        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = (Math.sin(i * 0.12 - time * 2) * 15 + 22) * (isPlaying ? 1.2 : 0.35);
        }
        averageFreq = (bass + mids + treble) / 3;
      }

      // 1. Ambient Glow Backing (reacts to bass and dominant color)
      const glowRadius = 140 + (bass * 1.3);
      const glowGrad = ctx.createRadialGradient(cx, cy, 40, cx, cy, glowRadius);
      const baseIntensity = isPlaying ? 0.32 + (bass / 255) * 0.38 : 0.12;
      glowGrad.addColorStop(0, `rgba(${dominantColor}, ${baseIntensity})`);
      glowGrad.addColorStop(0.5, `rgba(${dominantColor}, ${baseIntensity * 0.25})`);
      glowGrad.addColorStop(1, 'rgba(9, 9, 11, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, w, h);

      // 2. 3D Morphing Hologram Orb (math loop)
      const orbitTime = Date.now() * 0.001;
      ctx.lineWidth = 1.0;
      ctx.strokeStyle = `rgba(${dominantColor}, ${isPlaying ? 0.09 + (mids / 255) * 0.08 : 0.05})`;
      
      for (let j = 0; j < 3; j++) {
        ctx.beginPath();
        const phaseOffset = j * (Math.PI / 3);
        for (let i = 0; i <= 180; i++) {
          const angle = (i / 180) * Math.PI * 2;
          const morph = Math.sin(angle * 5 + orbitTime * 1.5 + phaseOffset) * 14 * (isPlaying ? 1.0 : 0.4)
                      + Math.cos(angle * 3 - orbitTime + phaseOffset) * 8;
          const r = 120 + morph;
          const x = cx + Math.cos(angle + orbitTime * 0.15) * r;
          const y = cy + Math.sin(angle + orbitTime * 0.15) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      }

      // 3. Holographic Reactive Circles
      const baseRadius = 135 + (bass * 0.28);
      
      ctx.lineWidth = 2.0;
      ctx.shadowBlur = 15;
      ctx.shadowColor = `rgba(${dominantColor}, 0.75)`;
      ctx.strokeStyle = `rgba(${dominantColor}, ${0.15 + (mids / 255) * 0.4})`;

      ctx.beginPath();
      for (let i = 0; i < bufferLength; i++) {
        const angle = (i / bufferLength) * Math.PI * 2;
        const val = dataArray[i] * 0.42;
        const r = baseRadius + val;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();

      // Outer wave circle (complementary / counter-rotating)
      ctx.strokeStyle = `rgba(236, 72, 153, ${0.08 + (treble / 255) * 0.3})`;
      ctx.shadowColor = 'rgba(236, 72, 153, 0.5)';
      ctx.beginPath();
      for (let i = 0; i < bufferLength; i++) {
        const angle = (i / bufferLength) * Math.PI * 2;
        const val = dataArray[bufferLength - 1 - i] * 0.28;
        const r = baseRadius + 22 + val;
        const x = cx - Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();

      ctx.shadowBlur = 0; // Disable shadow for particles performance

      // 4. Floating Hologram Particles
      particles.forEach((p) => {
        const speedMultiplier = isPlaying ? 1 + (bass / 35) : 0.35;
        p.x += Math.cos(Math.atan2(p.y, p.x)) * p.speed * speedMultiplier * 0.0035;
        p.y += Math.sin(Math.atan2(p.y, p.x)) * p.speed * speedMultiplier * 0.0035;

        const dist = Math.sqrt(p.x * p.x + p.y * p.y);
        if (dist > 0.55 || dist < 0.01) {
          const angle = Math.random() * Math.PI * 2;
          p.x = Math.cos(angle) * 0.08;
          p.y = Math.sin(angle) * 0.08;
          p.size = 1 + Math.random() * 2.2;
        }

        const px = cx + p.x * (baseRadius + bass * 0.1) * 2;
        const py = cy + p.y * (baseRadius + bass * 0.1) * 2;

        ctx.fillStyle = `rgba(${dominantColor}, ${0.15 + (mids / 255) * 0.4})`;
        ctx.beginPath();
        const sizeScale = p.size * (1 + (treble / 120));
        ctx.arc(px, py, sizeScale, 0, Math.PI * 2);
        ctx.fill();
      });

      // 5. Dolby Atmos Speaker Radar HUD (Heads-Up Display)
      if (dolbyAtmos) {
        ctx.save();
        ctx.shadowBlur = 10;
        
        const speakers = [
          { label: 'FL', x: cx - 220, y: cy - 140, type: 'front', val: (dataArray[20] || 0) },
          { label: 'FR', x: cx + 220, y: cy - 140, type: 'front', val: (dataArray[25] || 0) },
          { label: 'C',  x: cx,       y: cy - 230, type: 'center', val: mids * 1.5 },
          { label: 'SL', x: cx - 260, y: cy + 140, type: 'surround', val: (dataArray[40] || 0) },
          { label: 'SR', x: cx + 260, y: cy + 140, type: 'surround', val: (dataArray[45] || 0) },
          { label: 'HL', x: cx - 140, y: cy - 60,  type: 'height', val: treble * 1.8 },
          { label: 'HR', x: cx + 140, y: cy - 60,  type: 'height', val: treble * 1.8 },
          { label: 'LFE',x: cx,       y: cy + 230, type: 'sub', val: bass * 1.8 },
        ];

        // Draw boundary rings
        ctx.strokeStyle = `rgba(${dominantColor}, 0.08)`;
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 10]);
        // Outer surround ring
        ctx.beginPath();
        ctx.arc(cx, cy, 270, 0, Math.PI * 2);
        ctx.stroke();
        // Inner height ring
        ctx.beginPath();
        ctx.arc(cx, cy, 150, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]); // Reset dash

        // Draw HUD lines connecting speakers to center
        speakers.forEach(s => {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${dominantColor}, ${0.03 + (s.val / 255) * 0.06})`;
          ctx.moveTo(cx, cy);
          ctx.lineTo(s.x, s.y);
          ctx.stroke();
        });

        // Draw each speaker node
        speakers.forEach(s => {
          const pulse = (s.val / 255) * 18;
          ctx.shadowColor = s.type === 'sub' ? 'rgba(244, 63, 94, 0.8)' : `rgba(${dominantColor}, 0.8)`;
          
          // Outer pulsing ring
          ctx.strokeStyle = s.type === 'sub' 
            ? `rgba(244, 63, 94, ${0.1 + (s.val / 255) * 0.5})` 
            : `rgba(${dominantColor}, ${0.15 + (s.val / 255) * 0.65})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(s.x, s.y, 8 + pulse, 0, Math.PI * 2);
          ctx.stroke();

          // Speaker core dot
          ctx.fillStyle = s.type === 'sub' 
            ? `rgba(244, 63, 94, ${0.6 + (s.val / 255) * 0.4})` 
            : `rgba(${dominantColor}, ${0.7 + (s.val / 255) * 0.3})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, 4, 0, Math.PI * 2);
          ctx.fill();

          // Speaker text label
          ctx.fillStyle = `rgba(255, 255, 255, ${0.45 + (s.val / 255) * 0.45})`;
          ctx.font = 'bold 9px font-mono, monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(s.label, s.x, s.y - 14);
        });

        ctx.restore();
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [showNowPlaying, isPlaying, audioRef, dominantColor, dolbyAtmos, analyser, atmosMode]);

  if (!currentMedia) return null;

  const handleSeek = (e) => {
    const bar  = e.currentTarget.getBoundingClientRect();
    const frac = (e.clientX - bar.left) / bar.width;
    seekTo(Math.max(0, Math.min(1, frac)));
  };

  return (
    <AnimatePresence>
      {showNowPlaying && (
        <motion.div
          className="fixed inset-0 z-50 flex overflow-hidden hologram-grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ background: 'var(--bg-primary)' }}
        >
          {/* Real-time background visualizer canvas */}
          <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none w-full h-full" />

          {/* Background art blur overlay */}
          {currentMedia.thumbnail && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
              <img src={currentMedia.thumbnail} alt="" className="w-full h-full object-cover scale-110 blur-3xl opacity-15" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, var(--bg-primary)aa, var(--bg-primary))' }} />
            </div>
          )}

          {/* Main content */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-between py-12 px-8 gap-6">

            {/* Top header bar */}
            <div className="w-full flex items-center justify-between max-w-4xl">
              <button
                id="nowplaying-close"
                onClick={() => setShowNowPlaying(false)}
                className="p-2 rounded-xl glass hover:bg-white/10 transition-colors flex items-center justify-center"
                style={{ color: 'var(--text-muted)' }}
              >
                <ChevronDown size={22} />
              </button>
              <div className="text-center">
                <span className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--text-muted)' }}>Now Playing</span>
              </div>
              <div className="w-10 h-10" /> {/* Spacer */}
            </div>

            {/* 3D Vinyl Player Component */}
            <div 
              onMouseMove={handleContainerMouseMove}
              onMouseLeave={handleContainerMouseLeave}
              className="relative flex items-center justify-center h-72 w-[460px] perspective-1000 preserve-3d my-4 cursor-pointer"
            >
              {/* Glassmorphic album sleeve (jacket) */}
              <motion.div
                initial={{ x: 0, rotateY: -10 }}
                animate={{ 
                  x: isPlaying ? -75 : 0, 
                  rotateY: isPlaying ? -14 + tiltY : -7 + tiltY,
                  rotateX: tiltX
                }}
                transition={{ type: 'spring', stiffness: 120, damping: 15 }}
                className="absolute z-10 w-60 h-60 rounded-2xl overflow-hidden glass shadow-2xl flex-shrink-0 preserve-3d"
                style={{ 
                  boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 35px rgba(${dominantColor}, 0.22)`,
                  transformStyle: 'preserve-3d'
                }}
              >
                {currentMedia.thumbnail ? (
                  <img src={currentMedia.thumbnail} alt="" className="w-full h-full object-cover" />
                ) : currentMedia.type === 'audio' ? (
                  <ThreeDArtwork title={currentMedia.title} id={currentMedia.id} />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-zinc-900/95">
                    <span className="text-6xl">🎬</span>
                  </div>
                )}
                {/* Reflection flare overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 pointer-events-none" />
              </motion.div>

              {/* Black Vinyl disc */}
              <motion.div
                initial={{ x: 0 }}
                animate={{ x: isPlaying ? 75 : 20 }}
                transition={{ type: 'spring', stiffness: 120, damping: 15 }}
                className="absolute w-56 h-56 rounded-full vinyl-grooves flex items-center justify-center shadow-2xl z-0"
              >
                <div className={`absolute inset-0 rounded-full vinyl-reflection animate-rotate-vinyl ${isPlaying ? '' : 'animation-paused'}`} />
                <div className={`absolute inset-0 rounded-full vinyl-reflection-holographic animate-rotate-vinyl ${isPlaying ? '' : 'animation-paused'}`} />
                
                {/* Center hole and mini artwork label */}
                <div className="w-20 h-20 rounded-full bg-zinc-900 border-4 border-zinc-800 flex items-center justify-center overflow-hidden relative">
                  {currentMedia.thumbnail ? (
                    <img src={currentMedia.thumbnail} alt="" className={`w-full h-full object-cover rounded-full animate-rotate-vinyl ${isPlaying ? '' : 'animation-paused'}`} />
                  ) : currentMedia.type === 'audio' ? (
                    <div className={`w-full h-full animate-rotate-vinyl ${isPlaying ? '' : 'animation-paused'}`}>
                      <ThreeDArtwork title={currentMedia.title} id={currentMedia.id} isCompact />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-zinc-950 flex items-center justify-center text-lg">🎬</div>
                  )}
                  {/* Vinyl spindle hole */}
                  <div className="absolute w-3.5 h-3.5 rounded-full bg-black shadow-inner" />
                </div>
              </motion.div>
            </div>

            {/* Bottom Section: Info + Seek + Controls */}
            <div className="w-full max-w-md flex flex-col items-center gap-6 glass-panel p-6 rounded-3xl glow-border">
              {/* Track info */}
              <div className="text-center w-full">
                <motion.h1
                  key={currentMedia.id}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-2xl font-bold truncate tracking-tight"
                  style={{ color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}
                >
                  {currentMedia.title}
                </motion.h1>
                <p className="text-sm mt-1 truncate" style={{ color: 'var(--text-secondary)' }}>
                  {currentMedia.artist}
                </p>
                {currentMedia.album && (
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                    {currentMedia.album}
                  </p>
                )}
              </div>

              {/* Progress bar */}
              <div className="w-full">
                <div className="h-1.5 rounded-full cursor-pointer group relative" style={{ background: 'var(--bg-tertiary)' }} onClick={handleSeek}>
                  <div className="h-full rounded-full relative transition-all" style={{ width: `${progress * 100}%`, background: `rgb(${dominantColor})` }}>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div className="flex justify-between mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span>{formatDuration(currentTime)}</span>
                  <span>{formatDuration(duration)}</span>
                </div>
              </div>

              {/* Main Controls row */}
              <div className="flex items-center justify-between w-full px-4">
                <button id="np-shuffle" onClick={toggleShuffle} style={{ color: isShuffle ? `rgb(${dominantColor})` : 'var(--text-muted)' }}>
                  <Shuffle size={18} />
                </button>
                
                <div className="flex items-center gap-4">
                  <button id="np-prev" onClick={playPrev} className="p-2 rounded-full hover:bg-white/5 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                    <SkipBack size={24} fill="currentColor" />
                  </button>
                  <button id="np-back10" onClick={() => seekSeconds(-10)} className="p-2 rounded-full hover:bg-white/5 transition-colors" style={{ color: 'var(--text-muted)' }}>
                    <Rewind size={18} />
                  </button>
                  
                  <motion.button
                    id="np-play"
                    onClick={togglePlay}
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl pulse-neon-glow"
                    style={{ background: `rgb(${dominantColor})`, boxShadow: `0 0 25px rgba(${dominantColor}, 0.5)` }}
                  >
                    {isPlaying
                      ? <Pause size={24} fill="white" className="text-white" />
                      : <Play  size={24} fill="white" className="text-white ml-0.5" />
                    }
                  </motion.button>
                  
                  <button id="np-fwd10" onClick={() => seekSeconds(10)} className="p-2 rounded-full hover:bg-white/5 transition-colors" style={{ color: 'var(--text-muted)' }}>
                    <FastForward size={18} />
                  </button>
                  <button id="np-next" onClick={playNext} className="p-2 rounded-full hover:bg-white/5 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                    <SkipForward size={24} fill="currentColor" />
                  </button>
                </div>

                <button id="np-repeat" onClick={cycleRepeat} style={{ color: repeat !== REPEAT_NONE ? `rgb(${dominantColor})` : 'var(--text-muted)' }}>
                  <RepeatIcon size={18} />
                </button>
              </div>

              {/* Dolby Atmos spatial audio panel */}
              <div className="w-full pt-4 border-t flex flex-col gap-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      {dolbyAtmos && (
                        <div className="absolute inset-0 rounded-full blur bg-gradient-to-r from-violet-600 to-fuchsia-600 opacity-50 animate-pulse" />
                      )}
                      <button
                        id="np-atmos-toggle"
                        onClick={() => setDolbyAtmos(!dolbyAtmos)}
                        className={`relative px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${
                          dolbyAtmos
                            ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white border-transparent shadow-[0_0_15px_rgba(139,92,246,0.5)]'
                            : 'bg-zinc-800/80 text-zinc-400 border-zinc-700/50 hover:bg-zinc-700/80'
                        }`}
                      >
                        Dolby Atmos
                      </button>
                    </div>
                    <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono transition-colors font-bold ${
                      dolbyAtmos 
                        ? 'bg-violet-500/10 text-violet-300 border border-violet-500/20' 
                        : 'bg-zinc-800/30 text-zinc-500 border border-zinc-800'
                    }`}>
                      {dolbyAtmos ? `3D ${atmosMode} Active` : 'Stereo Bypass'}
                    </span>
                  </div>

                  {/* Mode Selector */}
                  <AnimatePresence>
                    {dolbyAtmos && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center gap-1 bg-zinc-950/60 p-0.5 rounded-lg border border-white/5"
                      >
                        {['music', 'movie', 'spatial'].map((mode) => (
                          <button
                            key={mode}
                            onClick={() => setAtmosMode(mode)}
                            className={`px-2.5 py-0.5 rounded-md text-[9px] uppercase tracking-wider font-extrabold transition-all ${
                              atmosMode === mode
                                ? 'bg-zinc-800 text-white shadow-md border border-white/10'
                                : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                          >
                            {mode === 'spatial' ? '3D Space' : mode}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Speed & Volume & Fav / Queue row */}
              <div className="flex items-center justify-between w-full pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                {/* Volume */}
                <div className="flex items-center gap-2">
                  <button id="np-mute" onClick={toggleMute} style={{ color: 'var(--text-muted)' }}>
                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                  <input
                    type="range" min="0" max="200" value={isMuted ? 0 : volume}
                    onChange={e => changeVolume(Number(e.target.value))}
                    className="w-20 accent-[var(--accent)] cursor-pointer h-1"
                    id="np-volume"
                  />
                  <span className={`text-[10px] font-mono w-10 text-right font-bold transition-colors ${volume > 100 ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'text-zinc-400'}`}>
                    {volume > 100 ? `+${volume - 100}%` : `${volume}%`}
                  </span>
                </div>

                {/* Speed indicator */}
                <div className="relative">
                  <button
                    id="np-speed"
                    onClick={() => setShowSpeed(!showSpeed)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono glass hover:bg-white/10 transition-colors"
                    style={{ color: speed !== 1 ? `rgb(${dominantColor})` : 'var(--text-muted)' }}
                  >
                    <Zap size={11} />
                    {speed}x
                  </button>
                  <AnimatePresence>
                    {showSpeed && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 rounded-xl border shadow-2xl p-1.5 flex flex-col gap-0.5 z-50 glass"
                        style={{ borderColor: 'var(--border)' }}
                      >
                        {SPEED_OPTIONS.map(s => (
                          <button
                            key={s}
                            onClick={() => { changeSpeed(s); setShowSpeed(false); }}
                            className={`px-3 py-1 rounded-lg text-[10px] font-mono hover:bg-white/10 transition-colors ${speed === s ? 'font-bold' : ''}`}
                            style={{ color: speed === s ? `rgb(${dominantColor})` : 'var(--text-secondary)' }}
                          >
                            {s}x
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Favorite & Queue */}
                <div className="flex items-center gap-3">
                  <button id="np-fav" onClick={() => toggleFavorite(currentMedia.id)} className="p-1">
                    <Heart size={18} fill={currentMedia.favorite ? 'currentColor' : 'none'}
                      className={currentMedia.favorite ? 'text-rose-400 animate-pulse' : ''} style={{ color: currentMedia.favorite ? '' : 'var(--text-muted)' }} />
                  </button>
                  <button id="np-queue" onClick={() => setShowQueue(!showQueue)} style={{ color: showQueue ? `rgb(${dominantColor})` : 'var(--text-muted)' }} className="p-1">
                    <ListMusic size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Queue panel */}
          <AnimatePresence>
            {showQueue && (
              <motion.div
                initial={{ x: 320 }}
                animate={{ x: 0 }}
                exit={{ x: 320 }}
                className="w-80 h-full border-l flex flex-col z-20 glass-panel"
                style={{ borderColor: 'rgba(255,255,255,0.08)' }}
              >
                <div className="flex items-center justify-between px-4 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Queue</h2>
                  <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>{queue.length} tracks</span>
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
