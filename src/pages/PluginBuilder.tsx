import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from '../components/ui/Button';
import { Code2, Play, Download, Settings, Loader2, ArrowLeft, Lock, Search, CheckCircle2, AlertTriangle, XCircle, Coins, Plus, Trash2, RefreshCcw, ShieldCheck, Terminal, FileCode, FileJson, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface ProjectFile {
  id: string;
  path: string;
  name: string;
  type: string;
  content: string;
}

export function PluginBuilder() {
  const { userPlan, credits, useCredits } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFeatureLoading, setIsFeatureLoading] = useState<string | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<{ score: number; issues: { type: string; message: string; line: number }[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiModel, setAiModel] = useState<'standard' | 'advanced' | 'ultra'>('standard');
  const [apiType, setApiType] = useState('Paper');
  const [mcVersion, setMcVersion] = useState('1.20.4');
  const [logs, setLogs] = useState<{time: string, msg: string, type: 'info'|'success'|'error'}[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const activeFile = files.find(f => f.id === activeFileId) || files[0];

  const addLog = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    const icon = type === 'info' ? '→' : type === 'success' ? '✓' : '⚠';
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg: `${icon} ${msg}`, type }]);
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

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
        setError("You don't have enough credits to generate a plugin. Please upgrade your plan.");
        return;
      }
    }
    
    setIsGenerating(true);
    setAnalysis(null);
    setError(null);
    setLogs([]);
    addLog('Synthesizing: Building new plugin architecture...');
    try {
      const response = await fetch('/api/ai/generate-plugin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model: aiModel, version: mcVersion, apiType })
      });
      
      const data = await response.json();
      if (data.success) {
        const newFiles: ProjectFile[] = [
          { id: '1', path: `src/main/java/com/mineforge/generated/${data.data.pluginName}.java`, name: `${data.data.pluginName}.java`, type: 'java', content: data.data.code },
          { id: '2', path: 'src/main/resources/config.yml', name: 'config.yml', type: 'yaml', content: data.data.config },
          { id: '3', path: apiType.toLowerCase() === 'fabric' ? 'src/main/resources/fabric.mod.json' : 'src/main/resources/plugin.yml', name: apiType.toLowerCase() === 'fabric' ? 'fabric.mod.json' : 'plugin.yml', type: 'yaml', content: data.data.pluginYml },
          { id: '4', path: 'pom.xml', name: 'pom.xml', type: 'xml', content: `<?xml version="1.0" encoding="UTF-8"?>\n<project xmlns="http://maven.apache.org/POM/4.0.0"\n         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">\n    <modelVersion>4.0.0</modelVersion>\n\n    <groupId>com.mineforge</groupId>\n    <artifactId>${data.data.pluginName.toLowerCase()}</artifactId>\n    <version>1.0-SNAPSHOT</version>\n\n    <properties>\n        <maven.compiler.source>17</maven.compiler.source>\n        <maven.compiler.target>17</maven.compiler.target>\n        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>\n    </properties>\n\n    <repositories>\n        <repository>\n            <id>spigot-repo</id>\n            <url>https://hub.spigotmc.org/nexus/content/repositories/snapshots/</url>\n        </repository>\n    </repositories>\n\n    <dependencies>\n        <dependency>\n            <groupId>org.spigotmc</groupId>\n            <artifactId>spigot-api</artifactId>\n            <version>${mcVersion}-R0.1-SNAPSHOT</version>\n            <scope>provided</scope>\n        </dependency>\n    </dependencies>\n</project>` }
        ];
        setFiles(newFiles);
        setActiveFileId('1');
        addLog('Synthesis successful: Project is ready for use.', 'success');
      } else {
        setError(data.error || "Failed to generate plugin");
        addLog('Synthesis failed: Incorrect parameters.', 'error');
      }
    } catch (err: any) {
      console.error("Failed to generate plugin:", err);
      setError(err.message === 'Failed to fetch' ? 'Failed to connect to the AI server. Please try again.' : err.message);
      addLog('Synthesis failed: Connection error.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnalyze = async () => {
    if (files.length === 0) return;
    
    // Find the main files for analysis
    const codeFile = files.find(f => f.type === 'java');
    const configFile = files.find(f => f.name === 'config.yml');
    const pluginYmlFile = files.find(f => f.name === 'plugin.yml' || f.name === 'fabric.mod.json');
    
    if (!codeFile) return;

    setIsAnalyzing(true);
    addLog('Analysis: Scanning code structure...');
    try {
      const response = await fetch('/api/ai/analyze-plugin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: codeFile.content, 
          config: configFile?.content || '', 
          pluginYml: pluginYmlFile?.content || '',
          apiType,
          version: mcVersion,
          model: aiModel
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setAnalysis(data.data);
        addLog(`Analysis complete: Score ${data.data.score}/100`, 'success');
      }
    } catch (error) {
      console.error("Failed to analyze plugin:", error);
      addLog('Analysis failed.', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleOptimize = async () => {
    if (!activeFile || activeFile.type !== 'java') return;
    setIsFeatureLoading('optimize');
    addLog(`Neural Link: Optimizing ${activeFile.name}...`);
    try {
      const response = await fetch('/api/ai/optimize-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: activeFile.content, model: aiModel })
      });
      const data = await response.json();
      if (data.success) {
        const newFiles = [...files];
        const idx = newFiles.findIndex(f => f.id === activeFileId);
        newFiles[idx].content = data.data;
        setFiles(newFiles);
        addLog('Optimization complete: Code is now more efficient.', 'success');
      } else {
        addLog(`Optimization failed: ${data.error}`, 'error');
      }
    } catch (e: any) {
      addLog('Optimization failed: Connection error.', 'error');
    } finally { setIsFeatureLoading(null); }
  };

  const handleFixBugs = async () => {
    if (!activeFile || activeFile.type !== 'java') return;
    setIsFeatureLoading('debug');
    addLog('Security Scan: Checking for vulnerabilities...');
    try {
      const response = await fetch('/api/ai/fix-bugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: activeFile.content, model: aiModel })
      });
      const data = await response.json();
      if (data.success) {
        if (data.data !== 'SAFE') {
          const newFiles = [...files];
          const idx = newFiles.findIndex(f => f.id === activeFileId);
          newFiles[idx].content = data.data;
          setFiles(newFiles);
          addLog('Patch applied: Security vulnerabilities fixed.', 'success');
        } else {
          addLog('Scan complete: No threats found.', 'success');
        }
      } else {
        addLog(`Scan failed: ${data.error}`, 'error');
      }
    } catch (e: any) {
      addLog('Scan aborted.', 'error');
    } finally { setIsFeatureLoading(null); }
  };

  const handleDownload = () => {
    if (files.length === 0) return;

    addLog('Pipeline: Gathering resources...');
    const zip = new JSZip();
    
    files.forEach(file => {
      const parts = file.path.split('/');
      const fileName = parts.pop();
      let currentFolder = zip;
      
      parts.forEach(part => {
        currentFolder = currentFolder.folder(part)!;
      });
      
      currentFolder.file(fileName!, file.content);
    });

    zip.file("README.txt", `This is the source code for your generated plugin.\n\nTo compile this into a working .jar file, you will need to use Maven:\n1. Install Java JDK 17 or higher.\n2. Install Apache Maven.\n3. Open a terminal in this directory and run: mvn clean package\n4. The compiled .jar will be in the 'target' folder.`);

    addLog('Build Success: Source artifact exported.', 'success');
    zip.generateAsync({ type: "blob" }).then(function(content) {
      saveAs(content, `plugin_source.zip`);
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
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shadow-sm">
              <Code2 className="w-4 h-4 text-blue-500" />
            </div>
            <span className="font-semibold tracking-tight">Plugin Builder</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {files.length > 0 && (
            <Button variant="secondary" size="sm" className="flex items-center gap-2" onClick={handleAnalyze} disabled={isAnalyzing}>
              {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Analyze Code
            </Button>
          )}
          <Button variant="primary" size="sm" className="flex items-center gap-2" disabled={files.length === 0} onClick={handleDownload}>
            <Download className="w-4 h-4" />
            Download Source
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Panel - Prompt */}
        <div className="w-full md:w-1/3 border-r border-gray-200 p-6 md:p-8 flex flex-col bg-white/50 backdrop-blur-xl overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-gray-900">Describe your plugin</h2>
            {userPlan === 'free' && (
              <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium border border-blue-100">
                <Coins className="w-3.5 h-3.5" />
                {credits} Credits
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-8">Be as specific as possible about commands, permissions, and events.</p>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">API / Loader</label>
              <select 
                value={apiType} 
                onChange={(e) => setApiType(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm text-sm font-medium text-gray-700"
              >
                <option value="Paper">Paper</option>
                <option value="Spigot">Spigot</option>
                <option value="Purpur">Purpur</option>
                <option value="Fabric">Fabric</option>
                <option value="Forge">Forge</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Minecraft Version</label>
              <select 
                value={mcVersion} 
                onChange={(e) => setMcVersion(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm text-sm font-medium text-gray-700"
              >
                <option value="1.21">1.21</option>
                <option value="1.20.4">1.20.4</option>
                <option value="1.19.4">1.19.4</option>
                <option value="1.18.2">1.18.2</option>
                <option value="1.16.5">1.16.5</option>
                <option value="1.8.8">1.8.8</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">AI Model</label>
            <div className="flex flex-col gap-3">
              <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${aiModel === 'standard' ? 'border-blue-500 bg-blue-50 shadow-sm ring-1 ring-blue-500/20' : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300'}`}>
                <input type="radio" name="model" value="standard" checked={aiModel === 'standard'} onChange={() => setAiModel('standard')} className="w-4 h-4 text-blue-600" />
                <div className="flex-1">
                  <span className="block text-sm font-bold text-gray-900">Standard Model</span>
                  <span className="block text-xs text-gray-500 mt-0.5">Fast, good for simple plugins</span>
                </div>
              </label>
              
              <label className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${userPlan === 'free' ? 'opacity-50 cursor-not-allowed bg-gray-50' : aiModel === 'advanced' ? 'border-blue-500 bg-blue-50 shadow-sm ring-1 ring-blue-500/20 cursor-pointer' : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 cursor-pointer'}`}>
                <input type="radio" name="model" value="advanced" checked={aiModel === 'advanced'} onChange={() => userPlan !== 'free' && setAiModel('advanced')} disabled={userPlan === 'free'} className="w-4 h-4 text-blue-600" />
                <div className="flex-1 flex items-center justify-between">
                  <div>
                    <span className="block text-sm font-bold text-gray-900">Advanced Model</span>
                    <span className="block text-xs text-gray-500 mt-0.5">Better logic & complex systems</span>
                  </div>
                  {userPlan === 'free' && <Lock className="w-4 h-4 text-gray-400" />}
                  {userPlan !== 'free' && <span className="text-[10px] uppercase font-bold tracking-wider bg-gradient-to-r from-amber-200 to-orange-300 text-orange-900 px-2 py-0.5 rounded-full">Pro</span>}
                </div>
              </label>

              <label className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${userPlan !== 'ultra' ? 'opacity-50 cursor-not-allowed bg-gray-50' : aiModel === 'ultra' ? 'border-blue-500 bg-blue-50 shadow-sm ring-1 ring-blue-500/20 cursor-pointer' : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 cursor-pointer'}`}>
                <input type="radio" name="model" value="ultra" checked={aiModel === 'ultra'} onChange={() => userPlan === 'ultra' && setAiModel('ultra')} disabled={userPlan !== 'ultra'} className="w-4 h-4 text-blue-600" />
                <div className="flex-1 flex items-center justify-between">
                  <div>
                    <span className="block text-sm font-bold text-gray-900">Ultra Model</span>
                    <span className="block text-xs text-gray-500 mt-0.5">Maximum context & optimization</span>
                  </div>
                  {userPlan !== 'ultra' && <Lock className="w-4 h-4 text-gray-400" />}
                  {userPlan === 'ultra' && <span className="text-[10px] uppercase font-bold tracking-wider bg-gradient-to-r from-purple-400 to-pink-500 text-white px-2 py-0.5 rounded-full shadow-sm">Ultra</span>}
                </div>
              </label>
            </div>
          </div>
          
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Create a Spigot plugin that adds a /heal command. It should cost 100 economy money and have a 60-second cooldown. Requires 'mineforge.heal' permission."
            className="flex-1 w-full p-4 rounded-2xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none shadow-sm mb-6 min-h-[150px] text-sm text-gray-800"
          />
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-start gap-3 shadow-sm">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="font-medium leading-relaxed">{error}</p>
            </div>
          )}
          
          <Button 
            variant="primary" 
            className="w-full flex items-center justify-center gap-2 h-12 text-base font-semibold shadow-sm"
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

        {/* Right Panel - Code Preview & Analysis */}
        <div className="flex-1 bg-gray-50/50 flex flex-col overflow-hidden relative p-4 md:p-6">
          {files.length > 0 ? (
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden glass-panel rounded-2xl border border-gray-200 bg-white/80 shadow-sm">
              {/* File Explorer */}
              <div className="w-full md:w-56 bg-gray-50/50 border-r border-gray-200 flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Workspace</span>
                  <button onClick={() => {
                    const name = window.prompt("File name (e.g., src/main/java/com/mineforge/NewClass.java):");
                    if(name) {
                      const type = name.endsWith('.java') ? 'java' : name.endsWith('.yml') ? 'yaml' : name.endsWith('.xml') ? 'xml' : 'text';
                      setFiles([...files, { id: Date.now().toString(), name: name.split('/').pop() || name, path: name, content: '', type }]);
                    }
                  }} className="p-1.5 hover:bg-white rounded-lg text-gray-500 hover:text-gray-900 transition-colors shadow-sm border border-transparent hover:border-gray-200">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                  {files.map(file => (
                    <div 
                      key={file.id}
                      onClick={() => setActiveFileId(file.id)}
                      className={`group flex items-center px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                        activeFileId === file.id 
                          ? 'bg-blue-50 border border-blue-100 text-blue-700 shadow-sm' 
                          : 'text-gray-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100'
                      }`}
                    >
                      {file.type === 'java' ? <FileCode className={`w-4 h-4 mr-2 shrink-0 ${activeFileId === file.id ? 'text-blue-500' : 'text-gray-400'}`} /> : file.type === 'yaml' ? <FileJson className={`w-4 h-4 mr-2 shrink-0 ${activeFileId === file.id ? 'text-blue-500' : 'text-gray-400'}`} /> : <FileText className={`w-4 h-4 mr-2 shrink-0 ${activeFileId === file.id ? 'text-blue-500' : 'text-gray-400'}`} />}
                      <span className="text-sm font-medium truncate flex-1">{file.name}</span>
                      <Trash2 onClick={(e) => { e.stopPropagation(); setFiles(files.filter(f => f.id !== file.id)); }} className="w-4 h-4 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all shrink-0" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Editor & Terminal */}
              <div className="flex-1 flex flex-col overflow-hidden bg-white">
                {/* Editor Toolbar */}
                <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
                  <div className="flex items-center text-sm font-medium text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                    {activeFile?.path}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={handleOptimize} disabled={isFeatureLoading !== null || activeFile?.type !== 'java'} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium border border-blue-100" title="Optimize Code">
                      <RefreshCcw className={`w-4 h-4 ${isFeatureLoading === 'optimize' ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">Optimize</span>
                    </button>
                    <button onClick={handleFixBugs} disabled={isFeatureLoading !== null || activeFile?.type !== 'java'} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium border border-emerald-100" title="Security Scan">
                      <ShieldCheck className="w-4 h-4" />
                      <span className="hidden sm:inline">Scan</span>
                    </button>
                  </div>
                </div>
                
                {/* Editor Area */}
                <div className="flex-1 overflow-auto relative bg-gray-50/30">
                  <textarea
                    value={activeFile?.content || ''}
                    onChange={(e) => {
                      const newFiles = [...files];
                      const idx = newFiles.findIndex(f => f.id === activeFileId);
                      if (idx !== -1) { newFiles[idx].content = e.target.value; setFiles(newFiles); }
                    }}
                    className="absolute inset-0 w-full h-full bg-transparent p-6 font-mono text-[13px] sm:text-sm text-gray-800 outline-none resize-none leading-relaxed"
                    spellCheck="false"
                  />
                </div>

                {/* Analysis Panel (Overlay) */}
                {analysis && (
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="absolute bottom-52 left-4 right-4 md:left-64 md:right-6 bg-white border border-gray-200 rounded-2xl p-5 max-h-64 overflow-y-auto z-10 shadow-2xl"
                  >
                    <div className="flex items-center justify-between mb-4 sticky top-0 bg-white pb-2 border-b border-gray-100">
                      <h3 className="text-gray-900 font-semibold flex items-center gap-2">
                        <Search className="w-5 h-5 text-blue-500" />
                        AI Analysis Report
                      </h3>
                      <div className="flex items-center gap-3">
                        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${analysis.score >= 80 ? 'bg-green-50 border-green-200 text-green-700' : analysis.score >= 50 ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                          Score: {analysis.score}/100
                        </div>
                        <button onClick={() => setAnalysis(null)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {analysis.issues.map((issue, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                          {issue.type === 'error' && <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />}
                          {issue.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />}
                          {issue.type === 'suggestion' && <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />}
                          
                          <div>
                            <p className="text-sm text-gray-700 font-medium">{issue.message}</p>
                            {issue.line > 0 && <span className="text-xs font-mono text-gray-500 mt-1.5 block bg-white px-2 py-0.5 rounded border border-gray-200 inline-block">Line {issue.line}</span>}
                          </div>
                        </div>
                      ))}
                      {analysis.issues.length === 0 && (
                        <div className="text-sm text-emerald-600 font-medium p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5" />
                          No issues found. The code looks great!
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Terminal Logs */}
                <div className="h-48 bg-gray-900 flex flex-col">
                  <div className="px-4 py-2.5 border-b border-gray-800 flex items-center bg-gray-950">
                    <Terminal className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">System Logs</span>
                  </div>
                  <div className="flex-1 p-4 font-mono text-[13px] overflow-y-auto space-y-2">
                    {logs.length === 0 && (
                      <div className="text-gray-600 italic">System idle...</div>
                    )}
                    {logs.map((log, i) => (
                      <div key={i} className="flex items-start">
                        <span className="text-gray-500 mr-3 shrink-0">[{log.time}]</span>
                        <span className={`${
                          log.type === 'success' ? 'text-emerald-400' :
                          log.type === 'error' ? 'text-red-400' :
                          'text-gray-300'
                        }`}>
                          {log.msg}
                        </span>
                      </div>
                    ))}
                    <div ref={logsEndRef} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center flex-col text-gray-500 p-8 text-center glass-panel rounded-2xl border border-gray-200 bg-white/50">
              <div className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center mb-6 border border-gray-100 shadow-sm">
                <Code2 className="w-10 h-10 text-blue-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No code generated yet</h2>
              <p className="text-gray-500 max-w-md mx-auto leading-relaxed">Enter a prompt on the left and click generate to see the AI build your plugin architecture.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
