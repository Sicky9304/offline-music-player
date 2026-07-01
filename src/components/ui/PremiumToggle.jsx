import { motion } from "framer-motion";
import clsx from "clsx";

export default function PremiumToggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = "md",
  className = "",
}) {
  const sizes = {
    sm: { track: "w-11 h-6", thumb: "w-5 h-5", move: "translate-x-5" },
    md: { track: "w-14 h-8", thumb: "w-6 h-6", move: "translate-x-6" },
    lg: { track: "w-16 h-9", thumb: "w-7 h-7", move: "translate-x-7" },
  };

  const s = sizes[size];

  return (
    <div className={clsx("flex items-center justify-between gap-5", className)}>
      <div className="min-w-0 flex-1">
        {label && <h4 className="text-sm font-semibold text-white">{label}</h4>}
        {description && <p className="mt-1 text-xs text-zinc-400">{description}</p>}
      </div>

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={clsx(
          "relative rounded-full transition-all duration-300",
          s.track,
          checked ? "bg-[var(--accent)] shadow-[0_0_20px_var(--accent)]" : "bg-white/10",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={clsx(
            "absolute left-1 top-1 rounded-full bg-white shadow-lg",
            s.thumb,
            checked && s.move
          )}
        />
      </motion.button>
    </div>
  );
}
