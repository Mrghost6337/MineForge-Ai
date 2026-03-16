import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '../components/ui/Button';
import { Box, Play, Download, Settings, Loader2, ArrowLeft, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ModpackBuilder() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{ name: string; mods: any[] } | null>(null);

  const handleGenerate = async () => {
    if (!prompt) return;
    
    setIsGenerating(true);
    try {
      // Simulate AI generation delay
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      setResult({
        name: "RPG Exploration Pack",
        mods: [
          { name: "Sodium", version: "0.5.8", category: "Performance", downloads: "45M" },
          { name: "Iris Shaders", version: "1.7.0", category: "Graphics", downloads: "22M" },
          { name: "Terralith", version: "2.4.11", category: "World Gen", downloads: "15M" },
          { name: "Better Combat", version: "1.8.4", category: "Combat", downloads: "8M" },
          { name: "Waystones", version: "14.1.2", category: "Utility", downloads: "35M" },
          { name: "JEI", version: "15.3.0", category: "Utility", downloads: "120M" },
        ]
      });
    } catch (error) {
      console.error("Failed to generate modpack:", error);
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
            <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shadow-sm">
              <Box className="w-4 h-4 text-purple-500" />
            </div>
            <span className="font-semibold tracking-tight">Modpack Studio</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" className="hidden sm:flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Modrinth API
          </Button>
          <Button variant="primary" size="sm" className="flex items-center gap-2" disabled={!result}>
            <Download className="w-4 h-4" />
            Export .mrpack
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Panel - Prompt */}
        <div className="w-full md:w-1/3 border-r border-gray-200 p-6 flex flex-col bg-white/30">
          <h2 className="text-lg font-semibold mb-2">Describe your modpack</h2>
          <p className="text-sm text-gray-500 mb-6">Specify the theme, Minecraft version, and modloader (Fabric/Forge).</p>
          
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Create a performance optimized exploration modpack with RPG mechanics and magic for Fabric 1.20.4."
            className="flex-1 w-full p-4 rounded-2xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none shadow-sm mb-6"
          />
          
          <Button 
            variant="primary" 
            className="w-full flex items-center justify-center gap-2 h-12 bg-purple-600 hover:bg-purple-700 text-white"
            onClick={handleGenerate}
            disabled={isGenerating || !prompt}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Resolving Dependencies...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Generate Modpack
              </>
            )}
          </Button>
        </div>

        {/* Right Panel - Mod List Preview */}
        <div className="flex-1 bg-white flex flex-col overflow-hidden relative">
          {result ? (
            <div className="flex-1 flex flex-col">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{result.name}</h3>
                  <p className="text-sm text-gray-500">{result.mods.length} mods resolved • Fabric 1.20.4</p>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Search mods..." className="pl-9 pr-4 py-2 rounded-full border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20" />
                  </div>
                  <Button variant="secondary" size="sm" className="rounded-full px-3">
                    <Filter className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 overflow-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.mods.map((mod, i) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={i} 
                      className="p-4 rounded-2xl border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all bg-white flex items-start justify-between group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                          <Box className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 group-hover:text-purple-600 transition-colors">{mod.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{mod.category}</span>
                            <span className="text-xs text-gray-500">v{mod.version}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-400 font-medium">{mod.downloads}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center flex-col text-gray-500 p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mb-4 border border-purple-100">
                <Box className="w-8 h-8 text-purple-300" />
              </div>
              <p className="text-lg font-medium text-gray-400 mb-2">No modpack generated yet</p>
              <p className="text-sm max-w-sm">Enter a prompt on the left to let AI curate the perfect modpack for you.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
