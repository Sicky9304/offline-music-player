import { useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";

export default function PremiumSlider({
  label,
  description,
  value,
  min = 0,
  max = 100,
  step = 1,
  suffix = "%",
  showValue = true,
  disabled = false,
  onChange,
  className = "",
}) {
  const [dragging, setDragging] = useState(false);

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={clsx("w-full", className)}>
      {(label || showValue) && (
        <div className="mb-3 flex items-center justify-between">
          <div>
            {label && <h4 className="text-sm font-semibold text-white">{label}</h4>}
            {description && <p className="mt-1 text-xs text-zinc-400">{description}</p>}
          </div>

          {showValue && (
            <motion.div
              animate={{ scale: dragging ? 1.1 : 1 }}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white"
            >
              {value}{suffix}
            </motion.div>
          )}
        </div>
      )}

      <div className="relative flex h-6 items-center">

        <div className="absolute h-2 w-full rounded-full bg-white/10" />

        <motion.div
          className="absolute h-2 rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-500"
          animate={{ width: `${percentage}%` }}
        />

        <motion.div
          animate={{ left: `${percentage}%`, scale: dragging ? 1.2 : 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute -translate-x-1/2 h-5 w-5 rounded-full border-2 border-white bg-white shadow-[0_0_15px_var(--accent)]"
        />

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onMouseDown={() => setDragging(true)}
          onMouseUp={() => setDragging(false)}
          onTouchStart={() => setDragging(true)}
          onTouchEnd={() => setDragging(false)}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute h-6 w-full cursor-pointer opacity-0 disabled:pointer-events-none"
        />

      </div>
    </div>
  );
}
