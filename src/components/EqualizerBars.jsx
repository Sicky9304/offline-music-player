import { motion } from 'framer-motion';

export default function EqualizerBars({ isPlaying = true, bars = 5, color = 'var(--accent)' }) {
  return (
    <div className="flex items-end gap-0.5" style={{ height: 20 }}>
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          style={{ width: 3, background: color, borderRadius: 2, originY: 1 }}
          animate={isPlaying ? {
            scaleY: [0.3, 1, 0.5, 0.8, 0.2, 1, 0.4],
            transition: {
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            },
          } : { scaleY: 0.3 }}
          initial={{ scaleY: 0.3 }}
        />
      ))}
    </div>
  );
}
