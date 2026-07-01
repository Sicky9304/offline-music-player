import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Loader2, SlidersHorizontal } from "lucide-react";
import { useRef } from "react";
import clsx from "clsx";

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search music, albums, artists...",
  loading = false,
  className = "",
  onClear,
  autoFocus = false,
  leftIcon,
  rightSlot,
}) {
  const inputRef = useRef(null);

  return (
    <motion.div
      whileFocus={{ scale: 1.01 }}
      className={clsx(
        "group relative flex h-14 w-full items-center overflow-hidden rounded-3xl border border-white/10",
        "bg-white/[0.04] backdrop-blur-3xl",
        "transition-all duration-300",
        "focus-within:border-[var(--accent)]",
        "focus-within:shadow-[0_0_35px_rgba(0,0,0,.35)]",
        className
      )}
    >
      {/* Glow */}

      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-focus-within:opacity-100"
        style={{
          background:
            "linear-gradient(90deg,transparent,var(--accent),transparent)",
          filter: "blur(70px)",
        }}
      />

      {/* Left */}

      <div className="relative z-10 flex items-center gap-3 pl-5">

        {leftIcon ?? (
          <Search
            size={18}
            className="text-zinc-400 transition group-focus-within:text-[var(--accent)]"
          />
        )}

      </div>

      {/* Input */}

      <input
        ref={inputRef}
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="
          relative
          z-10
          h-full
          flex-1
          bg-transparent
          px-4
          text-[15px]
          text-white
          outline-none
          placeholder:text-zinc-500
        "
      />

      {/* Right */}

      <div className="relative z-10 flex items-center gap-2 pr-3">

        {loading && (
          <Loader2
            size={17}
            className="animate-spin text-[var(--accent)]"
          />
        )}

        <AnimatePresence>

          {value && !loading && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              whileTap={{ scale: .85 }}
              onClick={() => {
                onClear?.();
                inputRef.current?.focus();
              }}
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-xl
                text-zinc-400
                transition
                hover:bg-white/5
                hover:text-white
              "
            >
              <X size={16} />
            </motion.button>
          )}

        </AnimatePresence>

        {rightSlot}

        <div
          className="
            hidden
            md:flex
            items-center
            gap-1
            rounded-xl
            border
            border-white/10
            bg-white/5
            px-2
            py-1
            text-[10px]
            font-semibold
            tracking-wide
            text-zinc-500
          "
        >
          CTRL
          <span>+</span>
          K
        </div>

        <button
          className="
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-xl
            text-zinc-400
            transition
            hover:bg-white/5
            hover:text-[var(--accent)]
          "
        >
          <SlidersHorizontal size={16} />
        </button>

      </div>
    </motion.div>
  );
}
