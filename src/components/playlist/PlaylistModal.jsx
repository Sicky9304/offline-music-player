import { ListMusic, Plus } from 'lucide-react';
import { useState } from 'react';
import { useLibrary } from '../../hooks/useLibrary.jsx';
import { useToast } from '../ui/Toast.jsx';
import Modal from '../ui/Modal.jsx';

export default function PlaylistModal({ open, onClose, mediaToAdd = null }) {
  const { playlists, createPlaylist, addToPlaylist } = useLibrary();
  const toast = useToast();
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleAdd = async (playlist) => {
    if (!mediaToAdd) return;
    await addToPlaylist(playlist.id, mediaToAdd.id);
    toast.success(`Added to "${playlist.name}"`);
    onClose();
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const pl = await createPlaylist(newName.trim());
    if (mediaToAdd) await addToPlaylist(pl.id, mediaToAdd.id);
    toast.success(`Playlist "${pl.name}" created`);
    setNewName('');
    setCreating(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={mediaToAdd ? `Add to Playlist` : 'Playlists'} size="sm">
      {mediaToAdd && (
        <p className="text-xs font-semibold mb-4 truncate text-zinc-400">
          Adding: <strong className="text-white">{mediaToAdd.title}</strong>
        </p>
      )}

      {/* Existing playlists */}
      <div className="flex flex-col gap-1.5 mb-4 max-h-56 overflow-y-auto pr-1">
        {playlists.length === 0 && (
          <p className="text-xs text-center py-6 text-zinc-500 font-medium">No playlists yet</p>
        )}
        {playlists.map(pl => (
          <button
            key={pl.id}
            id={`add-to-pl-${pl.id}`}
            onClick={() => handleAdd(pl)}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all duration-200 hover:bg-white/5 border border-transparent hover:border-white/5"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent)', opacity: 0.9 }}>
              <ListMusic size={14} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate text-white">{pl.name}</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">{pl.mediaIds?.length || 0} tracks</p>
            </div>
          </button>
        ))}
      </div>

      {/* Create new */}
      {creating ? (
        <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
          <input
            id="new-playlist-name"
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="Playlist name…"
            className="glass-input"
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setCreating(false)}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white glass-button"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className="px-4 py-2 rounded-xl text-xs font-semibold gradient-button"
            >
              Create
            </button>
          </div>
        </div>
      ) : (
        <button
          id="create-playlist-btn"
          onClick={() => setCreating(true)}
          className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-xl border-dashed border border-white/10 text-xs font-bold transition-all duration-200 hover:bg-white/5 text-zinc-300 hover:text-white"
        >
          <Plus size={14} />
          New Playlist
        </button>
      )}
    </Modal>
  );
}
