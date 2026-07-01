import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ListMusic, Pencil, Trash2, Play, ChevronRight } from 'lucide-react';
import { useLibrary } from '../hooks/useLibrary.jsx';
import { usePlayer } from '../hooks/usePlayer.jsx';
import { useToast } from '../components/Toast.jsx';
import MediaCard from '../components/MediaCard.jsx';
import Modal from '../components/Modal.jsx';

export default function Playlists() {
  const { playlists, library, createPlaylist, updatePlaylist, deletePlaylist, removeFromPlaylist } = useLibrary();
  const { playMedia } = usePlayer();
  const toast = useToast();
  const [selected, setSelected] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [createModal, setCreateModal] = useState(false);
  const [newName, setNewName] = useState('');

  const selectedPlaylist = playlists.find(p => p.id === selected);
  const selectedTracks = selectedPlaylist
    ? selectedPlaylist.mediaIds.map(id => library.find(m => m.id === id)).filter(Boolean)
    : [];

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createPlaylist(newName.trim());
    toast.success(`Playlist "${newName.trim()}" created`);
    setNewName('');
    setCreateModal(false);
  };

  const handleDelete = async (id, name) => {
    await deletePlaylist(id);
    toast.success(`Deleted "${name}"`);
    if (selected === id) setSelected(null);
  };

  const handleRename = async () => {
    if (!editModal?.name.trim()) return;
    await updatePlaylist(editModal.id, { name: editModal.name });
    toast.success('Playlist renamed');
    setEditModal(null);
  };

  return (
    <div className="flex h-full">
      {/* Playlist list */}
      <div className="w-72 flex-shrink-0 border-r flex flex-col" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
        <div className="flex items-center justify-between px-4 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>Playlists</h1>
          <button id="create-playlist" onClick={() => setCreateModal(true)}
            className="p-2 rounded-xl transition-colors hover:bg-white/10" style={{ color: 'var(--accent)' }}>
            <Plus size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {playlists.length === 0 && (
            <div className="text-center py-8">
              <ListMusic size={32} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No playlists yet</p>
            </div>
          )}
          {playlists.map(pl => (
            <motion.div
              key={pl.id}
              layout
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
              onClick={() => setSelected(pl.id)}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer group transition-all ${selected === pl.id ? 'ring-1' : ''}`}
              style={{ ringColor: 'var(--accent)', background: selected === pl.id ? 'var(--bg-tertiary)' : '' }}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--accent)', opacity: 0.85 }}>
                <ListMusic size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{pl.name}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{pl.mediaIds?.length || 0} tracks</p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button id={`rename-pl-${pl.id}`} onClick={(e) => { e.stopPropagation(); setEditModal({ id: pl.id, name: pl.name }); }}
                  className="p-1 rounded-lg hover:bg-white/10" style={{ color: 'var(--text-muted)' }}>
                  <Pencil size={13} />
                </button>
                <button id={`del-pl-${pl.id}`} onClick={(e) => { e.stopPropagation(); handleDelete(pl.id, pl.name); }}
                  className="p-1 rounded-lg hover:bg-red-500/20" style={{ color: 'var(--text-muted)' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Playlist detail */}
      <div className="flex-1 overflow-y-auto p-6">
        {!selectedPlaylist ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <ListMusic size={48} className="mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="text-lg font-semibold" style={{ color: 'var(--text-secondary)' }}>Select a playlist</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>
                  {selectedPlaylist.name}
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{selectedTracks.length} tracks</p>
              </div>
              {selectedTracks.length > 0 && (
                <button id="play-playlist"
                  onClick={() => playMedia(selectedTracks[0], selectedTracks, 0)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'var(--accent)' }}>
                  <Play size={16} fill="white" /> Play All
                </button>
              )}
            </div>
            {selectedTracks.length === 0 ? (
              <p className="text-center py-12" style={{ color: 'var(--text-muted)' }}>This playlist is empty. Add songs using the + button on media cards.</p>
            ) : (
              <div className="space-y-1">
                {selectedTracks.map((m, i) => (
                  <div key={m.id} className="flex items-center gap-2 group">
                    <div className="flex-1 min-w-0">
                      <MediaCard media={m} queue={selectedTracks} index={i} compact />
                    </div>
                    <button id={`remove-from-pl-${m.id}`}
                      onClick={() => removeFromPlaylist(selectedPlaylist.id, m.id)}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20 flex-shrink-0"
                      style={{ color: 'var(--text-muted)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="New Playlist" size="sm">
        <input id="new-pl-name" autoFocus value={newName} onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          placeholder="Playlist name…" className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none mb-4"
          style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
        <div className="flex gap-2 justify-end">
          <button onClick={() => setCreateModal(false)} className="px-4 py-2 rounded-xl text-sm" style={{ color: 'var(--text-secondary)', background: 'var(--bg-tertiary)' }}>Cancel</button>
          <button id="create-pl-confirm" onClick={handleCreate} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'var(--accent)' }}>Create</button>
        </div>
      </Modal>

      {/* Rename modal */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Rename Playlist" size="sm">
        <input id="rename-pl-input" autoFocus value={editModal?.name || ''} onChange={e => setEditModal(prev => ({ ...prev, name: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && handleRename()}
          className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none mb-4"
          style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
        <div className="flex gap-2 justify-end">
          <button onClick={() => setEditModal(null)} className="px-4 py-2 rounded-xl text-sm" style={{ color: 'var(--text-secondary)', background: 'var(--bg-tertiary)' }}>Cancel</button>
          <button id="rename-pl-confirm" onClick={handleRename} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'var(--accent)' }}>Save</button>
        </div>
      </Modal>
    </div>
  );
}
