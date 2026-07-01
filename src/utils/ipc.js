// Safe wrapper around window.electron with mock fallbacks for web browser environments
const e = window.electron || {
  invoke: async (channel, ...args) => {
    console.warn(`[IPC Fallback] window.electron is not available (running in web browser). invoke('${channel}') called with:`, args);
    
    // Provide sensible startup defaults to avoid component crashes
    switch (channel) {
      case 'db:status':
        return { connected: false, error: 'Running outside Electron' };
      case 'settings:getAll':
        return {};
      case 'profile:get':
        return { name: 'Web Preview User', email: '', bio: '', avatar: null };
      case 'media:getAll':
      case 'media:getAudio':
      case 'media:getVideo':
      case 'media:getFavorites':
      case 'playlist:getAll':
      case 'history:getAll':
        return [];
      case 'mpv:isInstalled':
        return false;
      default:
        return null;
    }
  },
  send: (channel, ...args) => {
    console.warn(`[IPC Fallback] window.electron is not available. send('${channel}') called with:`, args);
  },
  on: (channel, callback) => {
    console.warn(`[IPC Fallback] window.electron is not available. on('${channel}') listener registered.`);
    return () => {};
  },
  once: (channel, callback) => {
    console.warn(`[IPC Fallback] window.electron is not available. once('${channel}') listener registered.`);
  }
};

export const ipc = {
  // Window
  minimize:     ()     => e.send('win:minimize'),
  maximize:     ()     => e.send('win:maximize'),
  close:        ()     => e.send('win:close'),
  isMaximized:  ()     => e.invoke('win:isMaximized'),

  video: {
    open: (filePath) => e.invoke('video:open', filePath),
  },

  // DB status
  dbStatus:     ()     => e.invoke('db:status'),

  // Dialog
  openFiles:    ()     => e.invoke('dialog:openFiles'),
  openFolder:   ()     => e.invoke('dialog:openFolder'),
  openImage:    ()     => e.invoke('dialog:openImage'),

  // Media
  media: {
    addMany:       (items)          => e.invoke('media:addMany', items),
    getAll:        ()               => e.invoke('media:getAll'),
    getAudio:      ()               => e.invoke('media:getAudio'),
    getVideo:      ()               => e.invoke('media:getVideo'),
    delete:        (id)             => e.invoke('media:delete', id),
    update:        (id, updates)    => e.invoke('media:update', { id, updates }),
    toggleFav:     (id)             => e.invoke('media:toggleFavorite', id),
    getFavorites:  ()               => e.invoke('media:getFavorites'),
    search:        (q)              => e.invoke('media:search', q),
    getMetadata:   (fp)             => e.invoke('media:getMetadata', fp),
    findSubtitles: (fp)             => e.invoke('media:findSubtitles', fp),
  },

  // Playlists
  playlist: {
    getAll:      ()                         => e.invoke('playlist:getAll'),
    create:      (name, description)        => e.invoke('playlist:create', { name, description }),
    update:      (id, updates)              => e.invoke('playlist:update', { id, updates }),
    delete:      (id)                       => e.invoke('playlist:delete', id),
    addMedia:    (playlistId, mediaId)      => e.invoke('playlist:addMedia', { playlistId, mediaId }),
    removeMedia: (playlistId, mediaId)      => e.invoke('playlist:removeMedia', { playlistId, mediaId }),
  },

  // History
  history: {
    add:    (item) => e.invoke('history:add', item),
    getAll: ()     => e.invoke('history:getAll'),
    clear:  ()     => e.invoke('history:clear'),
    delete: (id)   => e.invoke('history:delete', id),
  },

  // Settings
  settings: {
    get:    (key)        => e.invoke('settings:get', key),
    set:    (key, value) => e.invoke('settings:set', { key, value }),
    getAll: ()           => e.invoke('settings:getAll'),
  },

  // Profile
  profile: {
    get:          ()       => e.invoke('profile:get'),
    update:       (data)   => e.invoke('profile:update', data),
    uploadAvatar: ()       => e.invoke('profile:uploadAvatar'),
  },

  // MPV
  mpv: {
    load:        (filePath, options) => e.invoke('mpv:load', { filePath, options }),
    play:        ()                  => e.invoke('mpv:play'),
    pause:       ()                  => e.invoke('mpv:pause'),
    toggle:      ()                  => e.invoke('mpv:toggle'),
    stop:        ()                  => e.invoke('mpv:stop'),
    seek:        (secs, mode)        => e.invoke('mpv:seek', { seconds: secs, mode }),
    seekAbs:     (secs)              => e.invoke('mpv:seekAbs', secs),
    volume:      (vol)               => e.invoke('mpv:volume', vol),
    speed:       (spd)               => e.invoke('mpv:speed', spd),
    mute:        (m)                 => e.invoke('mpv:mute', m),
    fullscreen:  ()                  => e.invoke('mpv:fullscreen'),
    subDelay:    (d)                 => e.invoke('mpv:subDelay', d),
    loadSub:     (fp)                => e.invoke('mpv:loadSub', fp),
    audioTrack:  (id)                => e.invoke('mpv:audioTrack', id),
    subTrack:    (id)                => e.invoke('mpv:subTrack', id),
    getPos:      ()                  => e.invoke('mpv:getPos'),
    getDur:      ()                  => e.invoke('mpv:getDur'),
    getVol:      ()                  => e.invoke('mpv:getVol'),
    isPaused:    ()                  => e.invoke('mpv:isPaused'),
    isInstalled: ()                  => e.invoke('mpv:isInstalled'),
  },

  // Event listeners
  on:   (channel, cb) => e.on(channel, cb),
  once: (channel, cb) => e.once(channel, cb),
};
