const { contextBridge, ipcRenderer } = require('electron');

// ─── Expose secure electron API to renderer ──────────────────────────────────
contextBridge.exposeInMainWorld('electron', {
  // Invocable (request-response)
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),

  // Fire-and-forget
  send: (channel, ...args) => ipcRenderer.send(channel, ...args),

  // Listen to main-process events
  on: (channel, callback) => {
    const sub = (_event, ...args) => callback(...args);
    ipcRenderer.on(channel, sub);
    return () => ipcRenderer.removeListener(channel, sub);
  },

  // One-time listener
  once: (channel, callback) => {
    ipcRenderer.once(channel, (_event, ...args) => callback(...args));
  }
});
