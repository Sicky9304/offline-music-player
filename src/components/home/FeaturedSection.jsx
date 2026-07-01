import { useState } from "react";
import { motion } from "framer-motion";
import { Play, ChevronRight, Sparkles } from "lucide-react";
import GlassButton from "../ui/GlassButton";

export default function FeaturedSection({
  featuredTracks = [],
  currentFeatured,
  continueTrack,
  carouselIndex = 0,
  nextCarousel,
  playMedia,
  setQueue,
  setQueueIndex
}) {
  const [isPosterHovered, setIsPosterHovered] = useState(false);

  const playFeatured = () => {
    if (!currentFeatured) return;
    setQueue(featuredTracks);
    setQueueIndex(carouselIndex);
    playMedia(currentFeatured);
  };

  return (
    <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">

      {/* Left Card: Featured Release */}
      <motion.div
        whileHover={{ y: -4 }}
        className="xl:col-span-7 relative overflow-hidden rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-3xl p-6 md:p-8 flex flex-col justify-between min-h-[480px]"
      >
        {/* Background ambient cover art blur */}
        {currentFeatured?.thumbnail && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-[0.08] blur-3xl scale-125 transition-all duration-700 pointer-events-none"
            style={{ backgroundImage: `url(${currentFeatured.thumbnail})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-fuchsia-500/5 to-cyan-500/10 pointer-events-none" />

        <div className="relative z-10 flex h-full flex-col justify-between gap-6">
          {/* Top Row: Label and Carousel Navigation */}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-3.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-violet-300">
              <Sparkles size={11} className="animate-pulse" />
              Featured Release
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 font-medium">
                {carouselIndex + 1} / {Math.min(featuredTracks.length, 5)}
              </span>
              <button
                onClick={nextCarousel}
                className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-white hover:bg-white/10 transition duration-200 active:scale-95"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Middle Row: Vinyl Animation and Track Details */}
          <div className="flex flex-col md:flex-row items-center gap-12 my-auto">
            {/* Vinyl & Cover Wrapper */}
            <div
              className="relative w-48 h-48 flex-shrink-0 cursor-pointer group"
              onMouseEnter={() => setIsPosterHovered(true)}
              onMouseLeave={() => setIsPosterHovered(false)}
              onClick={playFeatured}
            >
              {/* Vinyl Disc */}
              <div
                className={`absolute top-2 w-44 h-44 rounded-full bg-[radial-gradient(circle,_#18181b_20%,_#09090b_50%,_#000000_100%)] border border-zinc-800 shadow-2xl flex items-center justify-center transition-all duration-500 ease-out ${
                  isPosterHovered ? "translate-x-12 rotate-[360deg]" : "translate-x-0 rotate-0"
                }`}
                style={{
                  animation: isPosterHovered ? "spin 4s linear infinite" : "none",
                  animationDelay: "0.35s"
                }}
              >
                {/* Vinyl grooves */}
                <div className="absolute inset-2 rounded-full border border-zinc-800/30" />
                <div className="absolute inset-5 rounded-full border border-zinc-800/20" />
                <div className="absolute inset-8 rounded-full border border-zinc-800/20" />
                {/* Inner vinyl label */}
                <div
                  className="w-14 h-14 rounded-full bg-cover bg-center border border-zinc-700/50 flex-shrink-0"
                  style={{ backgroundImage: `url(${currentFeatured?.thumbnail})` }}
                >
                  {!currentFeatured?.thumbnail && (
                    <div className="flex h-full w-full items-center justify-center bg-violet-600/80 text-[10px] text-white font-bold">
                      MUSIC
                    </div>
                  )}
                </div>
                {/* Center hole */}
                <div className="absolute w-2.5 h-2.5 rounded-full bg-zinc-950 border border-zinc-800" />
              </div>

              {/* Cover Art Wrapper */}
              <div className="relative z-10 w-48 h-48 overflow-hidden rounded-2xl border border-white/10 shadow-2xl bg-zinc-900 transition-transform duration-300 group-hover:scale-102">
                {currentFeatured?.thumbnail ? (
                  <img src={currentFeatured.thumbnail} alt="" className="h-full w-full object-cover select-none" />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-violet-600 via-fuchsia-500 to-cyan-500 text-6xl">
                    🎵
                  </div>
                )}
                <div className="absolute inset-0 bg-black/15 hover:bg-black/0 transition duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="h-12 w-12 rounded-full bg-white/90 flex items-center justify-center text-black shadow-lg">
                    <Play size={20} fill="black" className="ml-1" />
                  </div>
                </div>
              </div>
            </div>

            {/* Title, Artist, Album, Actions */}
            <div className="flex-1 text-center md:text-left space-y-4">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tight leading-tight line-clamp-1 hover:text-cyan-300 transition cursor-pointer" onClick={playFeatured}>
                  {currentFeatured?.title || "No Track Available"}
                </h2>
                <p className="mt-1.5 text-zinc-300 text-base font-semibold">
                  {currentFeatured?.artist || "Unknown Artist"}
                </p>
                {currentFeatured?.album && (
                  <p className="mt-0.5 text-zinc-500 text-xs font-medium">
                    Album: {currentFeatured.album}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
                <GlassButton
                  onClick={playFeatured}
                  variant="primary"
                  leftIcon={<Play size={16} fill="white" />}
                  className="px-6 py-3 rounded-xl font-bold shadow-lg"
                >
                  Play Now
                </GlassButton>
              </div>
            </div>
          </div>

          {/* Bottom Row: Additional Tracks */}
          <div className="border-t border-white/5 pt-4">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Up Next in Featured</p>
            <div className="grid grid-cols-3 gap-3">
              {featuredTracks.slice(0, 3).map((track) => {
                const isActive = track.id === currentFeatured?.id;
                return (
                  <button
                    key={track.id}
                    onClick={() => playMedia(track)}
                    className={`group/btn rounded-xl border p-3 text-left transition duration-200 ${
                      isActive
                        ? "border-violet-500/40 bg-violet-500/10"
                        : "border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/10"
                    }`}
                  >
                    <p className={`truncate text-xs font-bold transition group-hover/btn:text-white ${isActive ? "text-violet-300" : "text-zinc-300"}`}>
                      {track.title}
                    </p>
                    <p className="truncate text-[10px] text-zinc-500 mt-0.5">{track.artist || "Unknown Artist"}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Right Card: Continue Listening */}
      <motion.div
        whileHover={{ y: -4 }}
        className="xl:col-span-5 rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-3xl flex flex-col justify-between min-h-[480px]"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">Continue Listening</p>

          {continueTrack ? (
            <div className="mt-5">
              <div className="overflow-hidden rounded-2xl border border-white/10 aspect-video xl:aspect-[1.5/1] w-full shadow-lg bg-zinc-900 relative group cursor-pointer" onClick={() => playMedia(continueTrack)}>
                {continueTrack.thumbnail ? (
                  <img src={continueTrack.thumbnail} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-600 via-fuchsia-500 to-cyan-500 text-5xl">🎧</div>
                )}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition duration-300 flex items-center justify-center">
                  <div className="h-12 w-12 rounded-full bg-white/95 flex items-center justify-center text-black shadow-lg scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300">
                    <Play size={20} fill="black" className="ml-1" />
                  </div>
                </div>
              </div>
              <h3 className="mt-4 text-xl font-bold text-white truncate">{continueTrack.title}</h3>
              <p className="mt-1 text-sm text-zinc-400 truncate">{continueTrack.artist || "Unknown Artist"}</p>
            </div>
          ) : (
            <div className="mt-16 flex flex-col items-center justify-center text-center">
              <div className="text-6xl">🎼</div>
              <h3 className="mt-4 text-lg font-bold text-white">Nothing Yet</h3>
              <p className="mt-1 text-xs text-zinc-400">Play your first track to build listening history.</p>
            </div>
          )}
        </div>

        {continueTrack && (
          <GlassButton
            onClick={() => playMedia(continueTrack)}
            variant="secondary"
            leftIcon={<Play size={16} fill="white" />}
            className="w-full py-3 rounded-xl font-bold mt-4 border border-white/10 hover:bg-white/10"
          >
            Resume Playback
          </GlassButton>
        )}
      </motion.div>

    </section>
  );
}
