import { useLibrary } from '../hooks/useLibrary.jsx';
import MediaCard from '../components/player/MediaCard.jsx';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import SectionHeader from '../components/ui/SectionHeader.jsx';

export default function Favorites() {
  const { favorites } = useLibrary();

  return (
    <div className="flex flex-col h-full page-enter">
      {/* Header bar */}
      <div className="flex-shrink-0 px-6 py-5 border-b" style={{ borderColor: 'var(--glass-border)' }}>
        <SectionHeader
          title="Favorites"
          subtitle={`${favorites.length} liked songs`}
          badge="Collections"
          icon={Heart}
        />
      </div>

      {/* Grid listing */}
      <div className="flex-1 overflow-y-auto p-6">
        {favorites.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="flex flex-col items-center justify-center h-64 text-center space-y-3"
          >
            <div className="w-16 h-16 rounded-full bg-rose-500/5 border border-rose-500/10 flex items-center justify-center text-rose-400 shadow-inner">
              <Heart size={28} />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-white">No favorites yet</h2>
              <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
                Tap the heart button on any audio or video card to group them here for quick access.
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-1">
            {favorites.map((m, i) => (
              <MediaCard key={m.id} media={m} queue={favorites} index={i} compact />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
