import { motion } from "framer-motion";
import { Play, Heart, Flame, TrendingUp, Trophy } from "lucide-react";
import SectionHeader from "../ui/SectionHeader";

export default function ChartsSection({
    filteredTracks = [],
    topTracks = [],
    history = [],
    playMedia,
    toggleFavorite
}) {

    return (
        <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">

            <div className="xl:col-span-8">
                <SectionHeader
                    title="Just For You"
                    subtitle="Personalized recommendations."
                    icon={Flame}
                    badge="Recommended"
                />

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredTracks.map(track => (
                        <motion.div key={track.id} whileHover={{ y: -6 }} className="group overflow-hidden rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-3xl">
                            <div className="relative aspect-square overflow-hidden">
                                {track.thumbnail ? (
                                    <img src={track.thumbnail} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                                ) : (
                                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-violet-600 via-fuchsia-500 to-cyan-500 text-7xl">🎵</div>
                                )}

                                <button onClick={() => playMedia(track)} className="absolute bottom-4 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-black opacity-0 shadow-xl transition duration-300 group-hover:opacity-100">
                                    <Play fill="black" size={18} />
                                </button>
                            </div>

                            <div className="p-4">
                                <h3 className="truncate font-bold text-white">{track.title}</h3>
                                <p className="truncate text-sm text-zinc-400">{track.artist || "Unknown Artist"}</p>

                                <button onClick={() => toggleFavorite(track.id)} className="mt-4 flex items-center gap-2 text-pink-400 hover:text-pink-300">
                                    <Heart size={16} fill={track.favorite ? "currentColor" : "none"} />
                                    <span className="text-xs">{track.favorite ? "Liked" : "Like"}</span>
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <div className="xl:col-span-4">
                <div className="rounded-[30px] border border-white/10 bg-white/5 backdrop-blur-3xl p-5">
                    <div className="mb-5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Trophy className="text-yellow-400" size={22} />
                            <h2 className="text-xl font-black text-white">Top Charts</h2>
                        </div>
                        <TrendingUp className="text-emerald-400" size={20} />
                    </div>

                    <div className="space-y-3">
                        {topTracks.map((track, index) => (
                            <motion.div key={track.id} whileHover={{ x: 4 }} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                                <div className="w-8 text-center text-lg font-black text-zinc-500">#{index + 1}</div>

                                <div className="h-12 w-12 overflow-hidden rounded-xl">
                                    {track.thumbnail ? (
                                        <img src={track.thumbnail} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-violet-600 to-cyan-500">🎵</div>
                                    )}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <h4 className="truncate font-semibold text-white">{track.title}</h4>
                                    <p className="truncate text-xs text-zinc-400">{track.artist || "Unknown"}</p>
                                </div>

                                <button onClick={() => playMedia(track)} className="rounded-full bg-white p-2 text-black hover:scale-110 transition">
                                    <Play size={14} fill="black" />
                                </button>
                            </motion.div>
                        ))}
                    </div>

                    <div className="mt-6 rounded-2xl border border-white/10 bg-gradient-to-r from-violet-600/20 to-cyan-500/20 p-4">
                        <p className="text-xs uppercase tracking-widest text-zinc-400">Listening History</p>
                        <h3 className="mt-2 text-3xl font-black text-white">{history.length}</h3>
                        <p className="text-sm text-zinc-400">Songs played</p>
                    </div>
                </div>
            </div>

        </section>
    );
}
