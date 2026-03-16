import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '../components/ui/Button';
import { Server, Play, Square, Settings, Loader2, ArrowLeft, Terminal, Activity, Users, Cpu, HardDrive } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ServerManager() {
  const [status, setStatus] = useState<'offline' | 'starting' | 'online' | 'stopping'>('offline');
  const [logs, setLogs] = useState<string[]>([
    "[10:00:00] [Server thread/INFO]: Starting minecraft server version 1.20.4",
    "[10:00:00] [Server thread/INFO]: Loading properties",
    "[10:00:00] [Server thread/INFO]: Default game type: SURVIVAL",
    "[10:00:00] [Server thread/INFO]: Generating keypair",
    "[10:00:01] [Server thread/INFO]: Starting Minecraft server on *:25565",
    "[10:00:01] [Server thread/INFO]: Using default channel type",
  ]);

  const handleStart = async () => {
    setStatus('starting');
    
    // Simulate startup sequence
    setTimeout(() => setLogs(prev => [...prev, "[10:00:05] [Server thread/INFO]: Preparing level \"world\""]), 1000);
    setTimeout(() => setLogs(prev => [...prev, "[10:00:07] [Server thread/INFO]: Preparing start region for dimension minecraft:overworld"]), 2000);
    setTimeout(() => setLogs(prev => [...prev, "[10:00:09] [Server thread/INFO]: Time elapsed: 4200 ms"]), 3000);
    setTimeout(() => {
      setLogs(prev => [...prev, "[10:00:10] [Server thread/INFO]: Done (10.123s)! For help, type \"help\""]);
      setStatus('online');
    }, 4000);
  };

  const handleStop = async () => {
    setStatus('stopping');
    setTimeout(() => setLogs(prev => [...prev, "[10:05:00] [Server thread/INFO]: Stopping server"]), 500);
    setTimeout(() => setLogs(prev => [...prev, "[10:05:01] [Server thread/INFO]: Saving chunks for level 'ServerLevel'..."]), 1500);
    setTimeout(() => {
      setLogs(prev => [...prev, "[10:05:02] [Server thread/INFO]: ThreadedAnvilChunkStorage: All dimensions are saved"]);
      setStatus('offline');
    }, 2500);
  };

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
              <h1 className="font-semibold tracking-tight leading-tight">Survival SMP</h1>
              <div className="flex items-center gap-2 text-xs">
                <span className={`w-2 h-2 rounded-full ${status === 'online' ? 'bg-emerald-500' : status === 'offline' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'}`}></span>
                <span className="text-gray-500 capitalize">{status}</span>
                <span className="text-gray-300">•</span>
                <span className="text-gray-500 font-mono">play.mineforge.ai:25565</span>
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
                <p className="text-2xl font-semibold">{status === 'online' ? '12/50' : '0/50'}</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">TPS</p>
                <p className="text-2xl font-semibold">{status === 'online' ? '20.0' : '0.0'}</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-500">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">CPU Usage</p>
                <p className="text-2xl font-semibold">{status === 'online' ? '45%' : '0%'}</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                <HardDrive className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">RAM Usage</p>
                <p className="text-2xl font-semibold">{status === 'online' ? '4.2 / 8 GB' : '0 / 8 GB'}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Console */}
            <div className="lg:col-span-2 bg-[#1e1e1e] rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[500px]">
              <div className="px-4 py-3 border-b border-[#333] flex items-center gap-2 bg-[#252526]">
                <Terminal className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-300">Server Console</span>
              </div>
              <div className="flex-1 p-4 overflow-auto font-mono text-sm text-gray-300 space-y-1">
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
                  placeholder="Enter command..." 
                  className="w-full bg-[#1e1e1e] border border-[#404040] rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
                  disabled={status !== 'online'}
                />
              </div>
            </div>

            {/* Quick Actions & Info */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold mb-4">Server Details</h3>
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
                    <span className="text-gray-500">Node</span>
                    <span className="font-medium">EU-West-1a</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Plan</span>
                    <span className="font-medium text-purple-600">Pro (8GB)</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Button variant="secondary" className="w-full justify-start">Restart Server</Button>
                  <Button variant="secondary" className="w-full justify-start">Manage Plugins</Button>
                  <Button variant="secondary" className="w-full justify-start">File Manager</Button>
                  <Button variant="secondary" className="w-full justify-start">Backups</Button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
