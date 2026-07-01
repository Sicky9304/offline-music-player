import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import TitleBar      from './components/layout/TitleBar.jsx';
import Sidebar       from './components/layout/Sidebar.jsx';
import MiniPlayer    from './components/player/MiniPlayer.jsx';
import NowPlaying    from './components/player/NowPlaying.jsx';
import ToastContainer from './components/ui/Toast.jsx';
import DropZone      from './components/ui/DropZone.jsx';

// Static imports to prevent Vite + Electron hash router chunk loading bugs
import Home        from './pages/Home.jsx';
import Library     from './pages/Library.jsx';
import Videos      from './pages/Videos.jsx';
import Music       from './pages/Music.jsx';
import Playlists   from './pages/Playlists.jsx';
import Favorites   from './pages/Favorites.jsx';
import History     from './pages/History.jsx';
import Settings    from './pages/Settings.jsx';
import Themes      from './pages/Themes.jsx';
import Profile     from './pages/Profile.jsx';
import VideoPlayer from './pages/VideoPlayer.jsx';

import { usePlayer } from './hooks/usePlayer.jsx';
import { useLibrary } from './hooks/useLibrary.jsx';
import { useDynamicTheme } from './hooks/useDynamicTheme.jsx';

export default function App() {
  const location = useLocation();
  const isVideoPlayerRoute = location.pathname === '/video-player';

  // Activate dynamic album-art theming
  useDynamicTheme();

  if (isVideoPlayerRoute) {
    return (
      <Routes>
        <Route path="/video-player" element={<VideoPlayer />} />
      </Routes>
    );
  }

  // Responsive sidebar auto-collapse state (collapsed by default on screens < 1024px)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1024);
  const { currentMedia } = usePlayer();
  const { dbStatus } = useLibrary();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <DropZone className="flex flex-col h-screen w-screen overflow-hidden">
      {/* Custom title bar */}
      <TitleBar />

      {/* DB offline banner */}
      <AnimatePresence>
        {!dbStatus.connected && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex items-center justify-center gap-2 text-xs py-1.5 px-4 font-medium glass-surface z-50"
            style={{ color: '#fbbf24' }}
          >
            ⚠️ MongoDB not connected — data will not be saved
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Ambient background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="ambient-orb ambient-orb-1" style={{ top: '10%', left: '60%' }} />
          <div className="ambient-orb ambient-orb-2" style={{ top: '60%', left: '20%' }} />
          <div className="ambient-orb ambient-orb-3" style={{ top: '30%', left: '80%' }} />
        </div>

        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(p => !p)} />

        {/* Content area */}
        <main className="flex-1 overflow-hidden flex flex-col relative z-10 animate-fade-in" style={{ background: 'var(--bg-primary)' }}>
          <div className="flex-1 overflow-y-auto h-full">
            <Routes>
              <Route path="/"          element={<Navigate to="/home" replace />} />
              <Route path="/home"      element={<Home />} />
              <Route path="/video-player" element={<VideoPlayer />} />
              <Route path="/library"   element={<Library />} />
              <Route path="/videos"    element={<Videos />} />
              <Route path="/music"     element={<Music />} />
              <Route path="/playlists" element={<Playlists />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/history"   element={<History />} />
              <Route path="/settings"  element={<Settings />} />
              <Route path="/themes"    element={<Themes />} />
              <Route path="/profile"   element={<Profile />} />
            </Routes>
          </div>

          {/* Mini player */}
          <AnimatePresence>
            {currentMedia && <MiniPlayer />}
          </AnimatePresence>
        </main>
      </div>

      {/* Overlays */}
      <NowPlaying />
      <ToastContainer />
    </DropZone>
  );
}
