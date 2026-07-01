import { motion } from "framer-motion";

const format = (s) => {
  if (!s) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
};

export default function ProgressBar({
  currentTime,
  duration,
  onSeek,
}) {

  const progress = duration
    ? (currentTime / duration) * 100
    : 0;

  return (

    <div className="w-full">

      <div className="mb-2 flex items-center justify-between text-xs text-zinc-400">

        <span>{format(currentTime)}</span>

        <span>{format(duration)}</span>

      </div>

      <div className="group relative h-2 cursor-pointer rounded-full bg-white/10">

        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500"
          style={{ width: `${progress}%` }}
        />

        <input
          type="range"
          min={0}
          max={duration || 0}
          value={currentTime}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />

      </div>

    </div>

  );
}
