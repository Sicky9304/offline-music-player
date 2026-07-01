import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import GlassCard from "../ui/GlassCard";
import GlassButton from "../ui/GlassButton";
import {
    Sparkles,
    Upload,
    Shuffle,
    Music2,
    Heart,
    Clock3,
    Disc3,
    Play
} from "lucide-react";

const fadeUp = {
    hidden: { opacity: 0, y: 35 },
    visible: (delay = 0) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay,
            duration: 0.6,
            ease: "easeOut"
        }
    })
};

export default memo(function HeroBanner({
    profile,
    greetingText,
    currentMedia,
    library,
    playlists,
    history,
    importFiles,
    handleShuffleAll
}) {

    const totalSongs = useMemo(() => library.filter(item => item.type === "audio").length, [library]);

    const totalPlaylists = playlists.length;

    const favorites = useMemo(() => library.filter(item => item.favorite).length, [library]);

    const recentlyPlayed = history.length;

    return (

        <motion.section
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="relative overflow-hidden rounded-[34px] border border-white/10 bg-white/5 backdrop-blur-3xl p-6 pb-44 md:p-8 md:pb-44 xl:p-10 xl:pb-40">

            {/* Background */}

            <div className="absolute inset-0 overflow-hidden">

                <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-violet-600/25 blur-[140px]" />

                <div className="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-cyan-500/20 blur-[130px]" />

                <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-fuchsia-500/10 blur-[150px]" />

                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-cyan-500/5" />

                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,.08),transparent_65%)]" />

            </div>

            <div className="relative z-10 grid grid-cols-1 xl:grid-cols-12 gap-10">

                {/* LEFT */}

                <div className="xl:col-span-8 flex flex-col justify-center">

                    <motion.div
                        variants={fadeUp}
                        custom={0.1}
                        className="inline-flex w-fit items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-4 py-2 backdrop-blur-xl">

                        <Sparkles size={15} className="text-violet-300" />

                        <span className="text-[11px] uppercase tracking-[0.35em] font-semibold text-violet-200">

                            MUSIC HUB PLAYER

                        </span>

                    </motion.div>

                    <motion.h1
                        variants={fadeUp}
                        custom={0.2}
                        className="mt-7 font-black leading-[1.05] tracking-tight">

                        <span className="block text-4xl md:text-5xl xl:text-6xl text-white">

                            {greetingText},

                        </span>

                        <span className="block mt-2 bg-gradient-to-r from-white via-violet-300 to-cyan-300 bg-clip-text text-5xl md:text-6xl xl:text-7xl text-transparent">

                            {profile?.name || "Music Lover"} 👋

                        </span>

                    </motion.h1>

                    <motion.p
                        variants={fadeUp}
                        custom={0.3}
                        className="mt-6 max-w-2xl text-sm md:text-base leading-8 text-zinc-300">

                        Experience your music in a completely new way. Enjoy immersive visuals, dynamic themes, personalized recommendations and seamless offline playback designed around your listening habits.

                    </motion.p>

                    <motion.div
                        variants={fadeUp}
                        custom={0.4}
                        className="mt-8 flex flex-wrap gap-4">

                        <GlassButton
                            variant="secondary"
                            onClick={importFiles}
                            leftIcon={<Upload size={18} className="text-violet-300 transition-transform duration-300 group-hover:rotate-12" />}
                            className="h-[54px] rounded-2xl px-6"
                        >
                            Import Music
                        </GlassButton>

                        <GlassButton
                            variant="primary"
                            onClick={handleShuffleAll}
                            leftIcon={<Shuffle size={18} className="transition-transform duration-500 group-hover:rotate-180" />}
                            className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 shadow-violet-700/30 h-[54px] rounded-2xl px-6"
                        >
                            Shuffle Everything
                        </GlassButton>

                    </motion.div>

                    <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-5">

                        {[
                            { icon: Music2, label: "Songs", value: totalSongs, color: "from-violet-500 to-fuchsia-500" },
                            { icon: Disc3, label: "Playlists", value: totalPlaylists, color: "from-cyan-500 to-blue-500" },
                            { icon: Heart, label: "Favorites", value: favorites, color: "from-pink-500 to-rose-500" },
                            { icon: Clock3, label: "Recently Played", value: recentlyPlayed, color: "from-emerald-500 to-teal-500" }
                        ].map((item) => (
                            <motion.div
                                key={item.label}
                                whileHover={{ y: -6, scale: 1.03 }}
                                transition={{ duration: 0.3 }}
                                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-3xl p-5 shadow-xl shadow-black/30 hover:border-violet-400/30"
                            >
                                <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${item.color}`} />

                                <div className="relative z-10 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs uppercase tracking-widest text-zinc-400">{item.label}</p>
                                        <h3 className="mt-3 text-3xl font-black text-white">{item.value}</h3>
                                    </div>

                                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color}`}>
                                        <item.icon size={24} className="text-white" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                </div>

                {/* RIGHT */}

                <div className="xl:col-span-4">

                    <motion.div
                        variants={fadeUp}
                        custom={0.5}
                        className="relative overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.04] backdrop-blur-3xl p-6 shadow-[0_20px_60px_rgba(0,0,0,.45)]">

                        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-cyan-500/10" />

                        <div className="relative z-10 flex items-center justify-between">

                            <div>

                                <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">

                                    NOW PLAYING

                                </p>

                                <h2 className="mt-2 text-2xl font-black text-white">

                                    {currentMedia?.title || "Nothing Playing"}

                                </h2>

                                <p className="mt-2 text-sm text-zinc-400">

                                    {currentMedia?.artist || "Select a song to start listening"}

                                </p>

                            </div>

                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-500 shadow-xl shadow-violet-500/30">

                                <Play size={22} fill="white" className="ml-1 text-white" />

                            </div>

                        </div>

                        <div className="mt-8 flex justify-center">

                            <div className="relative">

                                <div className="absolute inset-0 animate-pulse rounded-full bg-violet-500/30 blur-3xl" />

                                <div className="relative h-64 w-64 overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-800 shadow-2xl">

                                    {currentMedia?.thumbnail ? (

                                        <img
                                            src={currentMedia.thumbnail}
                                            alt=""
                                            className="h-full w-full object-cover"
                                        />

                                    ) : (

                                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-violet-600 via-fuchsia-600 to-cyan-600">

                                            <Music2 size={90} className="text-white opacity-90" />

                                        </div>

                                    )}

                                    <div className="absolute inset-0 rounded-full border-[18px] border-black/30" />

                                    <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-lg" />

                                </div>

                            </div>

                        </div>

                        <div className="mt-10">

                            <div className="mb-3 flex items-center justify-between">

                                <span className="text-xs uppercase tracking-widest text-zinc-400">

                                    Listening Activity

                                </span>

                                <span className="text-xs font-semibold text-violet-300">

                                    Live

                                </span>

                            </div>

                            <div className="flex h-16 items-end justify-center gap-2">

                                {[20, 45, 30, 60, 80, 35, 65, 40, 70, 50, 85, 45].map((h, i) => (
                                    <motion.div
                                        key={i}
                                        animate={{ height: [`${h}%`, `${Math.max(20, h - 25)}%`, `${h}%`] }}
                                        transition={{ repeat: Infinity, duration: 1.2 + (i * 0.08) }}
                                        className="w-2 rounded-full bg-gradient-to-t from-violet-600 via-fuchsia-500 to-cyan-400"
                                    />
                                ))}

                            </div>

                        </div>

                    </motion.div>
                    {/* Bottom Floating Banner */}

                    <div className="absolute bottom-[-125px] center left-1/2 hidden w-[100%] -translate-x-1/2 lg:block">
                        <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/[0.04] px-8 py-5 backdrop-blur-3xl">

                            <div className="flex items-center gap-4">

                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-500 shadow-lg shadow-violet-500/30">
                                    <Sparkles size={24} className="text-white" />
                                </div>

                                <div>
                                    <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">
                                        Music Hub Player
                                    </p>

                                    <h3 className="mt-1 text-lg font-bold text-white">
                                        Your music. Your mood. Your universe.
                                    </h3>
                                </div>

                            </div>

                            <div className="flex items-center gap-10">

                                <div className="text-center">
                                    <p className="text-3xl font-black text-white">
                                        {totalSongs}
                                    </p>
                                    <span className="text-xs uppercase tracking-widest text-zinc-500">
                                        Songs
                                    </span>
                                </div>

                                <div className="h-10 w-px bg-white/10" />

                                <div className="text-center">
                                    <p className="text-3xl font-black text-white">
                                        {favorites}
                                    </p>
                                    <span className="text-xs uppercase tracking-widest text-zinc-500">
                                        Favorites
                                    </span>
                                </div>

                                <div className="h-10 w-px bg-white/10" />

                                <div className="text-center">
                                    <p className="text-3xl font-black text-white">
                                        {recentlyPlayed}
                                    </p>
                                    <span className="text-xs uppercase tracking-widest text-zinc-500">
                                        Recent
                                    </span>
                                </div>

                            </div>

                        </div>
                    </div>

                    {/* Decorative Glow */}

                    <div className="pointer-events-none absolute -bottom-52 left-1/2 h-[450px] w-[450px] -translate-x-1/2 rounded-full bg-violet-600/10 blur-[180px]" />

                    <div className="pointer-events-none absolute -right-36 top-24 h-[260px] w-[260px] rounded-full bg-cyan-500/10 blur-[140px]" />

                    <div className="pointer-events-none absolute -left-24 bottom-10 h-[220px] w-[220px] rounded-full bg-fuchsia-500/10 blur-[120px]" />

                    {/* Noise Texture */}

                    <div
                        className="pointer-events-none absolute inset-0 opacity-[0.03]"
                        style={{
                            backgroundImage:
                                "url('data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"160\" height=\"160\" viewBox=\"0 0 160 160\"%3E%3Cg fill=\"white\" fill-opacity=\"0.5\"%3E%3Ccircle cx=\"3\" cy=\"3\" r=\"1\"/%3E%3Ccircle cx=\"60\" cy=\"50\" r=\"1\"/%3E%3Ccircle cx=\"120\" cy=\"80\" r=\"1\"/%3E%3Ccircle cx=\"30\" cy=\"130\" r=\"1\"/%3E%3Ccircle cx=\"145\" cy=\"145\" r=\"1\"/%3E%3C/g%3E%3C/svg%3E')"
                        }}
                    />
                </div>
            </div>
        </motion.section>
    );
});

