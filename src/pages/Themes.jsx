import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Palette,
  Sparkles,
  Download,
  Upload,
  Wand2,
  Paintbrush,
  Layers3,
} from "lucide-react";

import ThemeStudio from "../components/theme/ThemeStudio";
import SearchBar from "../components/ui/SearchBar";
import GlassButton from "../components/ui/GlassButton";
import { useTheme } from "../hooks/useTheme";
import { useToast } from "../components/ui/Toast";

export default function Themes() {
  const { themes, themeId, accentId, engine, importCustomTheme } = useTheme();
  const toast = useToast();
  
  const [search, setSearch] = useState("");
  const fileInputRef = useRef(null);

  const handleExport = () => {
    const activeTheme = themes.find(t => t.id === themeId) || themes[0];
    const themeExportData = {
      name: activeTheme.name,
      description: activeTheme.description,
      vars: activeTheme.vars,
      preview: activeTheme.preview,
      accentId: accentId,
      engine: engine
    };
    
    try {
      const blob = new Blob([JSON.stringify(themeExportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${activeTheme.name.toLowerCase().replace(/\s+/g, "-")}-theme.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Theme exported successfully!");
    } catch (err) {
      toast.error("Failed to export theme: " + err.message);
    }
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const themeData = JSON.parse(event.target.result);
        if (!themeData.vars) {
          throw new Error("Invalid theme structure: vars object is missing");
        }
        importCustomTheme(themeData);
        toast.success("Theme imported and applied successfully!");
      } catch (err) {
        toast.error("Failed to import theme: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // clear input
  };

  return (
    <motion.main
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="h-full overflow-y-auto"
    >
      <div className="mx-auto w-full max-w-[1800px] px-5 py-8 md:px-8 xl:px-12 2xl:px-16 pb-40">

        {/* Hidden File Input for Import */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImport}
          accept=".json"
          style={{ display: "none" }}
        />

        {/* ================= HEADER ================= */}

        <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.04] backdrop-blur-3xl">

          {/* Aurora */}

          <div className="absolute -top-20 -left-16 h-72 w-72 rounded-full bg-cyan-500/10 blur-[120px]" />

          <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-violet-600/10 blur-[120px]" />

          <div className="absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-fuchsia-500/10 blur-[120px]" />

          <div className="relative z-10 flex flex-col gap-10 p-8 xl:flex-row xl:items-center xl:justify-between">

            {/* LEFT */}

            <div className="flex items-start gap-6">

              <div className="flex h-20 w-20 items-center justify-center rounded-[30px] bg-gradient-to-br from-cyan-500 via-sky-500 to-violet-600 shadow-[0_20px_60px_rgba(59,130,246,.35)]">

                <Palette
                  size={38}
                  className="text-white"
                />

              </div>

              <div>

                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-1 text-[11px] font-black uppercase tracking-[0.35em] text-cyan-300">

                  <Sparkles size={13} />

                  Theme Studio

                </span>

                <h1 className="mt-5 text-4xl font-black tracking-tight text-white md:text-5xl xl:text-6xl">

                  Build your own
                  <br />

                  Music Experience.

                </h1>

                <p className="mt-5 max-w-2xl text-sm leading-7 text-zinc-400">

                  Customize every visual element of Music Hub Player.
                  Choose premium themes, dynamic album colors,
                  glass effects, typography, animations and
                  create your own visual identity.

                </p>

              </div>

            </div>

            {/* RIGHT */}

            <div className="flex flex-col gap-4 items-center">

              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search themes..."
                onClear={() => setSearch("")}
                className="w-72 h-14 text-sm"
              />

              <div className="flex gap-3">

                <GlassButton
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  leftIcon={<Upload size={18} />}
                  className="h-12 px-5 font-semibold"
                >
                  Import
                </GlassButton>

                <GlassButton
                  variant="secondary"
                  onClick={handleExport}
                  leftIcon={<Download size={18} />}
                  className="h-12 px-5 font-semibold"
                >
                  Export
                </GlassButton>

              </div>

            </div>

          </div>

        </div>

        {/* ================= QUICK STATS ================= */}

        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

          {[
            {
              title: "Installed Themes",
              value: `${themes.length}`,
              icon: Layers3,
              gradient: "from-cyan-500 to-blue-600",
            },

            {
              title: "Dynamic Colors",
              value: "Enabled",
              icon: Wand2,
              gradient: "from-violet-500 to-fuchsia-600",
            },

            {
              title: "Accent Presets",
              value: "24",
              icon: Paintbrush,
              gradient: "from-emerald-500 to-cyan-500",
            },

            {
              title: "Visual Effects",
              value: "Premium",
              icon: Sparkles,
              gradient: "from-orange-500 to-pink-500",
            },

          ].map((item) => {

            const Icon = item.icon;

            return (

              <motion.div

                key={item.title}

                whileHover={{
                  y: -6,
                  scale: 1.02,
                }}

                className="group rounded-[30px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-3xl transition-all"

              >

                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br ${item.gradient}`}
                >

                  <Icon
                    size={28}
                    className="text-white"
                  />

                </div>

                <p className="mt-6 text-sm text-zinc-400">

                  {item.title}

                </p>

                <h2 className="mt-2 text-3xl font-black text-white">

                  {item.value}

                </h2>

              </motion.div>

            );

          })}

        </div>

        {/* ================= THEME STUDIO ================= */}

        <div className="mt-10">

          <ThemeStudio search={search} />

        </div>

      </div>
    </motion.main>
  );
}