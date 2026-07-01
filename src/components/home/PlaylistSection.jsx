import { motion } from "framer-motion";
import { ListMusic, FolderHeart, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SectionHeader from "../ui/SectionHeader";

export default function PlaylistSection({ playlists = [] }) {
    const navigate = useNavigate();

    return (
        <section className="space-y-6">
            <SectionHeader
                title="Quick Playlists"
                subtitle="Jump back into your favorite collections."
                icon={ListMusic}
                actionText="View All"
                onAction={() => navigate("/playlists")}
            />

            {playlists.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-[30px] border border-dashed border-white/10 bg-white/5 py-20 backdrop-blur-3xl">
                    <FolderHeart size={56} className="text-violet-400" />
                    <h3 className="mt-5 text-2xl font-bold text-white">No Playlists Yet</h3>
                    <p className="mt-2 text-zinc-400">Create your first playlist to organize your music.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-5">
                    {playlists.slice(0, 6).map((playlist, index) => (
                        <motion.button
                            key={playlist.id}
                            whileHover={{ y: -6, scale: 1.02 }}
                            whileTap={{ scale: .98 }}
                            onClick={() => navigate("/playlists", { state: { selectedPlaylistId: playlist.id } })}
                            className="group overflow-hidden rounded-[28px] border border-white/10 bg-white/5 text-left backdrop-blur-3xl transition">

                            <div className="relative flex aspect-square items-center justify-center bg-gradient-to-br from-violet-600 via-fuchsia-500 to-cyan-500">
                                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,white,transparent_70%)]" />
                                <ListMusic size={64} className="text-white" />
                                <span className="absolute right-3 top-3 rounded-full bg-black/30 px-2 py-1 text-[10px] font-bold text-white">
                                    #{index + 1}
                                </span>
                            </div>

                            <div className="p-4">
                                <h3 className="truncate text-base font-bold text-white">{playlist.name}</h3>
                                <p className="mt-1 text-xs text-zinc-400">{playlist.mediaIds?.length || 0} Tracks</p>

                                <div className="mt-4 flex items-center justify-between">
                                    <span className="rounded-full bg-violet-500/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-violet-300">
                                        Playlist
                                    </span>

                                    <ArrowRight size={18} className="text-zinc-400 transition group-hover:translate-x-1 group-hover:text-white" />
                                </div>
                            </div>

                        </motion.button>
                    ))}
                </div>
            )}
        </section>
    );
}
