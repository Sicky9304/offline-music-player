import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  Library, Video, Music, ListMusic, Heart, History,
  Settings, Palette, User, ChevronLeft, ChevronRight,
  Database, Wifi, WifiOff,
} from 'lucide-react';
import { useLibrary } from '../hooks/useLibrary.jsx';
import EqualizerBars from './EqualizerBars.jsx';
import { usePlayer } from '../hooks/usePlayer.jsx';
import ThreeDArtwork from './ThreeDArtwork.jsx';

const NAV_ITEMS = [
  { to: '/library',   icon: Library,   label: 'Library'   },
  { to: '/videos',    icon: Video,     label: 'Videos'    },
  { to: '/music',     icon: Music,     label: 'Music'     },
  { to: '/playlists', icon: ListMusic, label: 'Playlists' },
  { to: '/favorites', icon: Heart,     label: 'Favorites' },
  { to: '/history',   icon: History,   label: 'History'   },
];

const SETTINGS_ITEMS = [
  { to: '/themes',   icon: Palette,  label: 'Themes'   },
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/profile',  icon: User,     label: 'Profile'  },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { dbStatus, library } = useLibrary();
  const { currentMedia, isPlaying } = usePlayer();
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [currentMedia?.id]);

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 220 }}
      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
      className="flex flex-col h-full border-r flex-shrink-0 overflow-hidden"
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
    >
      {/* Toggle */}
      <div className="flex items-center justify-between px-4 py-3">
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              Menu
            </span>
          </motion.div>
        )}
        <button
          id="sidebar-toggle"
          onClick={onToggle}
          className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors ml-auto`}
          style={{ color: 'var(--text-muted)' }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Now playing indicator */}
      {currentMedia && (
        <div className="px-3 mb-2">
          <motion.div
            layout
            className="flex items-center gap-2.5 px-2 py-2 rounded-xl"
            style={{ background: 'var(--bg-tertiary)' }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
              style={{ background: 'var(--accent)', opacity: 0.85 }}>
              {currentMedia.thumbnail && !imgError
                ? <img src={currentMedia.thumbnail} alt="" className="w-full h-full object-cover" onError={() => setImgError(true)} />
                : currentMedia.type === 'audio'
                  ? <ThreeDArtwork title={currentMedia.title} id={currentMedia.id} isCompact />
                  : <Music size={16} className="text-white" />
              }
            </div>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {currentMedia.title}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <EqualizerBars isPlaying={isPlaying} bars={4} />
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <SidebarItem key={to} to={to} icon={Icon} label={label} collapsed={collapsed} />
        ))}

        <div className="my-3 border-t" style={{ borderColor: 'var(--border)' }} />

        {SETTINGS_ITEMS.map(({ to, icon: Icon, label }) => (
          <SidebarItem key={to} to={to} icon={Icon} label={label} collapsed={collapsed} />
        ))}
      </nav>

      {/* DB Status footer */}
      <div className="px-3 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg">
          {dbStatus.connected
            ? <Database size={14} className="text-green-400 flex-shrink-0" />
            : <WifiOff  size={14} className="text-red-400 flex-shrink-0" />
          }
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="text-xs font-medium" style={{ color: dbStatus.connected ? '#4ade80' : '#f87171' }}>
                {dbStatus.connected ? 'MongoDB' : 'DB Offline'}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {library.length} items
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.aside>
  );
}

function SidebarItem({ to, icon: Icon, label, collapsed }) {
  return (
    <NavLink
      to={to}
      id={`nav-${label.toLowerCase()}`}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
          isActive ? 'text-white shadow-sm' : 'hover:bg-white/8'
        }`
      }
      style={({ isActive }) => ({
        background: isActive ? 'var(--accent)' : 'transparent',
        color: isActive ? 'white' : 'var(--text-secondary)',
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
