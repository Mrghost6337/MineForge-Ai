import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, RotateCcw, Terminal, Box, Puzzle, LogOut, Cpu, HardDrive, Download, Search, CheckCircle2, XCircle, ShoppingBag, Plus, Trash2, FolderOpen, Send, LayoutDashboard, Settings } from 'lucide-react';

// @ts-ignore
const api = window.electronAPI;

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [servers, setServers] = useState<string[]>([]);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [serverStatuses, setServerStatuses] = useState<Record<string, string>>({});
  const [autoRestarts, setAutoRestarts] = useState<Record<string, boolean>>({});
  const [serverLogs, setServerLogs] = useState<Record<string, string[]>>({});
  const [stats, setStats] = useState({ cpu: 0, ram: 0, totalRam: 0, freeRam: 0, tps: {} as Record<string, string> });
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);
  const [javaInfo, setJavaInfo] = useState<{ installed: boolean; version: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'marketplace' | 'create' | 'modpacks'>('dashboard');
  const [command, setCommand] = useState('');
  const [installingPlugin, setInstallingPlugin] = useState<string | null>(null);
  const [installingModpack, setInstallingModpack] = useState<string | null>(null);
  const [logFilter, setLogFilter] = useState('');
  const [creatingServer, setCreatingServer] = useState(false);
  const [newServerName, setNewServerName] = useState('');
  const [newServerType, setNewServerType] = useState('paper');
  const logsEndRef = useRef<HTMLDivElement>(null);

  const marketplacePlugins = [
    { id: '1', name: 'EssentialsX', desc: 'Essential commands for any server.', version: '2.20.1', downloads: '5M+', downloadUrl: 'https://github.com/EssentialsX/Essentials/releases/download/2.20.1/EssentialsX-2.20.1.jar' },
    { id: '2', name: 'WorldEdit', desc: 'Powerful in-game map editor.', version: '7.2.15', downloads: '10M+', downloadUrl: 'https://dev.bukkit.org/projects/worldedit/files/latest' },
    { id: '3', name: 'LuckPerms', desc: 'Advanced permissions management.', version: '5.4.102', downloads: '3M+', downloadUrl: 'https://download.luckperms.net/1515/bukkit/loader/LuckPerms-Bukkit-5.4.102.jar' },
    { id: '4', name: 'Vault', desc: 'Economy and permissions API.', version: '1.7.3', downloads: '8M+', downloadUrl: 'https://dev.bukkit.org/projects/vault/files/latest' },
    { id: '5', name: 'ViaVersion', desc: 'Allow newer clients to join older servers.', version: '4.9.2', downloads: '2M+', downloadUrl: 'https://github.com/ViaVersion/ViaVersion/releases/download/4.9.2/ViaVersion-4.9.2.jar' },
  ];

  const modpacks = [
    { id: 'm1', name: 'Better Minecraft', desc: 'The way Minecraft was meant to be.', version: 'v25', downloads: '1M+', downloadUrl: 'https://example.com/modpack1.zip' },
    { id: 'm2', name: 'RLCraft', desc: 'Real Life Craft - Survival at its hardest.', version: '2.9.3', downloads: '5M+', downloadUrl: 'https://example.com/rlcraft.zip' },
    { id: 'm3', name: 'SkyFactory 4', desc: 'Automation, magic, and more on a single tree.', version: '4.2.4', downloads: '3M+', downloadUrl: 'https://example.com/skyfactory.zip' },
  ];

  useEffect(() => {
    if (api) {
      api.onAuthSuccess((newToken: string) => setToken(newToken));
      
      api.onServerLog(({ name, log }: { name: string; log: string }) => {
        setServerLogs(prev => ({
          ...prev,
          [name]: [...(prev[name] || []), log].slice(-500)
        }));
      });

      api.onServerStatus(({ name, status }: { name: string; status: string }) => {
        setServerStatuses(prev => ({ ...prev, [name]: status }));
      });

      api.onServerStats((newStats: any) => setStats(newStats));
      api.onUpdateAvailable(() => setUpdateAvailable(true));
      api.onUpdateDownloaded(() => setUpdateDownloaded(true));

      api.checkJava().then((info: any) => setJavaInfo(info));
      
      refreshServers();
    }
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [serverLogs, selectedServer]);

  const refreshServers = async () => {
    if (api) {
      const list = await api.listServers();
      setServers(list);
      if (list.length > 0 && !selectedServer) {
        setSelectedServer(list[0]);
      }
    }
  };

  const handleCreateServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServerName || creatingServer) return;
    setCreatingServer(true);
    try {
      await api.createServer({ name: newServerName, type: newServerType, version: 'latest' });
      setNewServerName('');
      setActiveTab('dashboard');
      refreshServers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreatingServer(false);
    }
  };

  const handleDeleteServer = async (name: string) => {
    if (confirm(`Are you sure you want to delete ${name}? This cannot be undone.`)) {
      await api.deleteServer(name);
      if (selectedServer === name) setSelectedServer(null);
      refreshServers();
    }
  };

  const handleSendCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (command && selectedServer && serverStatuses[selectedServer] === 'online') {
      api.sendCommand(selectedServer, command);
      setCommand('');
    }
  };

  const handleInstallPlugin = async (plugin: any) => {
    if (!selectedServer) return;
    setInstallingPlugin(plugin.id);
    try {
      await api.installPlugin({ serverName: selectedServer, plugin });
      setServerLogs(prev => ({
        ...prev,
        [selectedServer]: [...(prev[selectedServer] || []), `[System] Successfully installed plugin: ${plugin.name}`]
      }));
    } finally {
      setInstallingPlugin(null);
    }
  };

  const handleInstallPlugin = async (plugin: any) => {
    if (!selectedServer) return;
    setInstallingPlugin(plugin.id);
    try {
      await api.installPlugin({ serverName: selectedServer, plugin });
      setServerLogs(prev => ({
        ...prev,
        [selectedServer]: [...(prev[selectedServer] || []), `[System] Successfully installed plugin: ${plugin.name}`]
      }));
    } finally {
      setInstallingPlugin(null);
    }
  };

  const handleInstallModpack = async (modpack: any) => {
    if (!selectedServer) return;
    setInstallingModpack(modpack.id);
    try {
      await api.installModpack({ serverName: selectedServer, modpack });
      setServerLogs(prev => ({
        ...prev,
        [selectedServer]: [...(prev[selectedServer] || []), `[System] Successfully installed modpack: ${modpack.name}`]
      }));
    } finally {
      setInstallingModpack(null);
    }
  };

  const handleToggleAutoRestart = (name: string) => {
    const newState = !autoRestarts[name];
    setAutoRestarts(prev => ({ ...prev, [name]: newState }));
    api.toggleAutoRestart(name, newState);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-6">
        <div className="bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-700">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Terminal className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold mb-2">MineForge Host</h1>
          <p className="text-gray-400 mb-8">Log in via your browser to connect this device to your MineForge account.</p>
          <button onClick={() => api?.openBrowserLogin()} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-xl transition-colors">
            Login with Browser
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-gray-700">
          <Terminal className="text-emerald-500 w-6 h-6" />
          <span className="font-bold text-lg">MineForge</span>
        </div>
        
        <div className="p-4">
          <button 
            onClick={() => setActiveTab('create')}
            className="w-full bg-emerald-600 hover:bg-emerald-500 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors mb-6"
          >
            <Plus className="w-4 h-4" /> New Server
          </button>

          <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-2 px-2">Your Servers</p>
            {servers.map(name => (
              <button
                key={name}
                onClick={() => { setSelectedServer(name); setActiveTab('dashboard'); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${selectedServer === name ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
              >
                <div className="flex items-center gap-2 truncate">
                  <div className={`w-2 h-2 rounded-full ${serverStatuses[name] === 'online' ? 'bg-emerald-500' : 'bg-gray-600'}`} />
                  <span className="truncate">{name}</span>
                </div>
                {selectedServer === name && <LayoutDashboard className="w-3 h-3 text-emerald-500" />}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto p-4 border-t border-gray-700 space-y-2">
          <button onClick={() => setActiveTab('marketplace')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === 'marketplace' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}>
            <ShoppingBag className="w-4 h-4" /> Marketplace
          </button>
          <button onClick={() => setActiveTab('modpacks')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === 'modpacks' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}>
            <Box className="w-4 h-4" /> Modpacks
          </button>
          <button onClick={() => setToken(null)} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-red-400 transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {updateAvailable && (
          <div className="bg-blue-600 px-4 py-2 flex items-center justify-between text-sm font-medium">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              {updateDownloaded ? 'Update ready to install!' : 'Update downloading...'}
            </div>
            {updateDownloaded && <button onClick={() => api?.restartApp()} className="bg-white text-blue-600 px-3 py-1 rounded-lg text-xs">Restart</button>}
          </div>
        )}

        <header className="bg-gray-800/50 backdrop-blur-md border-b border-gray-700 p-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">{activeTab === 'dashboard' ? (selectedServer || 'Dashboard') : activeTab === 'marketplace' ? 'Marketplace' : activeTab === 'modpacks' ? 'Modpacks' : 'Create Server'}</h2>
            {activeTab === 'dashboard' && selectedServer && (
              <div className="flex items-center gap-2 px-3 py-1 bg-gray-900 rounded-full text-xs font-medium border border-gray-700">
                <div className={`w-2 h-2 rounded-full ${serverStatuses[selectedServer] === 'online' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span className="text-gray-400 uppercase">{serverStatuses[selectedServer] || 'offline'}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            {javaInfo && (
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${javaInfo.installed ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {javaInfo.installed ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                Java {javaInfo.installed ? javaInfo.version : 'Missing'}
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'dashboard' && selectedServer ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full max-h-full overflow-hidden">
              <div className="lg:col-span-2 flex flex-col gap-6 overflow-hidden">
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex gap-4 shadow-sm">
                  <button 
                    onClick={() => api?.startServer(selectedServer)}
                    disabled={serverStatuses[selectedServer] === 'online' || !javaInfo?.installed}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors"
                  >
                    <Play className="w-4 h-4" /> Start
                  </button>
                  <button 
                    onClick={() => api?.stopServer(selectedServer)}
                    disabled={serverStatuses[selectedServer] !== 'online'}
                    className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors"
                  >
                    <Square className="w-4 h-4" /> Stop
                  </button>
                  <button 
                    onClick={() => api?.openFolder(`servers/${selectedServer}`)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors"
                  >
                    <FolderOpen className="w-4 h-4" /> Files
                  </button>
                  <button 
                    onClick={() => handleDeleteServer(selectedServer)}
                    className="w-12 bg-gray-700 hover:bg-red-600/20 hover:text-red-400 py-2 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 flex flex-col bg-gray-950 border border-gray-700 rounded-xl overflow-hidden">
                  <div className="p-2 bg-gray-900 border-b border-gray-700 flex items-center gap-2">
                    <Search className="w-3 h-3 text-gray-500" />
                    <input 
                      type="text" 
                      placeholder="Filter logs..." 
                      value={logFilter}
                      onChange={(e) => setLogFilter(e.target.value)}
                      className="bg-transparent border-none focus:ring-0 text-[10px] text-gray-400 w-full"
                    />
                  </div>
                  <div className="flex-1 p-4 font-mono text-xs overflow-y-auto">
                    {(serverLogs[selectedServer] || []).length === 0 ? (
                      <span className="text-gray-600 italic">Waiting for logs...</span>
                    ) : (
                      (serverLogs[selectedServer] || [])
                        .filter(log => log.toLowerCase().includes(logFilter.toLowerCase()))
                        .map((log, i) => <div key={i} className="text-gray-300 break-all mb-1">{log}</div>)
                    )}
                    <div ref={logsEndRef} />
                  </div>
                  <form onSubmit={handleSendCommand} className="p-2 bg-gray-900 border-t border-gray-700 flex gap-2">
                    <input 
                      type="text" 
                      value={command}
                      onChange={(e) => setCommand(e.target.value)}
                      placeholder="Type a command..."
                      className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-mono text-white placeholder-gray-600"
                    />
                    <button type="submit" className="p-2 text-gray-400 hover:text-white transition-colors">
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>

              <div className="space-y-6 overflow-y-auto">
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                  <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider mb-4">System Resources</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">CPU</span>
                        <span>{stats.cpu}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-1.5">
                        <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${stats.cpu}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">RAM</span>
                        <span>{stats.ram}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${stats.ram}%` }} />
                      </div>
                    </div>
                    {selectedServer && stats.tps[selectedServer] && (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">TPS</span>
                          <span className={parseFloat(stats.tps[selectedServer]) > 18 ? 'text-emerald-400' : 'text-orange-400'}>{stats.tps[selectedServer]}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-1.5">
                          <div className="bg-emerald-400 h-1.5 rounded-full transition-all" style={{ width: `${(parseFloat(stats.tps[selectedServer]) / 20) * 100}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                  <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => api?.openFolder(`servers/${selectedServer}/plugins`)} className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-medium transition-colors flex flex-col items-center gap-2">
                      <Puzzle className="w-4 h-4" /> Plugins
                    </button>
                    <button onClick={() => api?.openFolder(`servers/${selectedServer}/mods`)} className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-medium transition-colors flex flex-col items-center gap-2">
                      <Box className="w-4 h-4" /> Mods
                    </button>
                    <button onClick={() => api?.openFolder(`servers/${selectedServer}/logs`)} className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-medium transition-colors flex flex-col items-center gap-2">
                      <Terminal className="w-4 h-4" /> Logs
                    </button>
                    <button className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-medium transition-colors flex flex-col items-center gap-2">
                      <Settings className="w-4 h-4" /> Config
                    </button>
                    <button 
                      onClick={() => handleToggleAutoRestart(selectedServer)}
                      className={`p-3 rounded-lg text-xs font-medium transition-colors flex flex-col items-center gap-2 ${autoRestarts[selectedServer] ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-700 hover:bg-gray-600'}`}
                    >
                      <RotateCcw className={`w-4 h-4 ${autoRestarts[selectedServer] ? 'animate-spin-slow' : ''}`} /> Auto-Restart
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'create' ? (
            <div className="max-w-2xl mx-auto">
              <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8">
                <h3 className="text-2xl font-bold mb-6">Create New Server</h3>
                <form onSubmit={handleCreateServer} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Server Name</label>
                    <input 
                      type="text" 
                      value={newServerName}
                      onChange={(e) => setNewServerName(e.target.value)}
                      placeholder="e.g. Survival World"
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {['paper', 'fabric', 'forge'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNewServerType(type)}
                        className={`p-4 rounded-xl border-2 transition-all text-center ${newServerType === type ? 'border-emerald-500 bg-emerald-500/10' : 'border-gray-700 bg-gray-900 hover:border-gray-600'}`}
                      >
                        <span className="block font-bold capitalize">{type}</span>
                        <span className="text-[10px] text-gray-500">Latest Version</span>
                      </button>
                    ))}
                  </div>
                  <button type="submit" disabled={creatingServer} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 py-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                    {creatingServer ? (
                      <>
                        <RotateCcw className="w-5 h-5 animate-spin" />
                        Downloading Server Files...
                      </>
                    ) : 'Create Server'}
                  </button>
                </form>
              </div>
            </div>
          ) : activeTab === 'modpacks' ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-gray-400">Install complete modpacks to your selected server: <span className="text-white font-bold">{selectedServer || 'None selected'}</span></p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {modpacks.map(pack => (
                  <div key={pack.id} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 flex flex-col hover:border-gray-600 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center">
                        <Box className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-mono text-gray-500">{pack.version}</span>
                    </div>
                    <h4 className="text-lg font-bold mb-1">{pack.name}</h4>
                    <p className="text-sm text-gray-400 mb-6 flex-1">{pack.desc}</p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-xs text-gray-500 flex items-center gap-1"><Download className="w-3 h-3" /> {pack.downloads}</span>
                      <button 
                        onClick={() => handleInstallModpack(pack)}
                        disabled={!selectedServer || installingModpack === pack.id}
                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                      >
                        {installingModpack === pack.id ? 'Installing...' : 'Install'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'marketplace' ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-gray-400">Install popular plugins to your selected server: <span className="text-white font-bold">{selectedServer || 'None selected'}</span></p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="text" placeholder="Search plugins..." className="bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-emerald-500" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {marketplacePlugins.map(plugin => (
                  <div key={plugin.id} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 flex flex-col hover:border-gray-600 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center">
                        <Puzzle className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-mono text-gray-500">{plugin.version}</span>
                    </div>
                    <h4 className="text-lg font-bold mb-1">{plugin.name}</h4>
                    <p className="text-sm text-gray-400 mb-6 flex-1">{plugin.desc}</p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-xs text-gray-500 flex items-center gap-1"><Download className="w-3 h-3" /> {plugin.downloads}</span>
                      <button 
                        onClick={() => handleInstallPlugin(plugin)}
                        disabled={!selectedServer || installingPlugin === plugin.id}
                        className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                      >
                        {installingPlugin === plugin.id ? 'Installing...' : 'Install'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 bg-gray-800 rounded-3xl flex items-center justify-center mb-6">
                <LayoutDashboard className="w-10 h-10 text-gray-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">No Server Selected</h3>
              <p className="text-gray-500 mb-8 max-w-sm">Select a server from the sidebar or create a new one to start hosting.</p>
              <button onClick={() => setActiveTab('create')} className="bg-emerald-600 hover:bg-emerald-500 px-8 py-3 rounded-xl font-bold transition-colors">Create Your First Server</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
