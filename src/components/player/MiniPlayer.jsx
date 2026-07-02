// MiniPlayer.jsx (Refactored Layout)
// NOTE:
// This version is intended to work with the reusable components:
// - ProgressBar.jsx
// - PlaybackControls.jsx
// - VolumeControl.jsx
//
// Imports may need minor adjustment depending on your folder structure.

import { motion } from "framer-motion";
import { ChevronUp, Heart, Sliders, AlignLeft } from "lucide-react";
import { useEffect, useState } from "react";

import { usePlayer, REPEAT_NONE } from "../../hooks/usePlayer.jsx";
import { useLibrary } from "../../hooks/useLibrary.jsx";
import { truncate } from "../../utils/formatters.js";

import EqualizerBars from "./EqualizerBars.jsx";
import ThreeDArtwork from "./ThreeDArtwork.jsx";

import ProgressBar from "./ProgressBar.jsx";
import PlaybackControls from "./PlaybackControls.jsx";
import VolumeControl from "./VolumeControl.jsx";
import LyricsPanel from "./LyricsPanel.jsx";

export default function MiniPlayer() {

  const {
    currentMedia,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    shuffle,
    repeat,
    togglePlay,
    playNext,
    playPrev,
    seekTo,
    changeVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    setShowNowPlaying,
    activePresetId,
    presets,
    setEqPreset
  } = usePlayer();

  const { toggleFavorite } = useLibrary();

  const [imgError, setImgError] = useState(false);
  const [showEqPopover, setShowEqPopover] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [currentMedia?.id]);

  if (!currentMedia) return null;

  return (

    <motion.div
      initial={{ y: 80 }}
      animate={{ y: 0 }}
      className="border-t border-white/10 bg-[rgba(18,18,28,.92)] backdrop-blur-3xl"
    >

      <ProgressBar
        currentTime={currentTime}
        duration={duration}
        onSeek={(value) => seekTo(value / duration)}
      />

      <div className="grid grid-cols-[320px_1fr_320px] items-center gap-6 px-6 py-4">

        {/* LEFT */}

        <motion.div
          whileHover={{ scale: 1.02 }}
          onClick={() => setShowNowPlaying(true)}
          className="flex cursor-pointer items-center gap-4 min-w-0"
        >

          <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-white/10">

            {currentMedia.thumbnail && !imgError ? (

              <img
                src={currentMedia.thumbnail}
                alt=""
                onError={() => setImgError(true)}
                className="h-full w-full object-cover"
              />

            ) : currentMedia.type === "audio" ? (

              <ThreeDArtwork
                id={currentMedia.id}
                title={currentMedia.title}
                isCompact
              />

            ) : (

              <div className="flex h-full w-full items-center justify-center text-2xl">
                🎬
              </div>

            )}

            {isPlaying && (

              <div className="absolute inset-0 flex items-center justify-center bg-black/40">

                <EqualizerBars
                  isPlaying={true}
                  bars={4}
                />

              </div>

            )}

          </div>

          <div className="min-w-0">

            <h3 className="truncate font-bold text-white">

              {truncate(currentMedia.title, 32)}

            </h3>

            <p className="truncate text-sm text-zinc-400">

              {truncate(currentMedia.artist || "Unknown Artist", 28)}

            </p>

          </div>

        </motion.div>

        {/* CENTER */}

        <PlaybackControls
          playing={isPlaying}
          shuffle={shuffle}
          repeat={repeat !== REPEAT_NONE}
          onPlayPause={togglePlay}
          onPrevious={playPrev}
          onNext={playNext}
          onShuffle={toggleShuffle}
          onRepeat={cycleRepeat}
        />

        {/* RIGHT */}

        <div className="flex items-center justify-end gap-4">

          <button
            onClick={() => toggleFavorite(currentMedia.id)}
            className="rounded-xl p-2 transition hover:bg-white/10 text-zinc-500 hover:text-rose-500"
          >
            <Heart
              size={18}
              className={currentMedia.favorite ? "text-rose-500" : ""}
              fill={currentMedia.favorite ? "currentColor" : "none"}
            />
          </button>

          {/* Equalizer Presets Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowEqPopover(!showEqPopover)}
              className={`rounded-xl p-2 transition hover:bg-white/10 ${showEqPopover ? "bg-white/10 text-cyan-400" : "text-zinc-500 hover:text-white"}`}
              title="Sound Presets"
            >
              <Sliders size={18} />
            </button>

            {showEqPopover && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-14 right-0 z-50 w-64 rounded-2xl border border-white/10 bg-zinc-950/95 p-4 shadow-2xl backdrop-blur-3xl"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Sound Presets</h4>
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full font-bold">EQ</span>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                  {presets.map((preset) => {
                    const isActive = preset.id === activePresetId;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => { setEqPreset(preset.id); setShowEqPopover(false); }}
                        className={`w-full text-left rounded-xl px-3 py-2 text-xs transition flex flex-col gap-0.5 ${
                          isActive
                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                            : "text-zinc-300 hover:bg-white/5 border border-transparent"
                        }`}
                      >
                        <span className="font-semibold">{preset.name}</span>
                        <span className="text-[10px] text-zinc-500 line-clamp-1">{preset.description}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>

          <VolumeControl
            volume={volume}
            muted={isMuted}
            onMute={toggleMute}
            onVolumeChange={changeVolume}
          />

          <button
            onClick={() => setShowLyrics(!showLyrics)}
            className={`rounded-xl p-2 transition hover:bg-white/10 ${showLyrics ? "bg-cyan-500/20 text-cyan-400" : "text-zinc-500 hover:text-white"}`}
            title="Toggle Lyrics"
          >
            <AlignLeft size={18} />
          </button>

          <button
            onClick={() => setShowNowPlaying(true)}
            className="rounded-xl p-2 transition hover:bg-white/10 text-zinc-500 hover:text-white"
          >
            <ChevronUp size={18} />
          </button>

        </div>

      </div>

      <LyricsPanel isOpen={showLyrics} onClose={() => setShowLyrics(false)} />

    </motion.div>
  );
}
