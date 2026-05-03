const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Setup workflow APIs
  setupCheck: () => ipcRenderer.invoke('setup-check'),
  copilotQuery: (query) => ipcRenderer.invoke('copilot-query', query),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  checkUpdates: () => ipcRenderer.invoke('check-updates'),
  
  // Desktop specific
  getDesktopPath: () => process.env.HOME || process.env.USERPROFILE,
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  showOpenDialog: () => ipcRenderer.invoke('show-open-dialog')
});

// IPC event listeners (non-blocking)
ipcRenderer.on('error-notification', (event, message) => {
  // Dispatch to global event bus or copilot toast
  window.dispatchEvent(new CustomEvent('desktop-error', { detail: message }));
});

ipcRenderer.on('api-status', (event, status) => {
  window.dispatchEvent(new CustomEvent('api-status', { detail: status }));
});

window.addEventListener('beforeunload', () => {
  // Cleanup IPC
});

// Expose safe window object for preload
contextBridge.exposeInMainWorld('desktop', {
  isElectron: true,
  version: process.versions.electron,
  platform: process.platform,
  arch: process.arch,
  setupComplete: localStorage.getItem('setupComplete') === 'true'
});

