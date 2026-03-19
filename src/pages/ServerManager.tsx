import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from '../components/ui/Button';
import { Server, Play, Square, Settings, Loader2, ArrowLeft, Terminal, Activity, Users, Cpu, HardDrive, Download, Monitor, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { io, Socket } from 'socket.io-client';

export function ServerManager() {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [clientConnected, setClientConnected] = useState(false);
  const [hostOs, setHostOs] = useState<string | null>(null);
  
  const [status, setStatus] = useState<'offline' | 'starting' | 'online' | 'stopping'>('offline');
  const [logs, setLogs] = useState<string[]>([]);
  const [stats, setStats] = useState({ players: 0, tps: 0, cpu: 0, ram: 0 });
  const [commandInput, setCommandInput] = useState('');

  useEffect(() => {
    if (!user) return;

    // Connect to the WebSocket server
    const newSocket = io(window.location.origin);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('register_web', { userId: user.id });
    });

    newSocket.on('host_connected', (data) => {
      setClientConnected(true);
      setHostOs(data.os || 'Unknown OS');
    });

    newSocket.on('host_disconnected', () => {
      setClientConnected(false);
      setStatus('offline');
    });

    newSocket.on('server_log', (log: string) => {
      setLogs(prev => [...prev, log].slice(-100)); // Keep last 100 logs
    });

    newSocket.on('server_stats', (newStats) => {
      setStats(newStats);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const handleStart = () => {
    if (!socket || !clientConnected) return;
    setStatus('starting');
    socket.emit('command_to_host', { userId: user?.id, command: 'start_server' });
    
    // Simulate startup for UI if real host doesn't respond immediately
    setTimeout(() => setStatus('online'), 4000);
  };

  const handleStop = () => {
    if (!socket || !clientConnected) return;
    setStatus('stopping');
    socket.emit('command_to_host', { userId: user?.id, command: 'stop_server' });
    
    // Simulate stop for UI
    setTimeout(() => setStatus('offline'), 2500);
  };

  const handleSendCommand = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && commandInput.trim() && socket && clientConnected) {
      socket.emit('command_to_host', { userId: user?.id, command: `cmd:${commandInput}` });
      setCommandInput('');
    }
  };

  if (!clientConnected) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
        <header className="border-b border-gray-200 bg-white/50 backdrop-blur-xl px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
          <Link to="/dashboard" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-sm">
              <Server className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="font-semibold tracking-tight">Server Hosting</span>
          </div>
        </header>

        <main className="flex-1 p-6 flex items-center justify-center">
          <div className="max-w-3xl w-full">
            <div className="text-center mb-12">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-emerald-200">
                <Monitor className="w-10 h-10" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight mb-4 text-gray-900">Local Host Client Required</h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                MineForge AI runs servers directly on your own hardware for maximum performance and zero monthly hosting fees. 
                To manage servers from this dashboard, you must install the desktop client.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm text-center hover:border-blue-300 transition-colors group">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.951-1.801"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Windows 10/11</h3>
                <p className="text-gray-500 mb-6 text-sm">Requires Node.js (Auto-installed)</p>
                <div className="flex flex-col gap-2">
                  <a href={`/api/download-host-client?os=windows&userId=${user?.id}`} download="MineForgeHost-Setup.bat">
                    <Button variant="primary" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      <Download className="w-4 h-4 mr-2" />
                      Download .bat Installer
                    </Button>
                  </a>
                  <a href="/api/download-source">
                    <Button variant="secondary" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50">
                      <Download className="w-4 h-4 mr-2" />
                      Download Source (ZIP)
                    </Button>
                  </a>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm text-center hover:border-gray-400 transition-colors group">
                <div className="w-16 h-16 bg-gray-100 text-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" opacity="0"/>
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.26-.79 3.59-.76 1.56.04 2.87.73 3.65 1.89-3.14 1.87-2.61 5.81.48 7.04-.73 1.81-1.68 3.16-2.8 4zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">macOS</h3>
                <p className="text-gray-500 mb-6 text-sm">Apple Silicon & Intel (macOS 12+)</p>
                <div className="flex flex-col gap-2">
                  <a href={`/api/download-host-client?os=mac&userId=${user?.id}`} download="MineForgeHost.dmg">
                    <Button variant="primary" className="w-full bg-gray-900 hover:bg-black text-white">
                      <Download className="w-4 h-4 mr-2" />
                      Download .dmg
                    </Button>
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-6 text-left">
              <h4 className="font-semibold text-blue-900 mb-4 text-lg">Installation Guide</h4>
              
              <div className="space-y-6">
                <div>
                  <h5 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.951-1.801"/></svg>
                    For Windows Users
                  </h5>
                  <p className="text-sm text-blue-800 mb-2">
                    Windows uses <strong>.bat</strong> (Batch) files for automated setup.
                  </p>
                  <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1 ml-2">
                    <li>Download the <code>.bat</code> file using the button above.</li>
                    <li>Right-click the downloaded file and select <strong>Run as Administrator</strong>.</li>
                    <li>The script will automatically check for Node.js and set up the client.</li>
                    <li>A shortcut will be created on your Desktop for easy access.</li>
                  </ol>
                </div>

                <div className="border-t border-blue-200 pt-4">
                  <h5 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.26-.79 3.59-.76 1.56.04 2.87.73 3.65 1.89-3.14 1.87-2.61 5.81.48 7.04-.73 1.81-1.68 3.16-2.8 4zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                    For Mac Users (macOS)
                  </h5>
                  <p className="text-sm text-blue-800 mb-3">
                    MacBooks use different file types for applications. Here is a quick overview:
                  </p>
                  <ul className="space-y-3 text-sm text-blue-800 ml-2">
                    <li className="flex items-start gap-2">
                      <span className="font-mono font-bold bg-blue-100 px-1.5 py-0.5 rounded text-xs mt-0.5">.dmg</span>
                      <span>A 'disk image' that you open like a virtual drive. You simply drag the program into your Applications folder.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-mono font-bold bg-blue-100 px-1.5 py-0.5 rounded text-xs mt-0.5">.pkg</span>
                      <span>An installation package that starts a setup wizard (similar to .msi files on Windows).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-mono font-bold bg-blue-100 px-1.5 py-0.5 rounded text-xs mt-0.5">.app</span>
                      <span>This is the final application file itself (similar to an installed .exe on Windows).</span>
                    </li>
                  </ul>
                  <div className="mt-4 bg-blue-100/50 p-3 rounded-xl">
                    <p className="text-sm font-semibold text-blue-900 mb-1">How to install:</p>
                    <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1 ml-1">
                      <li>Download the <code>.dmg</code> file using the button above.</li>
                      <li>Double-click to open the virtual drive.</li>
                      <li>Drag the MineForge <code>.app</code> icon into the Applications folder.</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                <div>
                  <h4 className="font-semibold text-emerald-900">Waiting for connection...</h4>
                  <p className="text-sm text-emerald-700">Install and run the client. It will automatically connect to your account.</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      <header className="border-b border-gray-200 bg-white/50 backdrop-blur-xl px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-sm">
              <Server className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h1 className="font-semibold tracking-tight leading-tight">Local Server</h1>
              <div className="flex items-center gap-2 text-xs">
                <span className={`w-2 h-2 rounded-full ${status === 'online' ? 'bg-emerald-500' : status === 'offline' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'}`}></span>
                <span className="text-gray-500 capitalize">{status}</span>
                <span className="text-gray-300">•</span>
                <span className="text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Connected to {hostOs}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" className="hidden sm:flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </Button>
          
          {status === 'offline' ? (
            <Button variant="primary" size="sm" className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleStart}>
              <Play className="w-4 h-4" />
              Start Server
            </Button>
          ) : status === 'online' ? (
            <Button variant="primary" size="sm" className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white" onClick={handleStop}>
              <Square className="w-4 h-4" />
              Stop Server
            </Button>
          ) : (
            <Button variant="secondary" size="sm" className="flex items-center gap-2" disabled>
              <Loader2 className="w-4 h-4 animate-spin" />
              {status === 'starting' ? 'Starting...' : 'Stopping...'}
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Players</p>
                <p className="text-2xl font-semibold">{status === 'online' ? `${stats.players}/50` : '0/50'}</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">TPS</p>
                <p className="text-2xl font-semibold">{status === 'online' ? stats.tps.toFixed(1) : '0.0'}</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-500">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Host CPU</p>
                <p className="text-2xl font-semibold">{status === 'online' ? `${stats.cpu}%` : '0%'}</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                <HardDrive className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Host RAM</p>
                <p className="text-2xl font-semibold">{status === 'online' ? `${stats.ram} GB` : '0 GB'}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Console */}
            <div className="lg:col-span-2 bg-[#1e1e1e] rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[500px]">
              <div className="px-4 py-3 border-b border-[#333] flex items-center gap-2 bg-[#252526]">
                <Terminal className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-300">Local Server Console</span>
              </div>
              <div className="flex-1 p-4 overflow-auto font-mono text-sm text-gray-300 space-y-1">
                {logs.length === 0 && <div className="text-gray-500 italic">Waiting for server logs...</div>}
                {logs.map((log, i) => (
                  <div key={i} className="break-all">
                    {log.includes('INFO') ? (
                      <span className="text-blue-400">{log}</span>
                    ) : log.includes('WARN') ? (
                      <span className="text-yellow-400">{log}</span>
                    ) : log.includes('ERROR') ? (
                      <span className="text-red-400">{log}</span>
                    ) : (
                      log
                    )}
                  </div>
                ))}
              </div>
              <div className="p-2 bg-[#252526] border-t border-[#333]">
                <input 
                  type="text" 
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  onKeyDown={handleSendCommand}
                  placeholder="Enter command..." 
                  className="w-full bg-[#1e1e1e] border border-[#404040] rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
                  disabled={status !== 'online'}
                />
              </div>
            </div>

            {/* Quick Actions & Info */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold mb-4">Local Host Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Software</span>
                    <span className="font-medium">PaperMC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Version</span>
                    <span className="font-medium">1.20.4</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Host OS</span>
                    <span className="font-medium">{hostOs}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Local Path</span>
                    <span className="font-medium font-mono text-xs truncate max-w-[120px]" title="~/MineForge/servers/server1">
                      ~/MineForge/...
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold mb-4">Host Actions</h3>
                <div className="space-y-2">
                  <Button variant="secondary" className="w-full justify-start">Restart Server</Button>
                  <Button variant="secondary" className="w-full justify-start">Sync Plugins</Button>
                  <Button variant="secondary" className="w-full justify-start">Open Local Folder</Button>
                  <Button variant="secondary" className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700">Disconnect Host</Button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
