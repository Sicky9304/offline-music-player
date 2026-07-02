import { useState, useEffect } from 'react';
import { Search, ShieldAlert, Film, Music, Flame, AppWindow, Play } from 'lucide-react';
import { ipc } from '../../utils/ipc.js';
import { apiCache } from '../../utils/apiCache.js';
import { useToast } from '../ui/Toast.jsx';
import TrackRow from './TrackRow.jsx';

export default function OnlineSearch({ mode = 'youtube' }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const toast = useToast();

  const [trendingCharts, setTrendingCharts] = useState([]);
  const [categories, setCategories] = useState({ bollywood: [], english: [], bhojpuri: [] });
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Load default category playlists and top charts — cached per mode
  useEffect(() => {
    const loadCategories = async () => {
      setLoadingCategories(true);
      try {
        const searchFn =
          mode === 'youtube'
            ? ipc.online.searchYouTube
            : mode === 'saavn'
            ? ipc.online.searchSaavn
            : ipc.online.searchITunes;

        const [bolly, eng, bhoj, charts] = await Promise.all([
          apiCache.get(`categories:${mode}:bollywood`, () => searchFn('Bollywood hits'), 30),
          apiCache.get(`categories:${mode}:english`,   () => searchFn('English hits'),   30),
          apiCache.get(`categories:${mode}:bhojpuri`,  () => searchFn('Bhojpuri hits'),  30),
          apiCache.get('charts:itunes:top10',           () => ipc.online.getTopCharts(),  30),
        ]);
        setCategories({
          bollywood: (bolly || []).slice(0, 5),
          english:   (eng   || []).slice(0, 5),
          bhojpuri:  (bhoj  || []).slice(0, 5),
        });
        setTrendingCharts((charts || []).slice(0, 10));
      } catch (err) {
        console.error(`Error loading default ${mode} categories/charts:`, err);
      } finally {
        setLoadingCategories(false);
      }
    };

    // Seed immediately from cache to avoid blank flash
    const cachedBolly  = apiCache.peek(`categories:${mode}:bollywood`);
    const cachedEng    = apiCache.peek(`categories:${mode}:english`);
    const cachedBhoj   = apiCache.peek(`categories:${mode}:bhojpuri`);
    const cachedCharts = apiCache.peek('charts:itunes:top10');
    if (cachedBolly && cachedEng && cachedBhoj && cachedCharts) {
      setCategories({
        bollywood: cachedBolly.slice(0, 5),
        english:   cachedEng.slice(0, 5),
        bhojpuri:  cachedBhoj.slice(0, 5),
      });
      setTrendingCharts(cachedCharts.slice(0, 10));
      setLoadingCategories(false);
      return; // fully cached — skip network entirely
    }

    loadCategories();
  }, [mode]);

  // Instant search debounce effect
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      handleSearch(null, q);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query, mode]);

  const handleSearch = async (e, customQuery = null) => {
    if (e) e.preventDefault();
    const q = customQuery || query.trim();
    if (!q) return;

    setLoading(true);
    setHasSearched(true);
    try {
      console.log(`[Online Search: ${mode}] Searching for:`, q);
      const searchFn =
        mode === 'youtube'
          ? ipc.online.searchYouTube
          : mode === 'saavn'
          ? ipc.online.searchSaavn
          : ipc.online.searchITunes;
      const res = await searchFn(q);
      setResults(res || []);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to search ${mode === 'youtube' ? 'YouTube' : mode === 'saavn' ? 'JioSaavn' : 'iTunes'} music`);
    } finally {
      setLoading(false);
    }
  };

  const renderTrendingSection = (tracks) => (
    <div className="space-y-4 bg-white/[0.01] border border-white/5 p-4 xs:p-5 rounded-[24px]">
      <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
        <span className="text-purple-400"><Flame size={16} /></span>
        <h3 className="text-xs xs:text-sm font-black text-white uppercase tracking-wider font-display">🔥 Trending Charts</h3>
      </div>
      {tracks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tracks.map((track, idx) => (
            <TrackRow key={`charts-${track.id}-${idx}`} track={track} index={idx} />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center py-6 text-xs text-zinc-500 italic">
          No trending charts available
        </div>
      )}
    </div>
  );

  const renderCategorySection = (title, icon, tracks) => (
    <div className="space-y-3 bg-white/[0.01] border border-white/5 p-4 xs:p-5 rounded-[24px]">
      <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
        <span className="text-cyan-400">{icon}</span>
        <h3 className="text-xs xs:text-sm font-black text-white uppercase tracking-wider font-display">{title}</h3>
      </div>
      {tracks.length > 0 ? (
        <div className="space-y-1">
          {tracks.map((track, idx) => (
            <TrackRow key={`${title}-${track.id}-${idx}`} track={track} index={idx} />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center py-6 text-xs text-zinc-500 italic">
          No tracks available in this category
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Search Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <span className="text-[10px] font-black tracking-widest uppercase text-gradient">
            {mode === 'youtube' ? 'YouTube Catalog' : mode === 'saavn' ? 'JioSaavn Catalog' : 'iTunes Catalog'}
          </span>
          <h2 className="text-xl xs:text-2xl font-black text-white font-display mt-1">
            {mode === 'youtube' ? 'Search YouTube Music' : mode === 'saavn' ? 'Search JioSaavn Music' : 'Search iTunes Music'}
          </h2>
        </div>
        
        {/* Source Badge Status */}
        <div className="flex items-center gap-2">
          {mode === 'youtube' ? (
            <span className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 border border-red-500/20">
              <Play size={12} fill="currentColor" />
              YouTube Search Active
            </span>
          ) : mode === 'saavn' ? (
            <span className="flex items-center gap-1.5 rounded-full bg-purple-500/10 px-3 py-1.5 text-xs font-bold text-purple-400 border border-purple-500/20">
              <Flame size={12} />
              JioSaavn Search Active
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-3 py-1.5 text-xs font-bold text-cyan-400 border border-cyan-500/20">
              <AppWindow size={12} />
              iTunes Search Active
            </span>
          )}
        </div>
      </div>

      {/* Search Bar Form */}
      <form onSubmit={(e) => handleSearch(e)} className="flex gap-2 xs:gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
            <Search size={16} />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${mode === 'youtube' ? 'YouTube' : mode === 'saavn' ? 'JioSaavn' : 'iTunes'}...`}
            className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-xs xs:text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50 focus:bg-white/[0.06] transition-all duration-300 font-semibold"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 xs:px-6 py-3 rounded-2xl text-xs font-bold text-white transition-all hover:opacity-90 active:scale-95 gradient-button flex items-center gap-2 flex-shrink-0"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
          ) : (
            <>
              <Search size={14} className="block xs:hidden" />
              <span className="hidden xs:inline">Search</span>
            </>
          )}
        </button>
      </form>

      {/* Main content display */}
      <div className="space-y-6">
        {query.trim() === "" ? (
          /* Show default categories when search input is empty */
          loadingCategories ? (
            <div className="grid grid-cols-1 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="space-y-3 bg-white/[0.01] border border-white/5 p-4 xs:p-5 rounded-[24px] animate-pulse">
                  <div className="h-4 bg-white/10 rounded w-1/4 mb-4" />
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-12 bg-white/5 rounded-2xl" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {renderTrendingSection(trendingCharts)}
              <div className="grid grid-cols-1 gap-6">
                {renderCategorySection("🎬 Bollywood Hits", <Film size={16} />, categories.bollywood)}
                {renderCategorySection("🎵 English Hits", <Music size={16} />, categories.english)}
                {renderCategorySection("🌾 Bhojpuri Hits", <Flame size={16} />, categories.bhojpuri)}
              </div>
            </div>
          )
        ) : (
          /* Show search results */
          loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-2 border-t-transparent border-white rounded-full animate-spin" style={{ borderColor: 'var(--accent)' }} />
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-1 bg-white/[0.01] border border-white/5 p-4 xs:p-5 rounded-[24px]">
              <div className="flex items-center gap-2 border-b border-white/5 pb-2 mb-3">
                <Search size={14} className="text-cyan-400" />
                <h3 className="text-xs font-black text-white uppercase tracking-wider font-display">Search Results</h3>
              </div>
              {results.map((track, index) => (
                <TrackRow key={track.id} track={track} index={index} />
              ))}
            </div>
          ) : hasSearched ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-500 space-y-3">
              <ShieldAlert size={36} className="text-zinc-600" />
              <div>
                <p className="text-sm font-bold text-white">No results found</p>
                <p className="text-xs text-zinc-400 mt-1">Try a different search query.</p>
              </div>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}
