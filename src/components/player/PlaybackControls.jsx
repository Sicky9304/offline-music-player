import { motion } from "framer-motion";
import {
  Shuffle,
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Repeat,
} from "lucide-react";

export default function PlaybackControls({
  playing,
  shuffle,
  repeat,
  onPlayPause,
  onPrevious,
  onNext,
  onShuffle,
  onRepeat,
}) {
  const btn =
    "flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-300 transition hover:border-cyan-400 hover:bg-cyan-500/10 hover:text-white";

  return (
    <div className="flex items-center justify-center gap-3">

      <button onClick={onShuffle} className={`${btn} ${shuffle ? "text-cyan-400 border-cyan-400" : ""}`}>
        <Shuffle size={18} />
      </button>

      <button onClick={onPrevious} className={btn}>
        <SkipBack size={18} />
      </button>

      <motion.button
        whileTap={{ scale: .9 }}
        onClick={onPlayPause}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 text-white shadow-[0_0_35px_rgba(34,211,238,.35)]"
      >
        {playing ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
      </motion.button>

      <button onClick={onNext} className={btn}>
        <SkipForward size={18} />
      </button>

      <button onClick={onRepeat} className={`${btn} ${repeat ? "text-cyan-400 border-cyan-400" : ""}`}>
        <Repeat size={18} />
      </button>

    </div>
  );
}
