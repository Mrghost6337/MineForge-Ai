import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, RotateCcw, Terminal, Box, Puzzle, LogOut } from 'lucide-react';

// @ts-ignore
const api = window.electronAPI;

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<'offline' | 'online'>('offline');
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (api) {
      api.onAuthSuccess((newToken: string) => {
        setToken(newToken);
      });
      api.onServerLog((log: string) => {
        setLogs(prev => [...prev, log].slice(-200));
      });
      api.onServerStatus((newStatus: 'offline' | 'online') => {
        setStatus(newStatus);
      });
    }
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleLogin = () => {
    if (api) api.openBrowserLogin();
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
          <button 
            onClick={handleLogin}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
          >
            Login with Browser
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <header className="bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Terminal className="text-emerald-500" />
          <h1 className="font-bold text-lg">MineForge Host Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${status === 'online' ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-400 uppercase font-semibold">{status}</span>
          </div>
          <button onClick={() => setToken(null)} className="text-gray-400 hover:text-white transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex gap-4">
            <button 
              onClick={() => api?.startServer()}
              disabled={status === 'online'}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors"
            >
              <Play className="w-4 h-4" /> Start
            </button>
            <button 
              onClick={() => api?.stopServer()}
              disabled={status === 'offline'}
              className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors"
            >
              <Square className="w-4 h-4" /> Stop
            </button>
            <button 
              onClick={() => api?.restartServer()}
              disabled={status === 'offline'}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Restart
            </button>
          </div>

          <div className="flex-1 bg-gray-950 border border-gray-700 rounded-xl p-4 font-mono text-sm overflow-y-auto h-[400px]">
            {logs.length === 0 ? (
              <span className="text-gray-600">Server console output will appear here...</span>
            ) : (
              logs.map((log, i) => <div key={i} className="text-gray-300 break-all">{log}</div>)
            )}
            <div ref={logsEndRef} />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Puzzle className="w-5 h-5 text-purple-400" /> Plugins</h2>
            <p className="text-sm text-gray-400 mb-4">Manage plugins in your local server directory.</p>
            <button onClick={() => api?.openFolder('plugins')} className="w-full bg-gray-700 hover:bg-gray-600 py-2 rounded-lg text-sm font-medium transition-colors">Open Plugins Folder</button>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Box className="w-5 h-5 text-orange-400" /> Modpacks</h2>
            <p className="text-sm text-gray-400 mb-4">Manage installed modpacks.</p>
            <button onClick={() => api?.openFolder('modpacks')} className="w-full bg-gray-700 hover:bg-gray-600 py-2 rounded-lg text-sm font-medium transition-colors">Open Modpacks Folder</button>
          </div>
        </div>
      </main>
    </div>
  );
}
