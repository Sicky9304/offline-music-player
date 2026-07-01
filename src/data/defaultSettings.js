export const DEFAULT_SETTINGS = {
  // Playback
  defaultVolume:     80,
  defaultSpeed:      1.0,
  resumePlayback:    true,
  rememberPosition:  true,
  crossfade:         false,
  crossfadeDuration: 3,
  dolbyAtmos:        false,
  atmosMode:         'music',

  // Subtitle
  subtitleSize:       24,
  subtitleColor:      '#ffffff',
  subtitleBackground: 'rgba(0,0,0,0.6)',
  subtitleDelay:      0,

  // Library
  watchedFolders:    [],
  autoScan:          false,
  showFileExtensions:true,
  groupByAlbum:      false,

  // UI
  sidebarCollapsed:  false,
  showMiniPlayer:    true,
  animationsEnabled: true,
  compactView:       false,

  // Theme (persisted via themeId + accentId in settings)
  themeId:           'dark',
  accentId:          'violet',
};
