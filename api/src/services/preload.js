const { contextBridge, ipcRenderer } = require('electron');

/**
 * BSS-52: Secure IPC Bridge
 * Exposes specific Electron functionality to the React frontend
 * without exposing the entire 'require' system.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  saveOnboarding: (config) => ipcRenderer.invoke('save-onboarding-config', config),
  onApiStatus: (callback) => ipcRenderer.on('api-status', (_event, value) => callback(value)),
  // Phase 4: Trigger Cloud Deployment
  getCloudProviders: () => ipcRenderer.invoke('get-cloud-providers'),
  deployToCloud: (provider) => ipcRenderer.invoke('trigger-cloud-deployment', provider),
  getAppPath: () => ipcRenderer.invoke('get-app-path')
});