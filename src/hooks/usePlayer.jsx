import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { ipc } from '../utils/ipc.js';
import { shuffle } from '../utils/formatters.js';
import { useSettings } from './useSettings.jsx';

const PlayerContext = createContext(null);

export const REPEAT_NONE  = 'none';
export const REPEAT_ONE   = 'one';
export const REPEAT_ALL   = 'all';

export function PlayerProvider({ children }) {
  const audioRef = useRef(null);
  const [currentMedia, setCurrentMedia]   = useState(null);
  const [queue,        setQueue]          = useState([]);
  const [queueIndex,   setQueueIndex]     = useState(-1);
  const [isPlaying,    setIsPlaying]      = useState(false);
  const [progress,     setProgress]       = useState(0);   // 0-1
  const [currentTime,  setCurrentTime]    = useState(0);
  const [duration,     setDuration]       = useState(0);
  const [volume,       setVolume]         = useState(80);
  const [isMuted,      setIsMuted]        = useState(false);
  const [speed,        setSpeed]          = useState(1.0);
  const [shuffle_,     setShuffle]        = useState(false);
  const [repeat,       setRepeat]         = useState(REPEAT_NONE);
  const [showNowPlaying, setShowNowPlaying] = useState(false);
  const [mpvMode,      setMpvMode]        = useState(false); // true = using MPV for playback

  const { settings, updateSetting } = useSettings();

  // Web Audio API refs for Dolby Atmos spatializer
  const audioCtxRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const bypassGainNodeRef = useRef(null);
  const analyserNodeRef = useRef(null);
  const atmosNodesRef = useRef(null);
  const masterPreAmpGainNodeRef = useRef(null);
  const compressorNodeRef = useRef(null);

  // Toggle Dolby Atmos wrapper
  const setDolbyAtmos = useCallback((enabled) => {
    updateSetting('dolbyAtmos', enabled);
  }, [updateSetting]);

  // Set Dolby Atmos mode wrapper
  const setAtmosMode = useCallback((mode) => {
    updateSetting('atmosMode', mode);
  }, [updateSetting]);

  // Dolby Atmos gain updater function
  const updateAtmosGains = useCallback((enabled, mode, channels, bypassGain, atmosOutput) => {
    if (!channels || !bypassGain || !atmosOutput || !audioCtxRef.current) return;
    const now = audioCtxRef.current.currentTime;

    if (!enabled) {
      bypassGain.gain.setTargetAtTime(1.0, now, 0.015);
      atmosOutput.gain.setTargetAtTime(0.0, now, 0.015);
      return;
    }

    bypassGain.gain.setTargetAtTime(0.0, now, 0.015);
    atmosOutput.gain.setTargetAtTime(1.0, now, 0.015);

    if (mode === 'music') {
      channels.fl.gain.gain.setTargetAtTime(0.75, now, 0.015);
      channels.fr.gain.gain.setTargetAtTime(0.75, now, 0.015);
      channels.c.gain.gain.setTargetAtTime(0.4, now, 0.015);
      channels.sl.gain.gain.setTargetAtTime(0.7, now, 0.015);
      channels.sr.gain.gain.setTargetAtTime(0.7, now, 0.015);
      channels.hl.gain.gain.setTargetAtTime(0.55, now, 0.015);
      channels.hr.gain.gain.setTargetAtTime(0.55, now, 0.015);
      channels.lfe.gain.gain.setTargetAtTime(0.8, now, 0.015);
    } else if (mode === 'movie') {
      channels.fl.gain.gain.setTargetAtTime(0.65, now, 0.015);
      channels.fr.gain.gain.setTargetAtTime(0.65, now, 0.015);
      channels.c.gain.gain.setTargetAtTime(0.9, now, 0.015);
      channels.sl.gain.gain.setTargetAtTime(0.8, now, 0.015);
      channels.sr.gain.gain.setTargetAtTime(0.8, now, 0.015);
      channels.hl.gain.gain.setTargetAtTime(0.6, now, 0.015);
      channels.hr.gain.gain.setTargetAtTime(0.6, now, 0.015);
      channels.lfe.gain.gain.setTargetAtTime(1.25, now, 0.015);
    } else if (mode === 'spatial') {
      channels.fl.gain.gain.setTargetAtTime(0.5, now, 0.015);
      channels.fr.gain.gain.setTargetAtTime(0.5, now, 0.015);
      channels.c.gain.gain.setTargetAtTime(0.2, now, 0.015);
      channels.sl.gain.gain.setTargetAtTime(0.95, now, 0.015);
      channels.sr.gain.gain.setTargetAtTime(0.95, now, 0.015);
      channels.hl.gain.gain.setTargetAtTime(0.85, now, 0.015);
      channels.hr.gain.gain.setTargetAtTime(0.85, now, 0.015);
      channels.lfe.gain.gain.setTargetAtTime(0.7, now, 0.015);
    }
  }, []);

  // Web Audio Graph builder
  const initAudioGraph = useCallback(() => {
    if (audioCtxRef.current) return;
    const audio = audioRef.current;
    if (!audio) return;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContextClass({ latencyHint: 'playback' });
      audioCtxRef.current = ctx;

      const source = ctx.createMediaElementSource(audio);
      sourceNodeRef.current = source;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserNodeRef.current = analyser;

      source.connect(analyser);

      const bypassGain = ctx.createGain();
      bypassGain.gain.value = settings.dolbyAtmos ? 0 : 1;
      bypassGainNodeRef.current = bypassGain;

      analyser.connect(bypassGain);

      const splitter = ctx.createChannelSplitter(2);
      analyser.connect(splitter);

      const atmosOutput = ctx.createGain();
      atmosOutput.gain.value = settings.dolbyAtmos ? 1 : 0;

      const createVirtualChannel = (delayTime, x, y, z, hpCutoff = 0, lpCutoff = 0) => {
        const gain = ctx.createGain();
        gain.gain.value = 0.5;

        const delay = ctx.createDelay(1.0);
        delay.delayTime.value = delayTime;

        let filter = null;
        if (hpCutoff > 0) {
          filter = ctx.createBiquadFilter();
          filter.type = 'highpass';
          filter.frequency.value = hpCutoff;
        } else if (lpCutoff > 0) {
          filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = lpCutoff;
        }

        const panner = ctx.createPanner();
        panner.panningModel = 'HRTF';
        panner.distanceModel = 'inverse';
        panner.setPosition(x, y, z);

        gain.connect(delay);
        if (filter) {
          delay.connect(filter);
          filter.connect(panner);
        } else {
          delay.connect(panner);
        }
        panner.connect(atmosOutput);

        return { gain, delay, filter, panner };
      };

      const channels = {
        fl:  createVirtualChannel(0.0, -1, 0, -1),
        fr:  createVirtualChannel(0.0, 1, 0, -1),
        c:   createVirtualChannel(0.002, 0, 0, -1.5),
        sl:  createVirtualChannel(0.018, -2, 0, 1),
        sr:  createVirtualChannel(0.018, 2, 0, 1),
        hl:  createVirtualChannel(0.010, -1, 1.5, -0.5, 1800),
        hr:  createVirtualChannel(0.010, 1, 1.5, -0.5, 1800),
        lfe: createVirtualChannel(0.005, 0, -0.5, -0.5, 0, 120),
      };

      splitter.connect(channels.fl.gain, 0);
      splitter.connect(channels.fr.gain, 1);
      splitter.connect(channels.c.gain, 0);
      splitter.connect(channels.c.gain, 1);
      splitter.connect(channels.sl.gain, 0);
      splitter.connect(channels.sr.gain, 1);
      splitter.connect(channels.hl.gain, 0);
      splitter.connect(channels.hr.gain, 1);
      splitter.connect(channels.lfe.gain, 0);
      splitter.connect(channels.lfe.gain, 1);

      // Create Master Volume Booster (Pre-Amp) and protection limiter (Compressor)
      const masterPreAmpGain = ctx.createGain();
      if (volume <= 100) {
        masterPreAmpGain.gain.value = 1.0;
      } else {
        masterPreAmpGain.gain.value = 1.0 + ((volume - 100) / 100) * 2.0;
      }
      masterPreAmpGainNodeRef.current = masterPreAmpGain;

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -16; // protect laptop speakers from clipping
      compressor.knee.value = 12;
      compressor.ratio.value = 8;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.08;
      compressorNodeRef.current = compressor;

      // Connect outputs to Master Pre-Amp
      bypassGain.connect(masterPreAmpGain);
      atmosOutput.connect(masterPreAmpGain);

      // Route through Compressor to protect laptop speakers and boost volume
      masterPreAmpGain.connect(compressor);
      compressor.connect(ctx.destination);

      atmosNodesRef.current = { splitter, atmosOutput, channels };

      updateAtmosGains(
        settings.dolbyAtmos,
        settings.atmosMode,
        channels,
        bypassGain,
        atmosOutput
      );
    } catch (e) {
      console.error('[AudioCtx] Failed to initialize audio graph:', e);
    }
  }, [settings.dolbyAtmos, settings.atmosMode, updateAtmosGains]);

  // Effect to update gains when settings change reactively
  useEffect(() => {
    if (audioCtxRef.current && atmosNodesRef.current) {
      updateAtmosGains(
        settings.dolbyAtmos,
        settings.atmosMode,
        atmosNodesRef.current.channels,
        bypassGainNodeRef.current,
        atmosNodesRef.current.atmosOutput
      );
    }
  }, [settings.dolbyAtmos, settings.atmosMode, updateAtmosGains]);

  // Create audio element
  useEffect(() => {
    const audio = document.createElement('video');
    audio.volume   = volume / 100;
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration || 0);
      setProgress(audio.duration ? audio.currentTime / audio.duration : 0);
    };
    const onEnded = () => handleEnded();
    const onPlay  = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onError = (e) => console.error('[Audio] Error:', e);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended',      onEnded);
    audio.addEventListener('play',       onPlay);
    audio.addEventListener('pause',      onPause);
    audio.addEventListener('error',      onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended',      onEnded);
      audio.removeEventListener('play',       onPlay);
      audio.removeEventListener('pause',      onPause);
      audio.removeEventListener('error',      onError);
      audio.pause();
    };
  }, []);

  const handleEnded = useCallback(() => {
    if (repeat === REPEAT_ONE) {
      audioRef.current?.play();
      return;
    }
    playNext();
  }, [repeat, queueIndex, queue]);

  // ─── Play a media item ────────────────────────────────────────────────────
  const playMedia = useCallback(async (media, queueList = null, startIndex = 0) => {
    if (!media) return;

    // If a queue is provided, update the queue
    if (queueList) {
      const q = shuffle_ ? shuffle(queueList) : queueList;
      const idx = shuffle_ ? q.findIndex(m => m.id === media.id) : queueList.indexOf(media);
      setQueue(q);
      setQueueIndex(idx >= 0 ? idx : startIndex);
    }

    setCurrentMedia(media);

    // For audio: use HTML5 Audio
    if (media.type === 'audio') {
      setMpvMode(false);
      const audio = audioRef.current;
      if (audio) {
        initAudioGraph();
        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }
        const src = media.filePath.replace(/\\/g, '/');
        audio.src = `file:///${src.startsWith('/') ? src.slice(1) : src}`;
        audio.volume = volume / 100;
        audio.playbackRate = speed;
        try { await audio.play(); } catch (e) { console.error('[Audio] Play error:', e); }
      }
    } else {
      // For video: play directly inside the app using HTML5 Video
      setMpvMode(false);
      setShowNowPlaying(true); // Automatically slide up the video screen!
      const audio = audioRef.current;
      if (audio) {
        initAudioGraph();
        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }
        const src = media.filePath.replace(/\\/g, '/');
        audio.src = `file:///${src.startsWith('/') ? src.slice(1) : src}`;
        audio.volume = volume / 100;
        audio.playbackRate = speed;
        try { await audio.play(); } catch (e) { console.error('[Video] Play error:', e); }
      }
    }

    // Add to history
    try {
      await ipc.history.add({
        mediaId:  media.id,
        filePath: media.filePath,
        title:    media.title,
        type:     media.type,
        duration: media.duration || 0,
        position: 0,
      });
    } catch (_) {}
  }, [volume, speed, shuffle_]);

  const playNext = useCallback(() => {
    if (!queue.length) return;
    let next = queueIndex + 1;
    if (next >= queue.length) {
      if (repeat === REPEAT_ALL) next = 0;
      else { setIsPlaying(false); return; }
    }
    setQueueIndex(next);
    playMedia(queue[next]);
  }, [queue, queueIndex, repeat, playMedia]);

  const playPrev = useCallback(() => {
    if (!queue.length) return;
    // If > 3 seconds in, restart current
    if (currentTime > 3) {
      audioRef.current && (audioRef.current.currentTime = 0);
      return;
    }
    let prev = queueIndex - 1;
    if (prev < 0) prev = repeat === REPEAT_ALL ? queue.length - 1 : 0;
    setQueueIndex(prev);
    playMedia(queue[prev]);
  }, [queue, queueIndex, currentTime, repeat, playMedia]);

  const togglePlay = useCallback(async () => {
    if (mpvMode) {
      await ipc.mpv.toggle();
    } else {
      const audio = audioRef.current;
      if (!audio) return;
      initAudioGraph();
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      if (audio.paused) { try { await audio.play(); } catch (_) {} }
      else audio.pause();
    }
  }, [mpvMode, initAudioGraph]);

  const stop = useCallback(async () => {
    if (mpvMode) await ipc.mpv.stop();
    const audio = audioRef.current;
    if (audio) { audio.pause(); audio.currentTime = 0; }
    setIsPlaying(false);
    setCurrentTime(0);
    setProgress(0);
  }, [mpvMode]);

  const seekTo = useCallback((frac) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    initAudioGraph();
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    audio.currentTime = frac * audio.duration;
  }, [initAudioGraph]);

  const seekSeconds = useCallback((secs) => {
    const audio = audioRef.current;
    if (!audio) return;
    initAudioGraph();
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + secs));
  }, [initAudioGraph]);

  const changeVolume = useCallback((vol) => {
    setVolume(vol);
    const audio = audioRef.current;
    if (audio) {
      if (vol <= 100) {
        audio.volume = vol / 100;
        if (masterPreAmpGainNodeRef.current && audioCtxRef.current) {
          masterPreAmpGainNodeRef.current.gain.setTargetAtTime(1.0, audioCtxRef.current.currentTime, 0.015);
        }
      } else {
        audio.volume = 1.0;
        if (masterPreAmpGainNodeRef.current && audioCtxRef.current) {
          // Linear boost up to 3.0x gain (+200% volume boost)
          const boost = 1.0 + ((vol - 100) / 100) * 2.0;
          masterPreAmpGainNodeRef.current.gain.setTargetAtTime(boost, audioCtxRef.current.currentTime, 0.015);
        }
      }
    }
    if (mpvMode) ipc.mpv.volume(vol);
  }, [mpvMode]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      if (audioRef.current) audioRef.current.muted = next;
      if (mpvMode) ipc.mpv.mute(next);
      return next;
    });
  }, [mpvMode]);

  const changeSpeed = useCallback((spd) => {
    setSpeed(spd);
    if (audioRef.current) audioRef.current.playbackRate = spd;
    if (mpvMode) ipc.mpv.speed(spd);
  }, [mpvMode]);

  const toggleShuffle = useCallback(() => {
    setShuffle(prev => {
      const next = !prev;
      if (next && queue.length) {
        const shuffled = shuffle([...queue]);
        setQueue(shuffled);
        setQueueIndex(shuffled.findIndex(m => m.id === currentMedia?.id));
      }
      return next;
    });
  }, [queue, currentMedia]);

  const cycleRepeat = useCallback(() => {
    setRepeat(prev => prev === REPEAT_NONE ? REPEAT_ALL : prev === REPEAT_ALL ? REPEAT_ONE : REPEAT_NONE);
  }, []);

  const addToQueue = useCallback((media) => {
    setQueue(prev => [...prev, media]);
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setQueueIndex(-1);
  }, []);

  return (
    <PlayerContext.Provider value={{
      currentMedia, queue, queueIndex,
      isPlaying, progress, currentTime, duration,
      volume, isMuted, speed, shuffle: shuffle_, repeat,
      showNowPlaying, setShowNowPlaying,
      mpvMode,
      audioRef,
      dolbyAtmos: settings.dolbyAtmos,
      atmosMode: settings.atmosMode,
      setDolbyAtmos,
      setAtmosMode,
      analyser: analyserNodeRef.current,
      initAudioGraph,
      playMedia, playNext, playPrev, togglePlay, stop,
      seekTo, seekSeconds, changeVolume, toggleMute, changeSpeed,
      toggleShuffle, cycleRepeat,
      addToQueue, clearQueue, setQueue, setQueueIndex,
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be inside PlayerProvider');
  return ctx;
}
