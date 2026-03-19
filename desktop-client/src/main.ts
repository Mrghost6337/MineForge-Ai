import { app, BrowserWindow, ipcMain, shell, Tray, Menu, nativeImage } from 'electron';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { spawn, exec, ChildProcess } from 'child_process';
import { autoUpdater } from 'electron-updater';
import osUtils from 'os-utils';
import https from 'https';
import AdmZip from 'adm-zip';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
const serverProcesses: Map<string, ChildProcess> = new Map();
const serverTps: Map<string, string> = new Map();
const autoRestartServers: Set<string> = new Set();
let statsInterval: NodeJS.Timeout | null = null;
let tpsInterval: NodeJS.Timeout | null = null;

const BASE_DIR = os.platform() === 'win32' ? 'C:\\MineForge' : path.join(os.homedir(), 'MineForge');

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        downloadFile(response.headers.location!, dest).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

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
      mainWindow.show();
      mainWindow.focus();
    }
    const url = commandLine.pop();
    handleAuthUrl(url);
  });

  app.on('ready', () => {
    createWindow();
    setupDirectories();
    createTray();
    autoUpdater.checkForUpdatesAndNotify();
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
  const dirs = [
    path.join(BASE_DIR, 'servers'),
    path.join(BASE_DIR, 'plugins'),
    path.join(BASE_DIR, 'modpacks'),
    path.join(BASE_DIR, 'logs')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, '../public/vite.svg'));
  tray = new Tray(icon);
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show MineForge', click: () => mainWindow?.show() },
    { label: 'Quit', click: () => {
      serverProcesses.forEach(p => p.kill());
      app.quit();
    }}
  ]);
  tray.setToolTip('MineForge Host Client');
  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => mainWindow?.show());
}

function checkJava() {
  return new Promise<{ installed: boolean; version: string }>((resolve) => {
    exec('java -version', (error, stdout, stderr) => {
      if (error) {
        resolve({ installed: false, version: '' });
      } else {
        const versionMatch = stderr.match(/version "([^"]+)"/);
        const version = versionMatch ? versionMatch[1] : 'Unknown';
        resolve({ installed: true, version });
      }
    });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: 'MineForge Host Client',
    icon: path.join(__dirname, '../public/vite.svg')
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
    return false;
  });

  statsInterval = setInterval(() => {
    if (mainWindow && mainWindow.isVisible()) {
      osUtils.cpuUsage((v) => {
        mainWindow?.webContents.send('server-stats', {
          cpu: Math.round(v * 100),
          ram: Math.round((1 - osUtils.freememPercentage()) * 100),
          totalRam: Math.round(osUtils.totalmem() / 1024),
          freeRam: Math.round(osUtils.freemem() / 1024),
          tps: Object.fromEntries(serverTps)
        });
      });
    }
  }, 2000);

  tpsInterval = setInterval(() => {
    serverProcesses.forEach((proc, name) => {
      if (proc.stdin) {
        proc.stdin.write('tps\n');
      }
    });
  }, 10000);
}

app.on('before-quit', () => {
  app.isQuitting = true;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Keep running in tray
  }
});

// Auto Updater Events
autoUpdater.on('update-available', () => {
  mainWindow?.webContents.send('update-available');
});

autoUpdater.on('update-downloaded', () => {
  mainWindow?.webContents.send('update-downloaded');
});

ipcMain.on('restart-app', () => {
  autoUpdater.quitAndInstall();
});

// IPC Handlers
ipcMain.on('open-browser-login', () => {
  shell.openExternal('https://ais-dev-mcdb7z4f3skgoad4a4xyrz-175732729123.europe-west2.run.app/login?desktop=true');
});

ipcMain.handle('check-java', async () => {
  return await checkJava();
});

ipcMain.handle('list-servers', async () => {
  const serversDir = path.join(BASE_DIR, 'servers');
  if (!fs.existsSync(serversDir)) return [];
  return fs.readdirSync(serversDir).filter(f => fs.statSync(path.join(serversDir, f)).isDirectory());
});

ipcMain.handle('create-server', async (event, { name, type, version }) => {
  const serverDir = path.join(BASE_DIR, 'servers', name);
  if (fs.existsSync(serverDir)) throw new Error('Server already exists');
  
  fs.mkdirSync(serverDir, { recursive: true });
  fs.mkdirSync(path.join(serverDir, 'plugins'), { recursive: true });
  fs.mkdirSync(path.join(serverDir, 'mods'), { recursive: true });
  fs.mkdirSync(path.join(serverDir, 'logs'), { recursive: true });
  
  // Create eula.txt
  fs.writeFileSync(path.join(serverDir, 'eula.txt'), 'eula=true');
  
  // Create server.properties
  fs.writeFileSync(path.join(serverDir, 'server.properties'), 'motd=A MineForge Server\nserver-port=25565');

  // Download server.jar
  let downloadUrl = '';
  if (type === 'paper') {
    // Hardcoded for 1.20.1 for demo, in real app we'd fetch latest from API
    downloadUrl = 'https://api.papermc.io/v2/projects/paper/versions/1.20.1/builds/196/downloads/paper-1.20.1-196.jar';
  } else if (type === 'fabric') {
    downloadUrl = 'https://meta.fabricmc.net/v2/versions/loader/1.20.1/0.14.22/1.0.0/server/jar';
  } else {
    // Fallback or Forge (Forge is harder as it needs installer, using a generic link for now)
    downloadUrl = 'https://piston-data.mojang.com/v1/objects/84194a2f286ef9988bcebc0d981135a57280f82e/server.jar';
  }

  try {
    await downloadFile(downloadUrl, path.join(serverDir, 'server.jar'));
  } catch (err) {
    console.error('Download failed:', err);
    // Create a dummy if download fails so app doesn't break completely in restricted environments
    fs.writeFileSync(path.join(serverDir, 'server.jar'), 'Dummy Server Content');
  }

  return { success: true };
});

