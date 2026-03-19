import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '../components/ui/Button';
import { Box, Play, Download, Settings, Loader2, ArrowLeft, Search, Filter, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useAuth } from '../lib/auth-context';
import { Lock, Coins } from 'lucide-react';

export function ModpackBuilder() {
  const { userPlan, credits, useCredits } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<{ name: string; mods: any[] } | null>(null);
  const [analysis, setAnalysis] = useState<{ score: number; issues: { type: string; message: string }[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiModel, setAiModel] = useState<'standard' | 'advanced' | 'ultra'>('standard');
  const [loader, setLoader] = useState('Fabric');
  const [mcVersion, setMcVersion] = useState('1.20.4');

  const handleGenerate = async () => {
    if (!prompt) return;
    
    // Check API Key for paid models
    if (aiModel === 'advanced' || aiModel === 'ultra') {
      try {
        // @ts-ignore
        if (window.aistudio && window.aistudio.hasSelectedApiKey) {
          // @ts-ignore
          const hasKey = await window.aistudio.hasSelectedApiKey();
          if (!hasKey) {
            // @ts-ignore
            await window.aistudio.openSelectKey();
            // Assume success and continue, but if it fails, the server will catch it
          }
        }
      } catch (e) {
        console.error("Failed to check/open API key selector", e);
      }
    } else {
      // Check credits for free model
      if (!useCredits(1)) {
        setError("You don't have enough credits to generate a modpack. Please upgrade your plan.");
        return;
      }
    }
    
    setIsGenerating(true);
    setAnalysis(null);
    setError(null);
    try {
      const response = await fetch('/api/ai/generate-modpack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, version: mcVersion, loader, model: aiModel })
      });
      
      const data = await response.json();
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || "Failed to generate modpack");
      }
    } catch (err: any) {
      console.error("Failed to generate modpack:", err);
      setError(err.message === 'Failed to fetch' ? 'Failed to connect to the AI server. Please try again.' : err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnalyze = async () => {
    if (!result) return;
    
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/ai/analyze-modpack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mods: result.mods,
          loader,
          version: mcVersion,
          model: aiModel
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setAnalysis(data.data);
      }
    } catch (error) {
      console.error("Failed to analyze modpack:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;

    const zip = new JSZip();
    
    // Create a basic CurseForge-compatible manifest.json
    const manifest = {
      minecraft: {
        version: mcVersion,
        modLoaders: [
          {
            id: `${loader.toLowerCase()}-latest`,
            primary: true
          }
        ]
      },
      manifestType: "minecraftModpack",
      manifestVersion: 1,
      name: result.name,
      version: "1.0.0",
      author: "MineForge AI",
      files: result.mods.map((mod, index) => ({
        projectID: 100000 + index, // Mock IDs
        fileID: 200000 + index,
        required: true
      })),
      overrides: "overrides"
    };
    
    zip.file("manifest.json", JSON.stringify(manifest, null, 2));
    zip.folder("overrides");

    zip.generateAsync({ type: "blob" }).then(function(content) {
      saveAs(content, `${result.name.replace(/\\s+/g, '-')}.zip`);
    });
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
          {result && (
            <Button variant="secondary" size="sm" className="flex items-center gap-2" onClick={handleAnalyze} disabled={isAnalyzing}>
              {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Analyze Modpack
            </Button>
          )}
          <Button variant="primary" size="sm" className="flex items-center gap-2" disabled={!result} onClick={handleDownload}>
            <Download className="w-4 h-4" />
            Export Modpack (.zip)
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Panel - Prompt */}
        <div className="w-full md:w-1/3 border-r border-gray-200 p-6 flex flex-col bg-white/30 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Describe your modpack</h2>
            {userPlan === 'free' && (
              <div className="flex items-center gap-1.5 bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full text-xs font-medium border border-purple-100">
                <Coins className="w-3.5 h-3.5" />
                {credits} Credits
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-6">Specify the theme, Minecraft version, and modloader.</p>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mod Loader</label>
              <select 
                value={loader} 
                onChange={(e) => setLoader(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-sm text-sm"
              >
                <option value="Fabric">Fabric</option>
                <option value="Forge">Forge</option>
                <option value="NeoForge">NeoForge</option>
                <option value="Quilt">Quilt</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Minecraft Version</label>
              <select 
                value={mcVersion} 
                onChange={(e) => setMcVersion(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-sm text-sm"
              >
                <option value="1.21">1.21</option>
                <option value="1.20.4">1.20.4</option>
                <option value="1.19.4">1.19.4</option>
                <option value="1.18.2">1.18.2</option>
                <option value="1.16.5">1.16.5</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">AI Model</label>
            <div className="flex flex-col gap-2">
              <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${aiModel === 'standard' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                <input type="radio" name="model" value="standard" checked={aiModel === 'standard'} onChange={() => setAiModel('standard')} className="w-4 h-4 text-purple-600" />
                <div className="flex-1">
                  <span className="block text-sm font-medium">Standard Model</span>
                  <span className="block text-xs text-gray-500">Fast, good for simple modpacks</span>
                </div>
              </label>
              
              <label className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${userPlan === 'free' ? 'opacity-50 cursor-not-allowed bg-gray-50' : aiModel === 'advanced' ? 'border-purple-500 bg-purple-50 cursor-pointer' : 'border-gray-200 bg-white hover:bg-gray-50 cursor-pointer'}`}>
                <input type="radio" name="model" value="advanced" checked={aiModel === 'advanced'} onChange={() => userPlan !== 'free' && setAiModel('advanced')} disabled={userPlan === 'free'} className="w-4 h-4 text-purple-600" />
                <div className="flex-1 flex items-center justify-between">
                  <div>
                    <span className="block text-sm font-medium">Advanced Model</span>
                    <span className="block text-xs text-gray-500">Better logic & complex systems</span>
                  </div>
                  {userPlan === 'free' && <Lock className="w-4 h-4 text-gray-400" />}
                  {userPlan !== 'free' && <span className="text-[10px] uppercase font-bold tracking-wider bg-gradient-to-r from-amber-200 to-orange-300 text-orange-900 px-2 py-0.5 rounded-full">Pro</span>}
                </div>
              </label>

              <label className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${userPlan !== 'ultra' ? 'opacity-50 cursor-not-allowed bg-gray-50' : aiModel === 'ultra' ? 'border-purple-500 bg-purple-50 cursor-pointer' : 'border-gray-200 bg-white hover:bg-gray-50 cursor-pointer'}`}>
                <input type="radio" name="model" value="ultra" checked={aiModel === 'ultra'} onChange={() => userPlan === 'ultra' && setAiModel('ultra')} disabled={userPlan !== 'ultra'} className="w-4 h-4 text-purple-600" />
                <div className="flex-1 flex items-center justify-between">
                  <div>
                    <span className="block text-sm font-medium">Ultra Model</span>
                    <span className="block text-xs text-gray-500">Maximum context & optimization</span>
                  </div>
                  {userPlan !== 'ultra' && <Lock className="w-4 h-4 text-gray-400" />}
                  {userPlan === 'ultra' && <span className="text-[10px] uppercase font-bold tracking-wider bg-gradient-to-r from-purple-400 to-pink-500 text-white px-2 py-0.5 rounded-full">Ultra</span>}
                </div>
              </label>
            </div>
          </div>
          
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Create a performance optimized exploration modpack with RPG mechanics and magic."
            className="flex-1 w-full p-4 rounded-2xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none shadow-sm mb-4 min-h-[150px]"
          />
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}
          
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
                  <p className="text-sm text-gray-500">{result.mods.length} mods resolved • {loader} {mcVersion}</p>
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

              {/* Analysis Panel */}
              {analysis && (
                <motion.div 
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="bg-white border-t border-gray-200 p-6 max-h-64 overflow-y-auto shadow-[0_-10px_40px_rgba(0,0,0,0.05)]"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-900 font-semibold flex items-center gap-2">
                      <Search className="w-4 h-4 text-purple-500" />
                      AI Analysis Report
                    </h3>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${analysis.score >= 80 ? 'bg-green-50 text-green-600 border border-green-200' : analysis.score >= 50 ? 'bg-yellow-50 text-yellow-600 border border-yellow-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                      Score: {analysis.score}/100
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {analysis.issues.map((issue, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                        {issue.type === 'error' && <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />}
                        {issue.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />}
                        {issue.type === 'suggestion' && <CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />}
                        
                        <p className="text-sm text-gray-700">{issue.message}</p>
                      </div>
                    ))}
                    {analysis.issues.length === 0 && (
                      <div className="text-sm text-gray-500 p-2">No issues found. The modpack looks great!</div>
                    )}
                  </div>
                </motion.div>
              )}
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
