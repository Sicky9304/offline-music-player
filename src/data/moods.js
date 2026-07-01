// ─── Mood Configurations ──────────────────────────────────────────────────────
// Each mood defines visual properties and a track filter function

export const MOODS = [
  {
    id: 'happy',
    emoji: '😊',
    label: 'Happy',
    accent: '#f59e0b',
    gradient: ['#f59e0b', '#fb923c', '#fbbf24'],
    glow: 'rgba(245, 158, 11, 0.3)',
    cssOverrides: {
      '--accent': '#f59e0b',
      '--accent-hsl': '38 92% 50%',
      '--mood-gradient': 'linear-gradient(135deg, #f59e0b, #fb923c)',
    },
  },
  {
    id: 'chill',
    emoji: '😌',
    label: 'Chill',
    accent: '#06b6d4',
    gradient: ['#06b6d4', '#67e8f9', '#22d3ee'],
    glow: 'rgba(6, 182, 212, 0.3)',
    cssOverrides: {
      '--accent': '#06b6d4',
      '--accent-hsl': '189 94% 43%',
      '--mood-gradient': 'linear-gradient(135deg, #06b6d4, #67e8f9)',
    },
  },
  {
    id: 'romantic',
    emoji: '❤️',
    label: 'Romantic',
    accent: '#ec4899',
    gradient: ['#ec4899', '#f472b6', '#fb7185'],
    glow: 'rgba(236, 72, 153, 0.3)',
    cssOverrides: {
      '--accent': '#ec4899',
      '--accent-hsl': '330 81% 60%',
      '--mood-gradient': 'linear-gradient(135deg, #ec4899, #f472b6)',
    },
  },
  {
    id: 'coding',
    emoji: '💻',
    label: 'Coding',
    accent: '#10b981',
    gradient: ['#10b981', '#34d399', '#6ee7b7'],
    glow: 'rgba(16, 185, 129, 0.3)',
    cssOverrides: {
      '--accent': '#10b981',
      '--accent-hsl': '160 84% 39%',
      '--mood-gradient': 'linear-gradient(135deg, #10b981, #34d399)',
    },
  },
  {
    id: 'workout',
    emoji: '🏋️',
    label: 'Workout',
    accent: '#ef4444',
    gradient: ['#ef4444', '#f97316', '#dc2626'],
    glow: 'rgba(239, 68, 68, 0.3)',
    cssOverrides: {
      '--accent': '#ef4444',
      '--accent-hsl': '0 84% 60%',
      '--mood-gradient': 'linear-gradient(135deg, #ef4444, #f97316)',
    },
  },
  {
    id: 'night',
    emoji: '🌙',
    label: 'Night',
    accent: '#6366f1',
    gradient: ['#6366f1', '#818cf8', '#4f46e5'],
    glow: 'rgba(99, 102, 241, 0.3)',
    cssOverrides: {
      '--accent': '#6366f1',
      '--accent-hsl': '239 84% 67%',
      '--mood-gradient': 'linear-gradient(135deg, #4f46e5, #6366f1)',
    },
  },
  {
    id: 'rain',
    emoji: '🌧️',
    label: 'Rain',
    accent: '#64748b',
    gradient: ['#475569', '#64748b', '#94a3b8'],
    glow: 'rgba(100, 116, 139, 0.3)',
    cssOverrides: {
      '--accent': '#64748b',
      '--accent-hsl': '215 16% 47%',
      '--mood-gradient': 'linear-gradient(135deg, #475569, #64748b)',
    },
  },
  {
    id: 'gaming',
    emoji: '🎮',
    label: 'Gaming',
    accent: '#a855f7',
    gradient: ['#a855f7', '#c084fc', '#7c3aed'],
    glow: 'rgba(168, 85, 247, 0.3)',
    cssOverrides: {
      '--accent': '#a855f7',
      '--accent-hsl': '271 91% 65%',
      '--mood-gradient': 'linear-gradient(135deg, #7c3aed, #a855f7)',
    },
  },
  {
    id: 'focus',
    emoji: '🎧',
    label: 'Focus',
    accent: '#14b8a6',
    gradient: ['#14b8a6', '#2dd4bf', '#0d9488'],
    glow: 'rgba(20, 184, 166, 0.3)',
    cssOverrides: {
      '--accent': '#14b8a6',
      '--accent-hsl': '173 80% 40%',
      '--mood-gradient': 'linear-gradient(135deg, #0d9488, #14b8a6)',
    },
  },
];

// Get a deterministic subset of tracks for a given mood
export function filterTracksByMood(tracks, moodId) {
  if (!moodId || !tracks.length) return tracks;
  const seed = moodId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return tracks.filter((_, idx) => (idx + seed) % 3 === 0);
}
