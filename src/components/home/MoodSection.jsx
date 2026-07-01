import { motion } from "framer-motion";
import { Smile, Moon, Heart, Gamepad2, Laptop2, Dumbbell, CloudRain, Headphones, Sunset, Check } from "lucide-react";
import GlassCard from "../ui/GlassCard";

const moodIcons = {
  happy: Smile, chill: Headphones, romantic: Heart, coding: Laptop2, workout: Dumbbell, rain: CloudRain, gaming: Gamepad2, night: Moon, focus: Sunset,
};

export default function MoodSection({ MOODS = [], activeMood, setMood }) {
  return (
    <section>
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9">
        {MOODS.map((mood, index) => {
          const Icon = moodIcons[mood.id] || Smile;
          const active = activeMood === mood.id;
          return (
            <motion.div key={mood.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
              <GlassCard className={`group h-full cursor-pointer p-5 text-center ${active ? "ring-2 ring-[var(--accent)]" : ""}`} hover onClick={() => setMood(mood.id)}>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl shadow-xl" style={{ background: `linear-gradient(135deg,${mood.accent || "var(--accent)"},#22d3ee)` }}>
                  <Icon size={30} className="text-white" />
                </div>
                <div className="text-4xl">{mood.emoji}</div>
                <h3 className="mt-3 text-sm font-bold text-white">{mood.label}</h3>
                <p className="mt-1 text-[11px] text-zinc-400">Click to switch vibe</p>
                {active && (
                  <motion.div layoutId="activeMood" className="mx-auto mt-4 inline-flex items-center gap-1 rounded-full bg-[var(--accent)] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                    <Check size={10} />Selected
                  </motion.div>
                )}
              </GlassCard>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
