import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '../components/ui/Button';
import { Code2, Play, Download, Settings, Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PluginBuilder() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{ pluginName: string; code: string; config: string } | null>(null);

  const handleGenerate = async () => {
    if (!prompt) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-plugin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      
      const data = await response.json();
      if (data.success) {
        setResult(data.data);
      }
    } catch (error) {
      console.error("Failed to generate plugin:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      <header className="border-b border-gray-200 bg-white/50 backdrop-blur-xl px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shadow-sm">
              <Code2 className="w-4 h-4 text-blue-500" />
            </div>
            <span className="font-semibold tracking-tight">Plugin Builder</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" className="hidden sm:flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configure API
          </Button>
          <Button variant="primary" size="sm" className="flex items-center gap-2" disabled={!result}>
            <Download className="w-4 h-4" />
            Export .jar
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Panel - Prompt */}
        <div className="w-full md:w-1/3 border-r border-gray-200 p-6 flex flex-col bg-white/30">
          <h2 className="text-lg font-semibold mb-2">Describe your plugin</h2>
          <p className="text-sm text-gray-500 mb-6">Be as specific as possible about commands, permissions, and events.</p>
          
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Create a Spigot plugin that adds a /heal command. It should cost 100 economy money and have a 60-second cooldown. Requires 'mineforge.heal' permission."
            className="flex-1 w-full p-4 rounded-2xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none shadow-sm mb-6"
          />
          
          <Button 
            variant="primary" 
            className="w-full flex items-center justify-center gap-2 h-12"
            onClick={handleGenerate}
            disabled={isGenerating || !prompt}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Generate Plugin
              </>
            )}
          </Button>
        </div>

        {/* Right Panel - Code Preview */}
        <div className="flex-1 bg-[#1e1e1e] flex flex-col overflow-hidden relative">
          {result ? (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-2 px-4 py-2 bg-[#2d2d2d] border-b border-[#404040] overflow-x-auto">
                <div className="px-4 py-1.5 bg-[#1e1e1e] text-blue-400 text-sm font-medium rounded-t-lg border-t border-blue-500/30">
                  {result.pluginName}.java
                </div>
                <div className="px-4 py-1.5 text-gray-400 hover:text-gray-200 text-sm font-medium cursor-pointer">
                  config.yml
                </div>
                <div className="px-4 py-1.5 text-gray-400 hover:text-gray-200 text-sm font-medium cursor-pointer">
                  plugin.yml
                </div>
              </div>
              <div className="flex-1 p-6 overflow-auto">
                <pre className="text-sm text-gray-300 font-mono leading-relaxed">
                  <code>{result.code}</code>
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center flex-col text-gray-500 p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                <Code2 className="w-8 h-8 text-gray-600" />
              </div>
              <p className="text-lg font-medium text-gray-400 mb-2">No code generated yet</p>
              <p className="text-sm max-w-sm">Enter a prompt on the left and click generate to see the AI build your plugin.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
