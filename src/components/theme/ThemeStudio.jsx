import { motion } from "framer-motion";
import {
  Sparkles, Palette, Wand2, Type, MonitorSmartphone, SlidersHorizontal, Check
} from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import { useSettings } from "../../hooks/useSettings";

const fonts=["Inter","Outfit","Sora","Manrope","Poppins","Clash Display"];

export default function ThemeStudio({ search = "" }){
  const {themeId,accentId,changeTheme,changeAccent,themes,accents,engine,updateEngine}=useTheme();
  const {settings,updateSetting}=useSettings();

  const filteredThemes = themes.filter(theme => 
    theme.name.toLowerCase().includes(search.toLowerCase().trim()) ||
    theme.description.toLowerCase().includes(search.toLowerCase().trim())
  );

  return (
    <div className="space-y-8">

      {/* Dynamic Theme */}
      <motion.section whileHover={{y:-4}}
        className="overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.04] backdrop-blur-3xl">
        <div className="relative p-8">
          <div className="absolute -top-20 right-0 h-64 w-64 rounded-full bg-cyan-500/10 blur-[120px]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-4 py-1 text-cyan-300">
                <Sparkles size={15}/> Dynamic Album Theme
              </div>
              <h2 className="mt-4 text-3xl font-black text-white">Color Extraction Engine</h2>
              <p className="mt-2 max-w-xl text-zinc-400">
                Automatically adapt the entire interface using the dominant colors of the current album artwork.
              </p>
            </div>
            <button
              onClick={()=>updateSetting("dynamicTheme",!settings.dynamicTheme)}
              className={`relative h-8 w-16 rounded-full transition ${settings.dynamicTheme?"bg-cyan-500":"bg-zinc-700"}`}>
              <span className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-all ${settings.dynamicTheme?"right-1":"left-1"}`}/>
            </button>
          </div>
        </div>
      </motion.section>

      {/* Themes + Preview */}
      <div className="grid gap-8 xl:grid-cols-[1.3fr_.7fr]">

        <section className="rounded-[34px] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-3xl">
          <div className="mb-6 flex items-center gap-3">
            <Palette className="text-cyan-400"/>
            <h3 className="text-2xl font-bold text-white">Official Themes</h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredThemes.length > 0 ? (
              filteredThemes.map(theme=>(
                <motion.button
                  whileHover={{y:-5}}
                  whileTap={{scale:.98}}
                  key={theme.id}
                  onClick={()=>changeTheme(theme.id)}
                  className={`relative overflow-hidden rounded-3xl border p-5 text-left ${themeId===theme.id?"border-cyan-400":"border-white/10"}`}
                  style={{background:theme.preview}}>
                  <div className="absolute inset-0 bg-black/35"/>
                  <div className="relative">
                    <div className="mb-10 flex gap-1">
                      <span className="h-2 w-2 rounded-full bg-red-400"/>
                      <span className="h-2 w-2 rounded-full bg-yellow-400"/>
                      <span className="h-2 w-2 rounded-full bg-green-400"/>
                    </div>
                    <h4 className="font-bold text-white">{theme.name}</h4>
                    <p className="mt-1 text-xs text-zinc-300">{theme.description}</p>
                    {themeId===theme.id && (
                      <Check className="absolute right-0 top-0 text-white"/>
                    )}
                  </div>
                </motion.button>
              ))
            ) : (
              <div className="col-span-full py-8 text-center text-zinc-400 text-sm">
                No themes found matching "{search}"
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[34px] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-3xl">
          <div className="mb-6 flex items-center gap-3">
            <MonitorSmartphone className="text-cyan-400"/>
            <h3 className="text-2xl font-bold text-white">Live Preview</h3>
          </div>

          <div className="overflow-hidden rounded-[28px] border" style={{ borderColor: 'var(--border)', background: 'var(--bg-primary)' }}>
            <div className="flex h-80">
              <aside className="w-24 p-3" style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)' }}>
                <div className="mb-4 h-10 bg-[var(--accent)]" style={{ borderRadius: 'var(--radius)' }}/>
                <div className="space-y-2">
                  <div className="h-3 rounded" style={{ background: 'var(--border)' }}/>
                  <div className="h-3 rounded" style={{ background: 'var(--border)' }}/>
                  <div className="h-3 rounded" style={{ background: 'var(--border)' }}/>
                </div>
              </aside>
              <div className="flex-1 p-4">
                <div className="h-20 bg-gradient-to-r from-[var(--accent)]/60 to-transparent" style={{ borderRadius: 'var(--radius)' }}/>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {[1,2,3,4].map(i=><div key={i} className="aspect-square border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: 'var(--radius)' }}/>)}
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* Accent + Typography */}
      <div className="grid gap-8 xl:grid-cols-2">

        <section className="rounded-[34px] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-3xl">
          <div className="mb-6 flex items-center gap-3">
            <Wand2 className="text-cyan-400"/>
            <h3 className="text-2xl font-bold text-white">Accent Studio</h3>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {accents.map(acc=>(
              <button key={acc.id}
                onClick={()=>changeAccent(acc.id)}
                className="group">
                <div className="h-16 rounded-2xl border border-white/10 transition group-hover:scale-105"
                  style={{background:acc.hex,boxShadow:accentId===acc.id?`0 0 30px ${acc.hex}`:"none"}}/>
                <p className="mt-2 text-xs text-center text-zinc-400">{acc.name}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[34px] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-3xl">
          <div className="mb-6 flex items-center gap-3">
            <Type className="text-cyan-400"/>
            <h3 className="text-2xl font-bold text-white">Typography</h3>
          </div>
          <div className="grid gap-3">
            {fonts.map(f=>{
              const active = (engine.typography || "Outfit") === f;
              return (
                <button
                  key={f}
                  onClick={() => updateEngine("typography", f)}
                  className={`rounded-2xl border bg-white/[0.02] px-5 py-4 text-left transition ${
                    active ? "border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.15)]" : "border-white/10 hover:border-cyan-400"
                  }`}
                  style={{ fontFamily: f }}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-lg text-white">{f}</p>
                    {active && <Check size={16} className="text-cyan-400" />}
                  </div>
                  <p className="text-xs text-zinc-500">The quick brown fox jumps over the lazy dog.</p>
                </button>
              );
            })}
          </div>
        </section>

      </div>

      <section className="rounded-[34px] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-3xl">
        <div className="mb-6 flex items-center gap-3">
          <SlidersHorizontal className="text-cyan-400"/>
          <h3 className="text-2xl font-bold text-white">Visual Effects</h3>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Glass Blur","glassBlur"],
            ["Floating Cards","floatingCards"],
            ["Glow Effects","glowEffects"],
            ["Smooth Animations","animationsEnabled"],
          ].map(([label,key])=>(
            <div key={key} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center justify-between">
                <span className="font-medium text-white">{label}</span>
                <button
                  onClick={()=>updateSetting(key,!settings[key])}
                  className={`relative h-7 w-14 rounded-full ${settings[key]?"bg-cyan-500":"bg-zinc-700"}`}>
                  <span className={`absolute top-1 h-5 w-5 rounded-full bg-white ${settings[key]?"right-1":"left-1"}`}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
