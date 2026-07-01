import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { ipc } from '../utils/ipc.js';
import { shuffle } from '../utils/formatters.js';
import { useSettings } from './useSettings.jsx';
import { useLibrary } from './useLibrary.jsx';

const PlayerContext = createContext(null);

export const REPEAT_NONE  = 'none';
export const REPEAT_ONE   = 'one';
export const REPEAT_ALL   = 'all';

export const BUILTIN_PRESETS = [
  { id: "flat", name: "Flat", description: "No equalization", gains: [0, 0, 0, 0, 0] },
  { id: "bass-booster", name: "Bass Booster", description: "Boost low frequencies", gains: [6, 4, 0, 0, -2] },
  { id: "vocal-booster", name: "Vocal Booster", description: "Boost midrange clarity", gains: [-2, 0, 4, 4, 2] },
  { id: "rock", name: "Rock", description: "Heavy bass and high treble", gains: [4, 2, -2, 2, 4] },
  { id: "electronic", name: "Electronic", description: "Vibrant bass and treble", gains: [4, 2, -1, 2, 4] },
  { id: "jazz", name: "Jazz", description: "Soft bass and warm highs", gains: [3, 2, 1, 2, 1] },
];

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
  const [sleepTimerEnd, setSleepTimerEnd]  = useState(null);  // timestamp when timer expires
  const sleepTimerRef = useRef(null);

  const [activePresetId, setActivePresetId] = useState('flat');
  const [customPresets, setCustomPresets] = useState([]);

  const activePresetIdRef = useRef('flat');
  const customPresetsRef = useRef([]);

  useEffect(() => {
    activePresetIdRef.current = activePresetId;
  }, [activePresetId]);

  useEffect(() => {
    customPresetsRef.current = customPresets;
  }, [customPresets]);

  // Load custom presets on mount
  useEffect(() => {
    (async () => {
      try {
        const all = await ipc.settings.getAll();
        if (all.activePresetId) {
          setActivePresetId(all.activePresetId);
        }
        if (all.customPresets) {
          setCustomPresets(JSON.parse(all.customPresets));
        }
      } catch (e) {
        console.error('Failed to load EQ presets:', e);
      }
    })();
  }, []);

  const { settings, updateSetting } = useSettings();
  const { addHistory, library } = useLibrary();

  const handleEndedRef = useRef(null);

  // Sync currentMedia with library updates (like favorite state)
  useEffect(() => {
    if (!currentMedia) return;
    const match = library.find(m => m.id === currentMedia.id);
    if (match && match.favorite !== currentMedia.favorite) {
      setCurrentMedia(match);
    }
  }, [library, currentMedia]);

  // Web Audio API refs for Dolby Atmos spatializer
  const audioCtxRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const bypassGainNodeRef = useRef(null);
  const analyserNodeRef = useRef(null);
  const atmosNodesRef = useRef(null);
  const masterPreAmpGainNodeRef = useRef(null);
  const compressorNodeRef = useRef(null);
  const eqFiltersRef = useRef([]);

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

      // Create 5-band Equalizer filters
      const eqFrequencies = [60, 230, 910, 4000, 14000];
      const eqFilters = eqFrequencies.map((freq, idx) => {
        const filter = ctx.createBiquadFilter();
        if (idx === 0) {
          filter.type = 'lowshelf';
        } else if (idx === eqFrequencies.length - 1) {
          filter.type = 'highshelf';
        } else {
          filter.type = 'peaking';
        }
        filter.frequency.value = freq;
        filter.Q.value = 1.0;
        filter.gain.value = 0; // Default flat
        return filter;
      });
      eqFiltersRef.current = eqFilters;

      // Connect Master Pre-Amp Gain to the first EQ filter
      masterPreAmpGain.connect(eqFilters[0]);

      // Connect EQ filters in series
      for (let i = 0; i < eqFilters.length - 1; i++) {
        eqFilters[i].connect(eqFilters[i + 1]);
      }

      // Connect the last EQ filter to the compressor
      eqFilters[eqFilters.length - 1].connect(compressor);

      // Route through Compressor to protect laptop speakers and boost volume
      compressor.connect(ctx.destination);

      // Apply active preset gains
      const pId = activePresetIdRef.current || 'flat';
      const allPresets = [...BUILTIN_PRESETS, ...customPresetsRef.current];
      const match = allPresets.find(p => p.id === pId) || allPresets[0];
      if (match) {
        eqFilters.forEach((filter, idx) => {
          filter.gain.value = match.gains[idx] !== undefined ? match.gains[idx] : 0;
        });
      }

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
    const onEnded = () => handleEndedRef.current && handleEndedRef.current();
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
        const fileUrl = `file:///${src.startsWith('/') ? src.slice(1) : src}`;
        audio.src = encodeURI(fileUrl);
        audio.volume = volume / 100;
        audio.playbackRate = speed;
        try { await audio.play(); } catch (e) { console.error('[Audio] Play error:', e); }
      }
    } else {
      // For video: open in a standalone HTML5 player window (built-in VLC style)
      // Stop the local audio playback so there is no audio overlap
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
      }
      setIsPlaying(false);
      
      // Open the custom video player window
      ipc.video.open(media.filePath);
    }

    // Add to history
    try {
      await addHistory({
        mediaId:  media.id,
        filePath: media.filePath,
        title:    media.title,
        type:     media.type,
        duration: media.duration || 0,
        position: 0,
      });
    } catch (_) {}
  }, [volume, speed, shuffle_, addHistory]);

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

  const handleEnded = useCallback(() => {
    if (repeat === REPEAT_ONE) {
      audioRef.current?.play();
      return;
    }
    playNext();
  }, [repeat, playNext]);

  handleEndedRef.current = handleEnded;

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

  // ─── Sleep Timer ──────────────────────────────────────────────────────────
  const setSleepTimer = useCallback((minutes) => {
    if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    if (!minutes || minutes <= 0) {
      setSleepTimerEnd(null);
      return;
    }
    const endTime = Date.now() + minutes * 60 * 1000;
    setSleepTimerEnd(endTime);
    sleepTimerRef.current = setTimeout(() => {
      // Auto-pause when timer expires
      const audio = audioRef.current;
      if (audio) audio.pause();
      setIsPlaying(false);
      setSleepTimerEnd(null);
    }, minutes * 60 * 1000);
  }, []);

  const clearSleepTimer = useCallback(() => {
    if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    setSleepTimerEnd(null);
  }, []);

  // Cleanup sleep timer on unmount
  useEffect(() => {
    return () => {
      if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    };
  }, []);

  const applyPresetGains = useCallback((gains) => {
    if (!eqFiltersRef.current || eqFiltersRef.current.length === 0) return;
    const now = audioCtxRef.current ? audioCtxRef.current.currentTime : 0;
    eqFiltersRef.current.forEach((filter, index) => {
      const gainVal = gains[index] !== undefined ? gains[index] : 0;
      if (audioCtxRef.current) {
        filter.gain.setTargetAtTime(gainVal, now, 0.015);
      } else {
        filter.gain.value = gainVal;
      }
    });
  }, []);

  const setEqPreset = useCallback(async (presetId) => {
    setActivePresetId(presetId);
    await ipc.settings.set('activePresetId', presetId);
    const allPresets = [...BUILTIN_PRESETS, ...customPresets];
    const match = allPresets.find(p => p.id === presetId);
    if (match) {
      applyPresetGains(match.gains);
    }
  }, [customPresets, applyPresetGains]);

  const importEqPreset = useCallback(async (presetData) => {
    const newPreset = {
      id: presetData.id || `eq-custom-${Date.now()}`,
      name: presetData.name || 'Imported Preset',
      description: presetData.description || 'User sound preset',
      gains: presetData.gains || [0, 0, 0, 0, 0]
    };
    const nextCustom = [...customPresets, newPreset];
    setCustomPresets(nextCustom);
    await ipc.settings.set('customPresets', JSON.stringify(nextCustom));
    setActivePresetId(newPreset.id);
    await ipc.settings.set('activePresetId', newPreset.id);
    applyPresetGains(newPreset.gains);
  }, [customPresets, applyPresetGains]);

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
      sleepTimerEnd, setSleepTimer, clearSleepTimer,
      activePresetId,
      presets: [...BUILTIN_PRESETS, ...customPresets],
      customPresets,
      setEqPreset,
      importEqPreset,
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
