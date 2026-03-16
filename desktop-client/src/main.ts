import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { spawn, ChildProcess } from 'child_process';

let mainWindow: BrowserWindow | null = null;
let serverProcess: ChildProcess | null = null;

// Deep linking setup
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('mineforge', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('mineforge');
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
    const url = commandLine.pop();
    handleAuthUrl(url);
  });

  app.on('ready', () => {
    createWindow();
    setupDirectories();
  });

  app.on('open-url', (event, url) => {
    event.preventDefault();
    handleAuthUrl(url);
  });
}

function handleAuthUrl(url?: string) {
  if (url && url.startsWith('mineforge://auth')) {
    const urlObj = new URL(url);
    const token = urlObj.searchParams.get('token');
    if (token && mainWindow) {
      mainWindow.webContents.send('auth-success', token);
    }
  }
}

function setupDirectories() {
  const baseDir = os.platform() === 'win32' ? 'C:\\MineForge' : path.join(os.homedir(), 'MineForge');
  const dirs = [
    path.join(baseDir, 'servers'),
    path.join(baseDir, 'plugins'),
    path.join(baseDir, 'modpacks')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.on('open-browser-login', () => {
  // Open the web app login page with desktop flag
  shell.openExternal('https://ais-dev-mcdb7z4f3skgoad4a4xyrz-175732729123.europe-west2.run.app/login?desktop=true');
});

ipcMain.on('start-server', (event) => {
  if (serverProcess) return;
  
  const baseDir = os.platform() === 'win32' ? 'C:\\MineForge' : path.join(os.homedir(), 'MineForge');
  const serverDir = path.join(baseDir, 'servers', 'default');
  
  if (!fs.existsSync(serverDir)) fs.mkdirSync(serverDir, { recursive: true });

  event.sender.send('server-log', '[System] Starting server in ' + serverDir);
  
  // Simulate server process for demonstration
  serverProcess = spawn('node', ['-e', 'setInterval(() => console.log("[Server thread/INFO]: Tick"), 2000)'], { cwd: serverDir });
  
  serverProcess.stdout?.on('data', (data) => {
    event.sender.send('server-log', data.toString());
  });
  
  serverProcess.stderr?.on('data', (data) => {
    event.sender.send('server-log', 'ERROR: ' + data.toString());
  });

  serverProcess.on('close', (code) => {
    event.sender.send('server-log', '[System] Server stopped with code ' + code);
    event.sender.send('server-status', 'offline');
    serverProcess = null;
  });

  event.sender.send('server-status', 'online');
});

ipcMain.on('stop-server', (event) => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
    event.sender.send('server-status', 'offline');
  }
});

ipcMain.on('restart-server', (event) => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
  setTimeout(() => {
    ipcMain.emit('start-server', event);
  }, 1000);
});

ipcMain.on('open-folder', (event, folderName) => {
  const baseDir = os.platform() === 'win32' ? 'C:\\MineForge' : path.join(os.homedir(), 'MineForge');
  const targetDir = path.join(baseDir, folderName);
  if (fs.existsSync(targetDir)) {
    shell.openPath(targetDir);
  }
});
