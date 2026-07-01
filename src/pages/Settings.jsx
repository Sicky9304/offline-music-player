import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Settings2,
  Sparkles,
  HardDrive,
  Music4,
  Palette,
  RotateCcw,
} from "lucide-react";

import SettingsPanel from "../components/settings/SettingsPanel";
import { useSettings } from "../hooks/useSettings";
import { useLibrary } from "../hooks/useLibrary";
import { useTheme } from "../hooks/useTheme";
import { useToast } from "../components/ui/Toast.jsx";
import SearchBar from "../components/ui/SearchBar";
import GlassButton from "../components/ui/GlassButton";

const formatSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function Settings() {
  const { settings, resetSettings } = useSettings();
  const { library, dbStatus } = useLibrary();
  const { themeId, themes } = useTheme();
  const toast = useToast();

  const [search, setSearch] = useState("");

  const activeTheme = themes.find(t => t.id === themeId);
  const activeThemeName = activeTheme ? activeTheme.name : "Dark";

  const totalBytes = useMemo(() => {
    return library.reduce((acc, item) => acc + (item.fileSize || 0), 0);
  }, [library]);

  const formattedStorage = useMemo(() => formatSize(totalBytes), [totalBytes]);

  const handleReset = async () => {
    if (window.confirm("Are you sure you want to reset all settings to defaults?")) {
      await resetSettings();
      toast.success("Settings reset to defaults");
    }
  };

  return (
    <motion.main
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="h-full overflow-y-auto"
    >
      <div className="mx-auto w-full max-w-[1750px] px-5 py-8 md:px-8 xl:px-12 2xl:px-16 pb-40">

        {/* ================= HEADER ================= */}

        <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-3xl">

          {/* Glow */}

          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-[120px]" />

          <div className="absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-violet-600/10 blur-[120px]" />

          <div className="relative z-10 flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">

            {/* Left */}

            <div className="flex items-center gap-6">

              <div className="flex h-20 w-20 items-center justify-center rounded-[30px] bg-gradient-to-br from-cyan-500 via-sky-500 to-violet-600 shadow-2xl shadow-cyan-500/20">

                <Settings2
                  size={36}
                  className="text-white"
                />

              </div>

              <div>

                <span className="text-xs font-black uppercase tracking-[0.35em] text-cyan-400">

                  Music Hub Player

                </span>

                <h1 className="mt-2 text-4xl font-black text-white md:text-5xl">

                  Settings

                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">

                  Personalize your music experience, optimize playback,
                  customize themes and control every aspect of your player.

                </p>

              </div>

            </div>

            {/* Right */}

            <div className="flex flex-col gap-4 lg:flex-row items-center">

              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search settings..."
                onClear={() => setSearch('')}
                className="w-72 h-14 text-sm"
              />

              <GlassButton
                variant="secondary"
                onClick={handleReset}
                leftIcon={<RotateCcw size={18} />}
                className="h-14 px-6 rounded-2xl font-semibold"
              >
                Reset
              </GlassButton>

            </div>

          </div>

        </div>

        {/* ================= QUICK INFO ================= */}

        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

          {[
            {
              title: "Playback Volume",
              value: `${settings.defaultVolume}%`,
              icon: Music4,
              color: "from-cyan-500 to-blue-600",
            },

            {
              title: "Active Theme",
              value: activeThemeName,
              icon: Palette,
              color: "from-fuchsia-500 to-violet-600",
            },

            {
              title: "Library Storage",
              value: formattedStorage,
              icon: HardDrive,
              color: "from-emerald-500 to-cyan-500",
            },

            {
              title: "Database Status",
              value: dbStatus.connected ? "Cloud Sync" : "Local Mode",
              icon: Sparkles,
              color: "from-amber-400 to-orange-500",
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
                  className={`flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br ${item.color}`}
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

        {/* ================= SETTINGS PANEL ================= */}

        <div className="mt-10">

          <SettingsPanel search={search} />

        </div>

      </div>
    </motion.main>
  );
}