import { useState } from 'react';
import { Play, PlayCircle, Plus, CheckCircle, Music, Clock, Download, Loader2 } from 'lucide-react';
import { usePlayer } from '../../hooks/usePlayer.jsx';
import { useLibrary } from '../../hooks/useLibrary.jsx';
import { useToast } from '../ui/Toast.jsx';
import { formatDuration } from '../../utils/formatters.js';
import { ipc } from '../../utils/ipc.js';

export default function TrackRow({ track, index }) {
  const { playMedia, currentMedia, isPlaying } = usePlayer();
  const { library, reload } = useLibrary();
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  // Check if this track is already added to the library
  const isAdded = library.some(m => m.id === 'online-' + track.id);
  const isDownloaded = library.some(m => m.id === 'online-download-' + track.id || m.id === track.id);
  const isActive = currentMedia?.id === 'online-' + track.id || currentMedia?.id === track.id || currentMedia?.id === 'online-download-' + track.id;

  const handlePlayPreview = (e) => {
    e.stopPropagation();
    if (!track.previewUrl) {
      toast.warning('No preview URL available for this track');
      return;
    }

    const mediaItem = {
      id: track.id,
      title: track.title,
      artist: track.artist,
      album: track.album,
      duration: track.duration || 30, // Preview is 30s
      filePath: track.previewUrl,
      thumbnail: track.thumbnail,
      type: 'audio',
      isOnline: true,
      isOnlinePreview: true
    };

    playMedia(mediaItem, [mediaItem], 0);
    toast.info(`Playing preview: ${track.title}`);
  };

  const handlePlayFull = () => {
    const mediaItem = {
      id: 'online-' + track.id,
      title: track.title,
      artist: track.artist,
      album: track.album,
      duration: track.duration,
      filePath: track.previewUrl || 'online',
      thumbnail: track.thumbnail,
      type: 'audio',
      isOnline: true,
      isOnlinePreview: false,
      previewUrl: track.previewUrl
    };

    playMedia(mediaItem, [mediaItem], 0);
    toast.info(`Resolving and playing: ${track.title}`);
  };

  const handleAddToLibrary = async (e) => {
    e.stopPropagation();
    if (isAdded || adding) return;

    setAdding(true);
    try {
      const mediaItem = {
        id: 'online-' + track.id,
        title: track.title,
        artist: track.artist,
        album: track.album,
        duration: track.duration,
        filePath: track.previewUrl || 'online',
        type: 'audio',
        thumbnail: track.thumbnail,
        isOnline: true,
        previewUrl: track.previewUrl,
        dateAdded: new Date()
      };

      const result = await ipc.media.addMany([mediaItem]);
      if (result && result.length) {
        toast.success(`"${track.title}" added to your library!`);
        reload(); // Reload library context so it updates instantly
      } else {
        toast.error('Failed to add track to library');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred');
    } finally {
      setAdding(false);
    }
  };

  const handleDownload = async (category) => {
    if (downloading) return;
    setDownloading(true);
    toast.info(`Downloading "${track.title}" to ${category}...`);
    try {
      const res = await ipc.online.downloadTrack(track, category);
      if (res && res.ok) {
        toast.success(`"${track.title}" downloaded and saved!`);
        reload(); // Refresh local library state
      } else {
        toast.error(res?.error || 'Failed to download track');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred during download');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      onClick={handlePlayFull}
      className={`flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer group border transition-all duration-200 select-none ${isActive
          ? 'glass border-white/10 bg-white/[0.04] shadow-lg'
          : 'border-transparent hover:bg-white/5 hover:border-white/5'
        }`}
    >
      {/* Index & Play Button */}
      <div className="w-6 flex items-center justify-center text-sm font-semibold text-zinc-500 group-hover:hidden">
        {index + 1}
      </div>
      <div className="w-6 hidden items-center justify-center group-hover:flex">
        <Play size={14} className="text-cyan-400" fill="currentColor" />
      </div>

      {/* Album Artwork */}
      <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center bg-zinc-900 border border-white/5 shadow-inner">
        {track.thumbnail ? (
          <img src={track.thumbnail} alt="" className="w-full h-full object-cover" />
        ) : (
          <Music size={16} className="text-zinc-500" />
        )}
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <h4
          className={`text-sm font-bold truncate transition-colors duration-200 ${isActive ? 'text-cyan-400' : 'text-white'
            }`}
        >
          {track.title}
        </h4>
        <p className="text-xs truncate mt-0.5 text-zinc-400 font-semibold">
          {track.artist} {track.album ? `• ${track.album}` : ''}
        </p>
      </div>

      {/* Track Source Tag */}
      <div className="hidden md:flex items-center">
        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest bg-white/5 text-zinc-500 border border-white/5">
          {track.source}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Play Preview Button */}
        {track.previewUrl && (
          <button
            onClick={handlePlayPreview}
            title="Play 30s Preview"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-cyan-400 border border-cyan-500/10 hover:bg-cyan-500/10 active:scale-95 transition-all duration-200"
          >
            <PlayCircle size={12} />
            Preview
          </button>
        )}

        {/* Add to Library Button */}
        <button
          onClick={handleAddToLibrary}
          disabled={isAdded || adding}
          title={isAdded ? 'In Library' : 'Add to Library'}
          className={`p-2 rounded-xl border transition-all duration-200 active:scale-95 ${isAdded
              ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5 cursor-default'
              : 'border-white/10 text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
        >
          {isAdded ? <CheckCircle size={14} /> : <Plus size={14} />}
        </button>

        {/* Download Button */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isDownloaded || downloading) return;
              setShowCategories(!showCategories);
            }}
            disabled={isDownloaded || downloading}
            title={isDownloaded ? 'Downloaded Locally' : 'Download Track'}
            className={`p-2 rounded-xl border transition-all duration-200 active:scale-95 ${
              isDownloaded
                ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5 cursor-default'
                : downloading
                ? 'border-white/10 text-cyan-400 bg-white/5 cursor-default'
                : 'border-white/10 text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {downloading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" />
            ) : isDownloaded ? (
              <CheckCircle size={14} className="text-emerald-400" />
            ) : (
              <Download size={14} />
            )}
          </button>

          {showCategories && (
            <div className="absolute right-0 bottom-full mb-2 w-32 glass-surface bg-zinc-950/95 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden py-1">
              <div className="px-3 py-1 text-[9px] font-black uppercase tracking-wider text-zinc-500 border-b border-white/5 mb-1">
                Category
              </div>
              {['Bollywood', 'English', 'Bhojpuri', 'Others'].map(cat => (
                <button
                  key={cat}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCategories(false);
                    handleDownload(cat);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-white/5 font-semibold transition-colors"
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Duration */}
        <div className="w-12 text-right flex items-center justify-end gap-1 text-xs text-zinc-500 font-mono font-bold">
          <Clock size={12} className="text-zinc-600" />
          {formatDuration(track.duration)}
        </div>
      </div>
    </div>
  );
}
