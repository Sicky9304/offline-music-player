import { useState } from 'react';
import { AppWindow, Flame, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import OnlineSearch from '../components/online/OnlineSearch.jsx';

export default function OnlineHub() {
  const [activeTab, setActiveTab] = useState('youtube'); // 'youtube' | 'saavn' | 'itunes'

  return (
    <motion.main
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="h-full overflow-y-auto"
    >
      <div className="mx-auto w-full max-w-[1750px] px-5 py-8 md:px-8 xl:px-12 2xl:px-16 pb-40 space-y-6">

        {/* Sub-tab navigation selectors */}
        <div className="flex flex-wrap items-center gap-3 bg-white/[0.02] border border-white/5 p-1.5 rounded-2xl w-fit select-none">
          <button
            onClick={() => setActiveTab('youtube')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all duration-300 ${activeTab === 'youtube'
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <Play size={12} fill="currentColor" />
            YouTube Search
          </button>

          <button
            onClick={() => setActiveTab('saavn')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all duration-300 ${activeTab === 'saavn'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <Flame size={14} />
            JioSaavn Search
          </button>

          <button
            onClick={() => setActiveTab('itunes')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all duration-300 ${activeTab === 'itunes'
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <AppWindow size={14} />
            iTunes Search
          </button>
        </div>

        {/* Tab content area */}
        <div className="mt-4">
          <AnimatePresence mode="wait">
            {activeTab === 'youtube' ? (
              <motion.div
                key="youtube-view"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.25 }}
              >
                <div className="space-y-8">
                  {/* YouTube Banner Header */}
                  <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-3xl">
                    {/* Glows */}
                    <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-red-500/10 blur-[120px] pointer-events-none" />
                    <div className="absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-orange-600/10 blur-[120px] pointer-events-none" />

                    <div className="relative z-10 flex flex-col sm:flex-row gap-6 items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 shadow-xl shadow-red-500/20">
                          <Play size={28} className="text-white" fill="currentColor" />
                        </div>
                        <div>
                          <span className="text-xs font-black uppercase tracking-[0.25em] text-red-400">
                            Free Streaming Catalog
                          </span>
                          <h1 className="mt-1.5 text-2xl font-black text-white md:text-3xl font-display">
                            YouTube Music Search
                          </h1>
                          <p className="text-xs text-zinc-400 mt-1 font-semibold">
                            Direct, keyless YouTube media catalog. Stream the largest database of releases instantly.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <OnlineSearch mode="youtube" />
                </div>
              </motion.div>
            ) : activeTab === 'saavn' ? (
              <motion.div
                key="saavn-view"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.25 }}
              >
                <div className="space-y-8">
                  {/* JioSaavn Banner Header */}
                  <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-3xl">
                    <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

                    <div className="relative z-10 flex flex-col sm:flex-row gap-6 items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-xl shadow-purple-500/20">
                          <Flame size={28} className="text-white" />
                        </div>
                        <div>
                          <span className="text-xs font-black uppercase tracking-[0.25em] text-purple-400">
                            Free Indian & Global Search
                          </span>
                          <h1 className="mt-1.5 text-2xl font-black text-white md:text-3xl font-display">
                            JioSaavn Music Search
                          </h1>
                          <p className="text-xs text-zinc-400 mt-1 font-semibold">
                            No credentials required. Search the official JioSaavn catalog and play any song instantly.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <OnlineSearch mode="saavn" />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="itunes-view"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.25 }}
              >
                <div className="space-y-8">
                  {/* iTunes Banner Header */}
                  <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-3xl">
                    <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />

                    <div className="relative z-10 flex flex-col sm:flex-row gap-6 items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-500 shadow-xl shadow-cyan-400/20">
                          <AppWindow size={28} className="text-white" />
                        </div>
                        <div>
                          <span className="text-xs font-black uppercase tracking-[0.25em] text-cyan-400">
                            Free Search Hub
                          </span>
                          <h1 className="mt-1.5 text-2xl font-black text-white md:text-3xl font-display">
                            iTunes Music Search
                          </h1>
                          <p className="text-xs text-zinc-400 mt-1 font-semibold">
                            No credentials required. Search and play any song instantly.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <OnlineSearch mode="itunes" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </motion.main>
  );
}
