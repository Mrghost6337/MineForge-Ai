import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  openBrowserLogin: () => ipcRenderer.send('open-browser-login'),
  onAuthSuccess: (callback: (token: string) => void) => ipcRenderer.on('auth-success', (_event, token) => callback(token)),
  
  // Server Management
  listServers: () => ipcRenderer.invoke('list-servers'),
  createServer: (data: { name: string; type: string; version: string }) => ipcRenderer.invoke('create-server', data),
  deleteServer: (name: string) => ipcRenderer.invoke('delete-server', name),
  startServer: (name: string) => ipcRenderer.send('start-server', name),
  stopServer: (name: string) => ipcRenderer.send('stop-server', name),
  sendCommand: (name: string, command: string) => ipcRenderer.send('send-command', { name, command }),
  
  // File System
  openFolder: (folderPath: string) => ipcRenderer.send('open-folder', folderPath),
  
  // Events
  onServerLog: (callback: (data: { name: string; log: string }) => void) => ipcRenderer.on('server-log', (_event, data) => callback(data)),
  onServerStatus: (callback: (data: { name: string; status: string }) => void) => ipcRenderer.on('server-status', (_event, data) => callback(data)),
  onServerStats: (callback: (stats: any) => void) => ipcRenderer.on('server-stats', (_event, stats) => callback(stats)),
  
  // App/Updates
  onUpdateAvailable: (callback: () => void) => ipcRenderer.on('update-available', () => callback()),
  onUpdateDownloaded: (callback: () => void) => ipcRenderer.on('update-downloaded', () => callback()),
  restartApp: () => ipcRenderer.send('restart-app'),
  checkJava: () => ipcRenderer.invoke('check-java'),
  installPlugin: (data: { serverName: string; plugin: any }) => ipcRenderer.invoke('install-plugin', data),
  installModpack: (data: { serverName: string; modpack: any }) => ipcRenderer.invoke('install-modpack', data),
  toggleAutoRestart: (name: string, enabled: boolean) => ipcRenderer.send('toggle-auto-restart', { name, enabled }),
});
