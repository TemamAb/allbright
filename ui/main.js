const { app, BrowserWindow, ipcMain, Menu, autoUpdater, shell } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow;
let apiProcess;
let setupComplete = false; // Enforce /setup first

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        { label: 'New Session', accelerator: 'CmdOrCtrl+N', click: () => mainWindow.loadURL('http://localhost:3000/setup') },
        { label: 'Quit', accelerator: 'CmdOrCtrl+Q', role: 'quit' }
      ]
    },
    {
      label: 'Setup',
      submenu: [
        { label: 'Run Setup Wizard', accelerator: 'CmdOrCtrl+S', click: () => mainWindow.loadURL('http://localhost:3000/setup') },
        { type: 'separator' },
        { label: 'Check Readiness', click: () => ipcMain.emit('setup-check') }
      ]
    },
    {
      label: 'Help',
      submenu: [
        { label: 'BrightSky Docs', click: () => shell.openExternal('https://brightsky.app/docs') },
        { label: 'Copilot', accelerator: 'CmdOrCtrl+C', click: () => mainWindow.loadURL('http://localhost:3000/copilot') },
        { type: 'separator' },
        { label: 'About', click: () => ipcMain.emit('show-about') }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1200,
    minHeight: 800,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'icon.png'),
    show: false // Show after load
  });

  // Load /setup first always
  const loadUrl = isDev ? 'http://localhost:3000/setup' : `file://${path.join(__dirname, '../dist/index.html#/setup')}`;
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(`
      if (!localStorage.getItem('setupComplete')) {
        window.location.hash = '/setup';
      }
    `);
  });
  mainWindow.loadURL(loadUrl);

  mainWindow.once('ready-to-show', () => mainWindow.show());

  if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' });

  mainWindow.on('closed', () => (mainWindow = null));
}

async function startAPIServer() {
  const apiPath = isDev 
    ? path.join(__dirname, '../api/dist/index.mjs') 
    : path.join(process.resourcesPath, 'api/index.mjs');
  
  apiProcess = spawn('node', [apiPath], {
    cwd: isDev ? path.join(__dirname, '..') : process.resourcesPath,
    env: {
      ...process.env,
      PORT: '3001',
      DATABASE_URL: process.env.DATABASE_URL || '',
      RPC_ENDPOINT: process.env.RPC_ENDPOINT || '',
      PIMLICO_API_KEY: process.env.PIMLICO_API_KEY || '',
      BRIGHTSKY_DESKTOP: 'true'
    },
    stdio: ['pipe', 'pipe', 'pipe']
  });

  apiProcess.stdout.on('data', data => console.log(`API[${apiProcess.pid}]: ${data}`));
  apiProcess.stderr.on('data', data => console.error(`API Error: ${data}`));

  return new Promise((resolve) => {
    apiProcess.on('spawn', resolve);
    apiProcess.on('error', (err) => console.error('API spawn failed', err));
    apiProcess.on('close', (code) => {
      if (code !== 0) {
        console.log('API restarted...');
        setTimeout(startAPIServer, 2000);
      }
    });
  });
}

app.whenReady().then(async () => {
  createMenu();
  await startAPIServer();
  createWindow();
});

app.on('window-all-closed', () => {
  if (apiProcess) apiProcess.kill('SIGTERM');
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// IPC APIs (desktop-safe)
ipcMain.handle('setup-check', async () => {
  try {
    const response = await fetch('http://localhost:3001/api/setup/readiness');
    return await response.json();
  } catch {
    return { overallScore: 0, envReady: false };
  }
});

ipcMain.handle('copilot-query', async (event, query) => {
  try {
    const response = await fetch('http://localhost:3001/api/copilot/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: query })
    });
    return await response.text();
  } catch {
    return 'API unavailable - restart app';
  }
});

ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('check-updates', () => autoUpdater.checkForUpdatesAndNotify());

if (!isDev) {
  autoUpdater.logger = require('electron-log');
  autoUpdater.checkForUpdatesAndNotify();
}

