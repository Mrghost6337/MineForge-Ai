import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  openBrowserLogin: () => ipcRenderer.send('open-browser-login'),
  onAuthSuccess: (callback: (token: string) => void) => ipcRenderer.on('auth-success', (_event, token) => callback(token)),
  startServer: () => ipcRenderer.send('start-server'),
  stopServer: () => ipcRenderer.send('stop-server'),
  restartServer: () => ipcRenderer.send('restart-server'),
  openFolder: (folderName: string) => ipcRenderer.send('open-folder', folderName),
  onServerLog: (callback: (log: string) => void) => ipcRenderer.on('server-log', (_event, log) => callback(log)),
  onServerStatus: (callback: (status: string) => void) => ipcRenderer.on('server-status', (_event, status) => callback(status)),
});
