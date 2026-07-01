import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  Library, Video, Music, ListMusic, Heart, History,
  Settings, Palette, User, ChevronLeft, ChevronRight,
  Database, WifiOff, Home as HomeIcon, Search, Compass,
  AudioLines
} from 'lucide-react';
import { useLibrary } from '../../hooks/useLibrary.jsx';
import EqualizerBars from '../player/EqualizerBars.jsx';
import { usePlayer } from '../../hooks/usePlayer.jsx';
import { useProfile } from '../../hooks/useProfile.jsx';
import ThreeDArtwork from '../player/ThreeDArtwork.jsx';
import { getInitials } from '../../utils/formatters.js';

const DISCOVER_ITEMS = [
  { to: '/home',      icon: HomeIcon, label: 'Home' },
  { to: '/library',   icon: Compass,  label: 'Browse' },
  { to: '/music',     icon: Search,   label: 'Search' }
];

const LIBRARY_ITEMS = [
  { to: '/music',     icon: Music,     label: 'Music' },
  { to: '/videos',    icon: Video,     label: 'Videos' },
];

const COLLECTIONS_ITEMS = [
  { to: '/playlists', icon: ListMusic, label: 'Playlists' },
  { to: '/favorites', icon: Heart,     label: 'Favorites' },
  { to: '/history',   icon: History,   label: 'History' }
];

const GENERAL_ITEMS = [
  { to: '/themes',    icon: Palette,  label: 'Themes' },
  { to: '/settings',  icon: Settings, label: 'Settings' },
  { to: '/profile',   icon: User,     label: 'Profile' }
];

export default function Sidebar({ collapsed, onToggle }) {
  const { dbStatus, library } = useLibrary();
  const { currentMedia, isPlaying } = usePlayer();
  const { profile } = useProfile();
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [currentMedia?.id]);

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 240 }}
      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
      className="flex flex-col h-full flex-shrink-0 overflow-hidden glass-surface"
      style={{ borderRight: '1px solid var(--glass-border)' }}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-4 py-4">
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent)' }}>
              <AudioLines size={16} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold font-brand truncate" style={{ color: 'var(--text-primary)' }}>
                Music Hub
              </h1>
              <p className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Player
              </p>
            </div>
          </motion.div>
        )}
        {collapsed && (
          <div className="hidden w-6 h-6 rounded-xl flex items-center justify-center mx-auto" style={{ background: 'var(--accent)' }}>
            <AudioLines size={25} className="text-white" />
          </div>
        )}
        <button
          id="sidebar-toggle"
          onClick={onToggle}
          className="p-2 rounded-lg glass-button ml-auto flex-shrink-0"
          style={{ color: 'var(--text-muted)' }}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Now playing indicator */}
      {currentMedia && (
        <div className="px-3 mb-2">
          <motion.div
            layout
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl glass-card"
            style={{ cursor: 'pointer' }}
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
              style={{ background: 'var(--accent)', opacity: 0.9 }}>
              {currentMedia.thumbnail && !imgError
                ? <img src={currentMedia.thumbnail} alt="" className="w-full h-full object-cover" onError={() => setImgError(true)} />
                : currentMedia.type === 'audio'
                  ? <ThreeDArtwork title={currentMedia.title} id={currentMedia.id} isCompact />
                  : <Music size={16} className="text-white" />
              }
            </div>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                  {currentMedia.title}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <EqualizerBars isPlaying={isPlaying} bars={4} />
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    {currentMedia.artist || 'Unknown'}
                  </span>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 px-3 space-y-5 overflow-y-auto mt-1 pb-2">
        <NavGroup title="Discover" items={DISCOVER_ITEMS} collapsed={collapsed} />
        <NavGroup title="Library" items={LIBRARY_ITEMS} collapsed={collapsed} />
        <NavGroup title="Collections" items={COLLECTIONS_ITEMS} collapsed={collapsed} />
        <NavGroup title="General" items={GENERAL_ITEMS} collapsed={collapsed} />
      </nav>

      {/* User profile + DB status footer */}
      <div className="px-3 py-3 space-y-2" style={{ borderTop: '1px solid var(--glass-border)' }}>
        {/* User profile mini */}
        {!collapsed && (
          <NavLink to="/profile" className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-white/5 transition-colors">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-400))' }}>
              {profile.avatar
                ? <img src={profile.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                : getInitials(profile.name)
              }
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold font-brand truncate" style={{ color: 'var(--text-primary)' }}>
                {profile.name || 'User'}
              </p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {library.length} tracks
              </p>
            </div>
          </NavLink>
        )}

        {/* DB Status */}
        <div className="flex items-center gap-2 px-2 py-1">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dbStatus.connected ? 'bg-emerald-400' : 'bg-red-400'}`} />
          {!collapsed && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-[10px] font-medium"
              style={{ color: dbStatus.connected ? '#4ade80' : '#f87171' }}
            >
              {dbStatus.connected ? 'Connected' : 'DB Offline'}
            </motion.span>
          )}
        </div>
      </div>
    </motion.aside>
  );
}

function NavGroup({ title, items, collapsed }) {
  return (
    <div>
      {!collapsed && (
        <p className="text-[10px] font-black tracking-widest uppercase px-3 mb-1.5" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
          {title}
        </p>
      )}
      <div className="space-y-0.5">
        {items.map(({ to, icon: Icon, label }) => (
          <SidebarItem key={`${to}-${label}`} to={to} icon={Icon} label={label} collapsed={collapsed} />
        ))}
      </div>
    </div>
  );
}

function SidebarItem({ to, icon: Icon, label, collapsed }) {
  return (
    <NavLink
      to={to}
      id={`nav-${label.toLowerCase()}`}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
          isActive ? 'text-white shadow-lg' : 'hover:bg-white/5'
        }`
      }
      style={({ isActive }) => ({
        background: isActive ? 'linear-gradient(135deg, var(--accent), var(--accent-400))' : 'transparent',
        color: isActive ? 'white' : 'var(--text-secondary)',
        boxShadow: isActive ? '0 4px 16px rgba(var(--accent-hsl) / 0.3)' : 'none',
      })}
    >
      <Icon size={18} className="flex-shrink-0" />
      {!collapsed && (
        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="truncate">
          {label}
        </motion.span>
      )}
    </NavLink>
  );
}
