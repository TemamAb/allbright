const { app, BrowserWindow, ipcMain, safeStorage } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';
const { fork } = require('child_process');

let mainWindow;
let apiProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "BrightSky Elite Arbitrage",
    backgroundColor: '#111217',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  const startUrl = isDev 
    ? 'http://localhost:5173' 
    : `file://${path.join(__dirname, 'ui/dist/index.html')}`;

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startBackend() {
  // Start the API server as a background sidecar
  const apiPath = path.join(__dirname, 'api/dist/index.js');
  apiProcess = fork(apiPath, [], {
    env: { 
      ...process.env, 
      BRIGHTSKY_DATA_DIR: app.getPath('userData'),
      NODE_ENV: 'production'
    }
  });

  apiProcess.on('message', (msg) => {
    if (mainWindow) {
      mainWindow.webContents.send('api-status', msg);
    }
  });
}

app.whenReady().then(() => {
  startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (apiProcess) apiProcess.kill();
    app.quit();
  }
});

// App Onboarding IPC Bridge
ipcMain.handle('save-onboarding-config', async (event, config) => {
  // This is where we safely transition from UI input to local encryption
  // and notify the API process to reload environment variables.
  if (apiProcess) {
    apiProcess.send({ type: 'RELOAD_CONFIG', payload: config });
  }
  return { success: true };
});

ipcMain.handle('get-cloud-providers', async () => {
  try {
    const response = await fetch('http://localhost:3000/api/deployment/cloud/providers');
    return await response.json();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('trigger-cloud-deployment', async (event, provider) => {
  console.log(`[ELECTRON] Received cloud deployment trigger for: ${provider}`);
  try {
    // We call the local API route we created in engine.ts
    const response = await fetch('http://localhost:3000/api/deployment/cloud/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider })
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('sync-remote-tuning', async () => {
  try {
    const response = await fetch('http://localhost:3000/api/deployment/cloud/sync-tuning', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Recommendation 1: Hardware-Level Key Security (BSS-52)
ipcMain.handle('encrypt-credential', async (event, plaintext) => {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("Hardware encryption not available on this platform");
  }
  return safeStorage.encryptString(plaintext).toString('base64');
});

ipcMain.handle('decrypt-credential', async (event, encryptedBase64) => {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("Hardware encryption not available on this platform");
  }
  try {
    return safeStorage.decryptString(Buffer.from(encryptedBase64, 'base64'));
  } catch (e) {
    return null; // Decryption failed (different machine or OS user)
  }
});

ipcMain.handle('get-app-path', () => app.getAppPath());