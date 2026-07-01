import { motion } from "framer-motion";
import clsx from "clsx";
import { ChevronRight } from "lucide-react";

export default function SectionHeader({
  title,
  subtitle,
  icon: Icon,
  badge,
  actionText,
  onAction,
  className = "",
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: .35 }}
      className={clsx("mb-6 flex items-center justify-between", className)}
    >
      <div className="flex items-center gap-4">

        {Icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-[var(--accent)] shadow-[0_0_25px_rgba(0,0,0,.25)]">
            <Icon size={22} />
          </div>
        )}

        <div>

          <div className="flex items-center gap-3">

            <h2 className="text-2xl font-black tracking-tight text-white">
              {title}
            </h2>

            {badge && (
              <span className="rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]">
                {badge}
              </span>
            )}

          </div>

          {subtitle && (
            <p className="mt-1 text-sm text-zinc-400">
              {subtitle}
            </p>
          )}

        </div>

      </div>

      {actionText && (
        <motion.button
          whileHover={{ x: 4 }}
          whileTap={{ scale: .96 }}
          onClick={onAction}
          className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-zinc-300 transition-all duration-300 hover:border-[var(--accent)] hover:text-white"
        >
          {actionText}
          <ChevronRight size={17} />
        </motion.button>
      )}
    </motion.div>
  );
}
