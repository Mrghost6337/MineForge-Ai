import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '../components/ui/Button';
import { Pickaxe, Play, Download, Settings, Loader2, ArrowLeft, Image as ImageIcon, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';

export function LitematicaGen() {
  const { userPlan } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{ name: string; dimensions: string; blocks: number } | null>(null);

  const handleGenerate = async () => {
    if (!prompt) return;
    
    setIsGenerating(true);
    try {
      // Simulate AI generation delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setResult({
        name: "Medieval Castle Keep",
        dimensions: "32x45x32",
        blocks: 14520
      });
    } catch (error) {
      console.error("Failed to generate structure:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (userPlan === 'free') {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
        <header className="border-b border-gray-200 bg-white/50 backdrop-blur-xl px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
          <Link to="/dashboard" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shadow-sm">
              <Pickaxe className="w-4 h-4 text-amber-500" />
            </div>
            <span className="font-semibold tracking-tight">Litematica Generator</span>
            <span className="text-[10px] uppercase font-bold tracking-wider bg-gradient-to-r from-amber-200 to-orange-300 text-orange-900 px-2 py-0.5 rounded-full ml-2">Pro</span>
          </div>
        </header>

        <main className="flex-1 p-6 flex items-center justify-center">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-gray-200 shadow-sm text-center">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Pro Feature</h2>
            <p className="text-gray-500 mb-8">
              The AI Litematica Generator is only available on Pro and Ultra plans. Upgrade your account to generate 3D structures instantly.
            </p>
            <Button variant="primary" className="w-full bg-amber-500 hover:bg-amber-600 text-white">
              Upgrade to Pro
            </Button>
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
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shadow-sm">
              <Pickaxe className="w-4 h-4 text-amber-500" />
            </div>
            <span className="font-semibold tracking-tight">Litematica Generator</span>
            <span className="text-[10px] uppercase font-bold tracking-wider bg-gradient-to-r from-amber-200 to-orange-300 text-orange-900 px-2 py-0.5 rounded-full ml-2">Pro</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" className="hidden sm:flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Block Palette
          </Button>
          <Button variant="primary" size="sm" className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white" disabled={!result}>
            <Download className="w-4 h-4" />
            Export .litematic
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Panel - Prompt */}
        <div className="w-full md:w-1/3 border-r border-gray-200 p-6 flex flex-col bg-white/30">
          <h2 className="text-lg font-semibold mb-2">Describe your structure</h2>
          <p className="text-sm text-gray-500 mb-6">Describe the building, style, and approximate size. You can also upload a reference image.</p>
          
          <div className="mb-4 p-4 border-2 border-dashed border-gray-200 rounded-2xl bg-white/50 text-center hover:bg-gray-50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 h-32">
            <ImageIcon className="w-6 h-6 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">Drop reference image here</span>
            <span className="text-xs text-gray-400">or click to browse</span>
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A medieval castle keep with 4 corner towers, made of stone bricks and deepslate. Approximately 30x30 footprint."
            className="flex-1 w-full p-4 rounded-2xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none shadow-sm mb-6"
          />
          
          <Button 
            variant="primary" 
            className="w-full flex items-center justify-center gap-2 h-12 bg-amber-600 hover:bg-amber-700 text-white"
            onClick={handleGenerate}
            disabled={isGenerating || !prompt}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Voxels...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Generate Structure
              </>
            )}
          </Button>
        </div>

        {/* Right Panel - 3D Preview (Placeholder) */}
        <div className="flex-1 bg-[#f8f9fa] flex flex-col overflow-hidden relative">
          {result ? (
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between shadow-sm z-10">
                <div>
                  <h3 className="font-semibold text-gray-900">{result.name}</h3>
                  <p className="text-xs text-gray-500">Dimensions: {result.dimensions} • Blocks: {result.blocks.toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm">Top View</Button>
                  <Button variant="secondary" size="sm">Reset Camera</Button>
                </div>
              </div>
              
              <div className="flex-1 relative flex items-center justify-center bg-gray-100 overflow-hidden">
                {/* 3D Viewer Placeholder */}
                <div className="absolute inset-0 opacity-20" style={{
                  backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }}></div>
                
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="relative z-10 w-64 h-64 bg-amber-100/50 border border-amber-200 rounded-xl shadow-lg flex items-center justify-center backdrop-blur-sm"
                  style={{ transform: 'rotateX(60deg) rotateZ(45deg)' }}
                >
                  <div className="text-center">
                    <Pickaxe className="w-12 h-12 text-amber-500 mx-auto mb-2 opacity-50" />
                    <p className="text-amber-800 font-medium">Interactive 3D Preview</p>
                    <p className="text-amber-600/70 text-xs">WebGL Viewer Loading...</p>
                  </div>
                </motion.div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center flex-col text-gray-500 p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-4 border border-amber-100">
                <Pickaxe className="w-8 h-8 text-amber-300" />
              </div>
              <p className="text-lg font-medium text-gray-400 mb-2">No structure generated yet</p>
              <p className="text-sm max-w-sm">Enter a prompt on the left to generate a 3D structure for Litematica.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