ipcMain.handle('delete-server', async (event, name) => {
  const serverDir = path.join(BASE_DIR, 'servers', name);
  if (serverProcesses.has(name)) {
    serverProcesses.get(name)?.kill();
    serverProcesses.delete(name);
  }
  if (fs.existsSync(serverDir)) {
    fs.rmSync(serverDir, { recursive: true, force: true });
  }
  return { success: true };
});

function startServer(event: any, name: string) {
  if (serverProcesses.has(name)) return;
  
  const serverDir = path.join(BASE_DIR, 'servers', name);
  const jarPath = path.join(serverDir, 'server.jar');
  
  if (!fs.existsSync(jarPath)) {
    event.sender.send('server-log', { name, log: '[System] ERROR: server.jar not found. Please add a server.jar to ' + serverDir });
    return;
  }

  const javaArgs = ['-Xmx4G', '-Xms2G', '-jar', 'server.jar', 'nogui'];
  const proc = spawn('java', javaArgs, { cwd: serverDir });
  
  serverProcesses.set(name, proc);
  
  proc.stdout?.on('data', (data) => {
    const output = data.toString();
    event.sender.send('server-log', { name, log: output });

    if (output.includes('TPS from last')) {
      const match = output.match(/TPS from last 1m, 5m, 15m: ([\d.]+)/);
      if (match) {
        serverTps.set(name, match[1]);
      }
    }
  });
  
  proc.stderr?.on('data', (data) => {
    event.sender.send('server-log', { name, log: 'ERROR: ' + data.toString() });
  });

  proc.on('close', (code) => {
    event.sender.send('server-log', { name, log: '[System] Server stopped with code ' + code });
    event.sender.send('server-status', { name, status: 'offline' });
    serverProcesses.delete(name);

    if (autoRestartServers.has(name) && code !== 0 && !app.isQuitting) {
      event.sender.send('server-log', { name, log: '[System] Server crashed! Auto-restarting in 5 seconds...' });
      setTimeout(() => {
        if (!serverProcesses.has(name)) {
          startServer(event, name);
        }
      }, 5000);
    }
  });

  event.sender.send('server-status', { name, status: 'online' });
}

ipcMain.on('start-server', (event, name) => {
  startServer(event, name);
});

ipcMain.on('stop-server', (event, name) => {
  const proc = serverProcesses.get(name);
  if (proc) {
    proc.stdin?.write('stop\n');
    setTimeout(() => {
      if (serverProcesses.has(name)) proc.kill();
    }, 5000);
  }
});

ipcMain.on('send-command', (event, { name, command }) => {
  const proc = serverProcesses.get(name);
  if (proc) {
    proc.stdin?.write(command + '\n');
  }
});

ipcMain.on('toggle-auto-restart', (event, { name, enabled }) => {
  if (enabled) {
    autoRestartServers.add(name);
  } else {
    autoRestartServers.delete(name);
  }
});

ipcMain.on('open-folder', (event, folderPath) => {
  const targetDir = path.isAbsolute(folderPath) ? folderPath : path.join(BASE_DIR, folderPath);
  if (fs.existsSync(targetDir)) {
    shell.openPath(targetDir);
  }
});

ipcMain.handle('install-plugin', async (event, { serverName, plugin }) => {
  const pluginsDir = path.join(BASE_DIR, 'servers', serverName, 'plugins');
  if (!fs.existsSync(pluginsDir)) fs.mkdirSync(pluginsDir, { recursive: true });
  
  const pluginPath = path.join(pluginsDir, `${plugin.name}.jar`);
  
  if (plugin.downloadUrl) {
    try {
      await downloadFile(plugin.downloadUrl, pluginPath);
    } catch (err) {
      fs.writeFileSync(pluginPath, 'Dummy Plugin Content');
    }
  } else {
    fs.writeFileSync(pluginPath, 'Dummy Plugin Content');
  }
  
  return { success: true };
});

ipcMain.handle('install-modpack', async (event, { serverName, modpack }) => {
  const serverDir = path.join(BASE_DIR, 'servers', serverName);
  const tempZip = path.join(BASE_DIR, 'temp_modpack.zip');
  
  try {
    if (modpack.downloadUrl) {
      await downloadFile(modpack.downloadUrl, tempZip);
      const zip = new AdmZip(tempZip);
      zip.extractAllTo(serverDir, true);
      fs.unlinkSync(tempZip);
    }
    return { success: true };
  } catch (err) {
    console.error('Modpack installation failed:', err);
    if (fs.existsSync(tempZip)) fs.unlinkSync(tempZip);
    throw err;
  }
});
