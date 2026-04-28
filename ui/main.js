const { app, BrowserWindow, ipcMain, autoUpdater } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let apiProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets/icon.png') // Add icon if available
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    // Disable dev tools in production
    mainWindow.setMenuBarVisibility(false);
  }

  // Start API server as subprocess
  const apiPath = isDev ? path.join(__dirname, '../api/dist/index.mjs') : path.join(process.resourcesPath, 'api', 'index.mjs');
  apiProcess = spawn('node', [apiPath], {
    cwd: isDev ? path.join(__dirname, '..') : process.resourcesPath,
    env: { ...process.env, PORT: 3001, DATABASE_URL: process.env.DATABASE_URL || '', RPC_ENDPOINT: process.env.RPC_ENDPOINT || '', PIMLICO_API_KEY: process.env.PIMLICO_API_KEY || '' },
    stdio: 'pipe'
  });

  apiProcess.stdout.on('data', (data) => console.log(`API: ${data}`));
  apiProcess.stderr.on('data', (data) => console.error(`API Error: ${data}`));

  apiProcess.on('close', (code) => {
    console.log(`API process exited with code ${code}`);
    if (code !== 0) {
      mainWindow.webContents.send('error-notification', 'API server crashed. Attempting restart...');
      if (!isDev) {
        setTimeout(() => {
          if (!mainWindow.isDestroyed()) {
            apiProcess = spawn('node', [apiPath], {
              cwd: isDev ? path.join(__dirname, '..') : process.resourcesPath,
              env: { ...process.env, PORT: 3001 },
              stdio: 'pipe'
            });
          }
        }, 5000);
      }
    }
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (apiProcess) apiProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// IPC for copilot integration
ipcMain.handle('copilot-query', async (event, query) => {
  // Connect to alphaCopilot via API
  try {
    const response = await fetch('http://localhost:3001/api/copilot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    return await response.text();
  } catch (error) {
    return 'Copilot unavailable. Please check API connection.';
  }
});

ipcMain.handle('get-app-version', () => app.getVersion());

// Auto-updater setup
if (!isDev) {
  autoUpdater.checkForUpdatesAndNotify();
  ipcMain.handle('check-for-updates', () => autoUpdater.checkForUpdatesAndNotify());
}

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Notify user via copilot
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});