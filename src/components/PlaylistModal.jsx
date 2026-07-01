import { useState } from 'react';
import Modal from './Modal.jsx';
import { useLibrary } from '../hooks/useLibrary.jsx';
import { useToast } from './Toast.jsx';
import { Plus, ListMusic } from 'lucide-react';

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
        <p className="text-sm mb-4 truncate" style={{ color: 'var(--text-secondary)' }}>
          Adding: <strong style={{ color: 'var(--text-primary)' }}>{mediaToAdd.title}</strong>
        </p>
      )}

      {/* Existing playlists */}
      <div className="flex flex-col gap-1 mb-4 max-h-56 overflow-y-auto">
        {playlists.length === 0 && (
          <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>No playlists yet</p>
        )}
        {playlists.map(pl => (
          <button
            key={pl.id}
            id={`add-to-pl-${pl.id}`}
            onClick={() => handleAdd(pl)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all hover:bg-white/10"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent)', opacity: 0.9 }}>
              <ListMusic size={14} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{pl.name}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{pl.mediaIds?.length || 0} tracks</p>
            </div>
          </button>
        ))}
      </div>

      {/* Create new */}
      {creating ? (
        <div className="flex gap-2">
          <input
            id="new-playlist-name"
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="Playlist name…"
            className="flex-1 px-3 py-2 rounded-xl text-sm outline-none border"
            style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
          <button onClick={handleCreate} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'var(--accent)' }}>
            Create
          </button>
          <button onClick={() => setCreating(false)} className="px-3 py-2 rounded-xl text-sm" style={{ color: 'var(--text-muted)', background: 'var(--bg-tertiary)' }}>
            Cancel
          </button>
        </div>
      ) : (
        <button
          id="create-playlist-btn"
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl border-dashed border text-sm font-medium transition-all hover:bg-white/5"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
        >
          <Plus size={16} />
          New Playlist
        </button>
      )}
    </Modal>
  );
}
