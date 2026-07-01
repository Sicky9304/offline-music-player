import { useLibrary } from '../hooks/useLibrary.jsx';
import MediaCard from '../components/MediaCard.jsx';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Favorites() {
  const { favorites } = useLibrary();

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-6 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3 mb-1">
          <Heart size={24} className="text-rose-400" fill="currentColor" />
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>Favorites</h1>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{favorites.length} items</p>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {favorites.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-48 text-center">
            <Heart size={48} className="mb-3 text-rose-400" />
            <p className="text-lg font-semibold" style={{ color: 'var(--text-secondary)' }}>No favorites yet</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Click the heart on any track to add it here</p>
          </motion.div>
        ) : (
          <div className="space-y-1">
            {favorites.map((m, i) => <MediaCard key={m.id} media={m} queue={favorites} index={i} compact />)}
          </div>
        )}
      </div>
    </div>
  );
}
