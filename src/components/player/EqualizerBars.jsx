import { motion } from 'framer-motion';

export default function EqualizerBars({ isPlaying = true, bars = 5 }) {
  return (
    <div className="flex items-end gap-[2px] h-4">
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          className="w-[2.5px] rounded-full origin-bottom"
          style={{ 
            background: 'linear-gradient(to top, var(--accent), var(--accent-300))',
            height: '100%',
          }}
          animate={isPlaying ? {
            scaleY: [0.2, 1, 0.4, 0.8, 0.3, 1, 0.2],
            transition: {
              duration: 1.0,
              repeat: Infinity,
              delay: i * 0.12,
              ease: 'easeInOut',
            },
          } : { scaleY: 0.2 }}
          initial={{ scaleY: 0.2 }}
        />
      ))}
    </div>
  );
}
