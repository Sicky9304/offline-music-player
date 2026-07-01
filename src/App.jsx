import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import TitleBar      from './components/TitleBar.jsx';
import Sidebar       from './components/Sidebar.jsx';
import MiniPlayer    from './components/MiniPlayer.jsx';
import NowPlaying    from './components/NowPlaying.jsx';
import ToastContainer from './components/Toast.jsx';
import DropZone      from './components/DropZone.jsx';

import Home      from './pages/Home.jsx';
import Library   from './pages/Library.jsx';
import Videos    from './pages/Videos.jsx';
import Music     from './pages/Music.jsx';
import Playlists from './pages/Playlists.jsx';
import Favorites from './pages/Favorites.jsx';
import History   from './pages/History.jsx';
import Settings  from './pages/Settings.jsx';
import Themes    from './pages/Themes.jsx';
import Profile   from './pages/Profile.jsx';

import { usePlayer } from './hooks/usePlayer.jsx';
import { useLibrary } from './hooks/useLibrary.jsx';

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { currentMedia } = usePlayer();
  const { dbStatus } = useLibrary();

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
            className="flex items-center justify-center gap-2 text-xs py-1.5 px-4 font-medium"
            style={{ background: '#b45309', color: 'white' }}
          >
            ⚠️ MongoDB not connected — data will not be saved. Make sure MongoDB is running at localhost:27017
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(p => !p)} />

        {/* Content area */}
        <main className="flex-1 overflow-hidden flex flex-col" style={{ background: 'var(--bg-primary)' }}>
          <div className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/"          element={<Navigate to="/home" replace />} />
              <Route path="/home"      element={<Home />} />
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
