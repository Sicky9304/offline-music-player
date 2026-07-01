import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ListMusic, Pencil, Trash2 } from 'lucide-react';
import { useLibrary } from '../hooks/useLibrary.jsx';
import { usePlayer } from '../hooks/usePlayer.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import MediaCard from '../components/player/MediaCard.jsx';
import Modal from '../components/ui/Modal.jsx';
import SectionHeader from '../components/ui/SectionHeader.jsx';

export default function Playlists() {
  const { playlists, library, createPlaylist, updatePlaylist, deletePlaylist, removeFromPlaylist } = useLibrary();
  const { playMedia } = usePlayer();
  const toast = useToast();
  const location = useLocation();
  const [selected, setSelected] = useState(() => location.state?.selectedPlaylistId || null);
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
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      await deletePlaylist(id);
      toast.success(`Deleted "${name}"`);
      if (selected === id) setSelected(null);
    }
  };

  const handleRename = async () => {
    if (!editModal?.name.trim()) return;
    await updatePlaylist(editModal.id, { name: editModal.name });
    toast.success('Playlist renamed');
    setEditModal(null);
  };

  return (
    <div className="flex h-full page-enter">
      {/* Playlist list */}
      <div className="w-72 flex-shrink-0 border-r flex flex-col glass-surface" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="flex items-center justify-between px-4 py-5 border-b" style={{ borderColor: 'var(--glass-border)' }}>
          <h1 className="text-base font-black font-brand text-white uppercase tracking-wider">Playlists</h1>
          <button 
            id="create-playlist" 
            onClick={() => setCreateModal(true)}
            className="p-1.5 rounded-xl glass-button text-zinc-400 hover:text-white"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {playlists.length === 0 && (
            <div className="text-center py-12 space-y-2">
              <ListMusic size={32} className="mx-auto text-zinc-600" />
              <p className="text-xs text-zinc-500 font-semibold">No playlists yet</p>
            </div>
          )}
          {playlists.map(pl => {
            const isSel = selected === pl.id;
            return (
              <motion.div
                key={pl.id}
                layout
                onClick={() => setSelected(pl.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl cursor-pointer group transition-all duration-200 border ${
                  isSel 
                    ? 'glass border-white/10 shadow-lg' 
                    : 'border-transparent hover:bg-white/5 hover:border-white/5'
                }`}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--accent)', opacity: 0.9 }}>
                  <ListMusic size={16} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate text-white">{pl.name}</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">{pl.mediaIds?.length || 0} tracks</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    id={`rename-pl-${pl.id}`} 
                    onClick={(e) => { e.stopPropagation(); setEditModal({ id: pl.id, name: pl.name }); }}
                    className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white"
                  >
                    <Pencil size={12} />
                  </button>
                  <button 
                    id={`del-pl-${pl.id}`} 
                    onClick={(e) => { e.stopPropagation(); handleDelete(pl.id, pl.name); }}
                    className="p-1 rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Playlist detail */}
      <div className="flex-1 overflow-y-auto p-6">
        {!selectedPlaylist ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
            <ListMusic size={40} className="text-zinc-600" />
            <p className="text-sm font-bold text-zinc-400">Select a Playlist</p>
            <p className="text-xs text-zinc-500">Pick one from the sidebar to listen or edit.</p>
          </div>
        ) : (
          <>
            <SectionHeader
              title={selectedPlaylist.name}
              subtitle={`${selectedTracks.length} tracks catalogued`}
              badge="Custom Playlist"
              icon={ListMusic}
              actionText={selectedTracks.length > 0 ? "Play All" : undefined}
              onAction={() => playMedia(selectedTracks[0], selectedTracks, 0)}
              className="border-b border-white/5 pb-5"
            />
            
            {selectedTracks.length === 0 ? (
              <div className="py-16 text-center space-y-1">
                <p className="text-sm font-semibold text-zinc-400">This playlist is empty</p>
                <p className="text-xs text-zinc-500">Add songs using the + button on track cards in search or library.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {selectedTracks.map((m, i) => (
                  <div key={m.id} className="flex items-center gap-2 group">
                    <div className="flex-1 min-w-0">
                      <MediaCard media={m} queue={selectedTracks} index={i} compact />
                    </div>
                    <button 
                      id={`remove-from-pl-${m.id}`}
                      onClick={() => removeFromPlaylist(selectedPlaylist.id, m.id)}
                      className="p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 hover:text-red-400 flex-shrink-0"
                    >
                      <Trash2 size={13} />
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
        <div className="space-y-4">
          <input 
            id="new-pl-name" 
            autoFocus 
            value={newName} 
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="Playlist name…" 
            className="glass-input" 
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setCreateModal(false)} className="px-3 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white glass-button">Cancel</button>
            <button id="create-pl-confirm" onClick={handleCreate} className="px-4 py-2 rounded-xl text-xs font-semibold gradient-button">Create</button>
          </div>
        </div>
      </Modal>

      {/* Rename modal */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Rename Playlist" size="sm">
        <div className="space-y-4">
          <input 
            id="rename-pl-input" 
            autoFocus 
            value={editModal?.name || ''} 
            onChange={e => setEditModal(prev => ({ ...prev, name: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleRename()}
            className="glass-input" 
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setEditModal(null)} className="px-3 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white glass-button">Cancel</button>
            <button id="rename-pl-confirm" onClick={handleRename} className="px-4 py-2 rounded-xl text-xs font-semibold gradient-button">Save</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
