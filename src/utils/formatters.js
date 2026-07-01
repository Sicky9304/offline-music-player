// ─── Time Formatting ─────────────────────────────────────────────────────────
export function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatRelativeDate(date) {
  if (!date) return '';
  const now  = Date.now();
  const diff = now - new Date(date).getTime();
  const min  = 60 * 1000;
  const hr   = 60 * min;
  const day  = 24 * hr;
  if (diff < min)   return 'Just now';
  if (diff < hr)    return `${Math.floor(diff / min)}m ago`;
  if (diff < day)   return `${Math.floor(diff / hr)}h ago`;
  if (diff < 7*day) return `${Math.floor(diff / day)}d ago`;
  return formatDate(date);
}

// ─── String Formatting ────────────────────────────────────────────────────────
export function truncate(str, max = 30) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max - 3) + '…' : str;
}

export function getInitials(name) {
  if (!name) return 'U';
  return name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

// ─── Media Utilities ─────────────────────────────────────────────────────────
export function getMediaIcon(type, format) {
  if (type === 'video') return '🎬';
  const fmt = (format || '').toLowerCase();
  if (['flac', 'wav', 'aiff', 'ape'].includes(fmt)) return '🎵';
  if (['mp3', 'aac', 'm4a'].includes(fmt))           return '🎶';
  return '🎵';
}

export function pathToFileUrl(filePath) {
  if (!filePath) return '';
  const p = filePath.replace(/\\/g, '/');
  return p.startsWith('/') ? `file://${p}` : `file:///${p}`;
}

export function getFileExtension(filePath) {
  if (!filePath) return '';
  return filePath.split('.').pop()?.toUpperCase() || '';
}

export function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ─── Greeting Based on Time of Day ──────────────────────────────────────────
export function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export function countMostPlayed(history, library) {
  if (!history?.length || !library?.length) return [];
  const freq = {};
  history.forEach(h => {
    const track = library.find(m => m.id === h.mediaId || m.filePath === h.filePath);
    if (track) {
      freq[track.id] = (freq[track.id] || 0) + 1;
    }
  });
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([trackId, count]) => {
      const track = library.find(m => m.id === trackId);
      return track ? { ...track, playCount: count } : null;
    })
    .filter(Boolean);
}

