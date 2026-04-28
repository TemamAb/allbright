const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  copilotQuery: (query) => ipcRenderer.invoke('copilot-query', query),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  // Add more secure APIs as needed
});

// Handle errors from main process
ipcRenderer.on('error-notification', (event, message) => {
  // Display in UI via copilot panel
  console.error('Electron Error:', message);
});