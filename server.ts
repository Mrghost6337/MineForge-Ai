import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { Server } from "socket.io";
import http from "http";
import "dotenv/config";
import AdmZip from 'adm-zip';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: "*" }
  });

  app.use(express.json());

  // Create source code ZIP on startup
  const createSourceZip = () => {
    try {
      const zip = new AdmZip();
      const sourceDir = path.join(process.cwd(), 'desktop-client');
      const readmePath = path.join(process.cwd(), 'README.md');
      const outputPath = path.join(process.cwd(), 'MineForge-Host-Client-Source.zip');

      console.log('Generating source code ZIP...');
      
      // Add desktop-client folder, but exclude node_modules and build artifacts
      zip.addLocalFolder(sourceDir, 'desktop-client', (filename) => {
        const exclude = ['node_modules', 'dist', 'release', '.vite', 'out'];
        return !exclude.some(ex => filename.includes(ex));
      });

      // Add root README.md
      if (fs.existsSync(readmePath)) {
        zip.addLocalFile(readmePath);
      }

      zip.writeZip(outputPath);
      console.log(`Source code ZIP generated at: ${outputPath}`);
    } catch (err) {
      console.error('Failed to generate source ZIP:', err);
    }
  };

  createSourceZip();

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Endpoint to download the host client script
  app.get('/api/download-host-client', (req, res) => {
    const userId = req.query.userId as string || 'YOUR_USER_ID_HERE';
    const os = req.query.os as string;
    const serverUrl = req.protocol + '://' + req.get('host');
    
    if (os === 'windows') {
      const templatePath = path.join(process.cwd(), 'host-client', 'setup-windows.bat.template');
      import('fs').then(fs => {
        if (fs.existsSync(templatePath)) {
          let content = fs.readFileSync(templatePath, 'utf-8');
          content = content.replace('%SERVER_URL%', serverUrl);
          content = content.replace('%USER_ID%', userId);
          
          res.setHeader('Content-disposition', 'attachment; filename=MineForgeHost-Setup.bat');
          res.setHeader('Content-type', 'application/x-msdownload');
          res.send(content);
        } else {
          res.status(404).send('Windows setup template not found');
        }
      });
      return;
    }
    
    if (os === 'mac') {
      const content = `This is a simulated .dmg disk image for macOS.\n\nIn a production environment, this would be a mountable disk image containing the MineForgeHost.app configured for user: ${userId} and server: ${serverUrl}.`;
      res.setHeader('Content-disposition', 'attachment; filename=MineForgeHost.dmg');
      res.setHeader('Content-type', 'application/x-apple-diskimage');
      return res.send(content);
    }

    const hostClientPath = path.join(process.cwd(), 'host-client', 'index.js');
    import('fs').then(fs => {
      if (fs.existsSync(hostClientPath)) {
        let content = fs.readFileSync(hostClientPath, 'utf-8');
        content = content.replace('http://localhost:3000', serverUrl);
        content = content.replace('YOUR_USER_ID_HERE', userId);
        
        res.setHeader('Content-disposition', 'attachment; filename=mineforge-host.js');
        res.setHeader('Content-type', 'application/javascript');
        res.send(content);
      } else {
        res.status(404).send('Host client script not found');
      }
    });
  });

  app.get('/api/download-host-package', (req, res) => {
    const packagePath = path.join(process.cwd(), 'host-client', 'package.json');
    import('fs').then(fs => {
      if (fs.existsSync(packagePath)) {
        res.download(packagePath, 'package.json');
      } else {
        res.status(404).send('Host client package.json not found');
      }
    });
  });

  // Endpoint to download the full source code ZIP
  app.get('/api/download-source', (req, res) => {
    const zipPath = path.join(process.cwd(), 'MineForge-Host-Client-Source.zip');
    if (fs.existsSync(zipPath)) {
      res.download(zipPath, 'MineForge-Host-Client-Source.zip');
    } else {
      res.status(404).send('Source ZIP not found. It might still be generating.');
    }
  });

  // Handle Socket connections for Host Client
  io.on("connection", (socket) => {
    console.log("New connection:", socket.id);
    
    // Host Client Registration
    socket.on("register_host", (data) => {
      console.log(`Host registered for user ${data.userId} on ${data.os}`);
      socket.join(`host_${data.userId}`);
      // Notify web dashboard
      io.to(`web_${data.userId}`).emit("host_connected", { hostId: socket.id, os: data.os });
    });

    // Web Dashboard Registration
    socket.on("register_web", (data) => {
      console.log(`Web dashboard registered for user ${data.userId}`);
      socket.join(`web_${data.userId}`);
      
      // Check if host is already connected
      const hostRoom = io.sockets.adapter.rooms.get(`host_${data.userId}`);
      if (hostRoom && hostRoom.size > 0) {
        socket.emit("host_connected", { hostId: Array.from(hostRoom)[0] });
      }
    });

    // Relay commands from web to host
    socket.on("command_to_host", (data) => {
      io.to(`host_${data.userId}`).emit("execute_command", data.command);
    });

    // Relay logs from host to web
    socket.on("log_from_host", (data) => {
      io.to(`web_${data.userId}`).emit("server_log", data.log);
    });
    
    // Relay stats from host to web
    socket.on("stats_from_host", (data) => {
      io.to(`web_${data.userId}`).emit("server_stats", data.stats);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected:", socket.id);
    });
  });

  // Example AI Generation endpoint
  app.post("/api/ai/generate-plugin", async (req, res) => {
    const { prompt, model, version, apiType } = req.body;
    
    let geminiModel = "gemini-3-flash-preview";
    let thinkingConfig = undefined;

    if (model === 'advanced') {
      geminiModel = "gemini-3.1-pro-preview";
    } else if (model === 'ultra') {
      geminiModel = "gemini-3.1-pro-preview";
      thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    }
    
    try {
      const apiKey = model === 'standard' ? (process.env.FREE_API_KEY || 'AIzaSyCUDAZvfBUrHzQEULRzjFhAkfpni3CqgTg') : (process.env.API_KEY || process.env.GEMINI_API_KEY);
      const ai = new GoogleGenAI({ apiKey: apiKey as string });
      const response = await ai.models.generateContent({
        model: geminiModel,
        contents: `You are an expert Minecraft plugin developer. Create a ${apiType || 'Spigot/Paper'} plugin for Minecraft version ${version || '1.20.4'} based on this prompt: ${prompt}`,
        config: {
          systemInstruction: "You are a Minecraft plugin generator. Return ONLY valid JSON matching the requested schema. Do not include markdown formatting like ```json.",
          responseMimeType: "application/json",
          ...(thinkingConfig ? { thinkingConfig } : {}),
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              pluginName: { type: Type.STRING, description: "The name of the plugin class (e.g., MyPlugin)" },
              code: { type: Type.STRING, description: "The full Java code for the main plugin class" },
              config: { type: Type.STRING, description: "The default config.yml contents" },
              pluginYml: { type: Type.STRING, description: "The plugin.yml or fabric.mod.json contents" }
            },
            required: ["pluginName", "code", "config", "pluginYml"]
          }
        }
      });

      const jsonStr = response.text?.trim() || "{}";
      const data = JSON.parse(jsonStr);

      res.json({
        success: true,
        data: {
          pluginName: data.pluginName || "GeneratedPlugin",
          code: data.code || `package com.mineforge.generated;\n\nimport org.bukkit.plugin.java.JavaPlugin;\n\npublic class GeneratedPlugin extends JavaPlugin {\n    @Override\n    public void onEnable() {\n        getLogger().info("Plugin enabled!");\n    }\n}`,
          config: data.config || `settings:\n  enabled: true`,
          pluginYml: data.pluginYml || `name: GeneratedPlugin\nversion: 1.0\nmain: com.mineforge.generated.GeneratedPlugin\napi-version: 1.20`
        }
      });
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      import('fs').then(fs => fs.writeFileSync('error.log', String(error) + '\n' + (error as Error).stack));
      res.status(500).json({ success: false, error: error.message || "Failed to generate plugin" });
    }
  });

  // Analyze plugin endpoint
  app.post("/api/ai/optimize-code", async (req, res) => {
    const { code, model } = req.body;
    
    let geminiModel = "gemini-3-flash-preview";
    if (model === 'advanced' || model === 'ultra') {
      geminiModel = "gemini-3.1-pro-preview";
    }
    
    try {
      const apiKey = model === 'standard' ? (process.env.FREE_API_KEY || 'AIzaSyCUDAZvfBUrHzQEULRzjFhAkfpni3CqgTg') : (process.env.API_KEY || process.env.GEMINI_API_KEY);
      const ai = new GoogleGenAI({ apiKey: apiKey as string });
      const response = await ai.models.generateContent({
        model: geminiModel,
        contents: `You are the MineForge AI. Optimize the following Java code for maximum performance in Minecraft servers. Keep all functionality intact. Return ONLY the clean code without any markdown formatting like \`\`\`java.\n\n${code}`,
      });
      
      let optimizedCode = response.text || "";
      if (optimizedCode.startsWith("```java")) optimizedCode = optimizedCode.replace(/^```java\n/, "");
      if (optimizedCode.startsWith("```")) optimizedCode = optimizedCode.replace(/^```\n/, "");
      if (optimizedCode.endsWith("```")) optimizedCode = optimizedCode.replace(/\n```$/, "");
      
      res.json({ success: true, data: optimizedCode });
    } catch (error: any) {
      console.error("AI Optimize Error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/ai/fix-bugs", async (req, res) => {
    const { code, model } = req.body;
    
    let geminiModel = "gemini-3-flash-preview";
    if (model === 'advanced' || model === 'ultra') {
      geminiModel = "gemini-3.1-pro-preview";
    }
    
    try {
      const apiKey = model === 'standard' ? (process.env.FREE_API_KEY || 'AIzaSyCUDAZvfBUrHzQEULRzjFhAkfpni3CqgTg') : (process.env.API_KEY || process.env.GEMINI_API_KEY);
      const ai = new GoogleGenAI({ apiKey: apiKey as string });
      const response = await ai.models.generateContent({
        model: geminiModel,
        contents: `Scan this Minecraft code for exploits or bugs. Fix them directly. If everything is fine, return exactly 'SAFE'. Otherwise, return ONLY the patched code without any markdown formatting like \`\`\`java.\n\n${code}`,
      });
      
      let fixedCode = response.text || "";
      if (fixedCode.trim() === 'SAFE') {
        res.json({ success: true, data: 'SAFE' });
        return;
      }
      
      if (fixedCode.startsWith("```java")) fixedCode = fixedCode.replace(/^```java\n/, "");
      if (fixedCode.startsWith("```")) fixedCode = fixedCode.replace(/^```\n/, "");
      if (fixedCode.endsWith("```")) fixedCode = fixedCode.replace(/\n```$/, "");
      
      res.json({ success: true, data: fixedCode });
    } catch (error: any) {
      console.error("AI Fix Bugs Error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/ai/analyze-plugin", async (req, res) => {
    const { code, config, pluginYml, apiType, version, model } = req.body;
    
    let geminiModel = "gemini-3-flash-preview";
    let thinkingConfig = undefined;

    if (model === 'advanced') {
      geminiModel = "gemini-3.1-pro-preview";
    } else if (model === 'ultra') {
      geminiModel = "gemini-3.1-pro-preview";
      thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    }

    try {
      const apiKey = model === 'standard' ? (process.env.FREE_API_KEY || 'AIzaSyCUDAZvfBUrHzQEULRzjFhAkfpni3CqgTg') : (process.env.API_KEY || process.env.GEMINI_API_KEY);
      const ai = new GoogleGenAI({ apiKey: apiKey as string });
      const response = await ai.models.generateContent({
        model: geminiModel,
        contents: `Analyze this ${apiType} plugin for Minecraft ${version} for errors, bugs, or improvements.\n\nCode:\n${code}\n\nConfig:\n${config}\n\nPlugin Meta:\n${pluginYml}`,
        config: {
          systemInstruction: "You are an expert Minecraft developer. Analyze the provided code and return a JSON object with an array of issues and an overall score out of 100.",
          responseMimeType: "application/json",
          ...(thinkingConfig ? { thinkingConfig } : {}),
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER, description: "Overall quality score out of 100" },
              issues: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, description: "Type of issue: 'error', 'warning', or 'suggestion'" },
                    message: { type: Type.STRING, description: "Description of the issue" },
                    line: { type: Type.NUMBER, description: "Approximate line number, or 0 if general" }
                  },
                  required: ["type", "message"]
                }
              }
            },
            required: ["score", "issues"]
          }
        }
      });

      const jsonStr = response.text?.trim() || "{}";
      const data = JSON.parse(jsonStr);

      res.json({
        success: true,
        data
      });
    } catch (error: any) {
      console.error("AI Analysis Error:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to analyze plugin" });
    }
  });

  // Generate modpack endpoint
  app.post("/api/ai/generate-modpack", async (req, res) => {
    const { prompt, version, loader, model } = req.body;
    
    let geminiModel = "gemini-3-flash-preview";
    let thinkingConfig = undefined;

    if (model === 'advanced') {
      geminiModel = "gemini-3.1-pro-preview";
    } else if (model === 'ultra') {
      geminiModel = "gemini-3.1-pro-preview";
      thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    }

    try {
      const apiKey = model === 'standard' ? (process.env.FREE_API_KEY || 'AIzaSyCUDAZvfBUrHzQEULRzjFhAkfpni3CqgTg') : (process.env.API_KEY || process.env.GEMINI_API_KEY);
      const ai = new GoogleGenAI({ apiKey: apiKey as string });
      const response = await ai.models.generateContent({
        model: geminiModel,
        contents: `Create a Minecraft modpack for ${loader} version ${version} based on this prompt: ${prompt}. Return a list of mods.`,
        config: {
          systemInstruction: "You are a Minecraft modpack creator. Return ONLY valid JSON matching the requested schema.",
          responseMimeType: "application/json",
          ...(thinkingConfig ? { thinkingConfig } : {}),
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "The name of the modpack" },
              mods: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    version: { type: Type.STRING },
                    category: { type: Type.STRING },
                    downloads: { type: Type.STRING }
                  },
                  required: ["name", "version", "category", "downloads"]
                }
              }
            },
            required: ["name", "mods"]
          }
        }
      });

      const jsonStr = response.text?.trim() || "{}";
      const data = JSON.parse(jsonStr);

      res.json({
        success: true,
        data
      });
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to generate modpack" });
    }
  });

  // Analyze modpack endpoint
  app.post("/api/ai/analyze-modpack", async (req, res) => {
    const { mods, version, loader, model } = req.body;
    
    let geminiModel = "gemini-3-flash-preview";
    let thinkingConfig = undefined;

    if (model === 'advanced') {
      geminiModel = "gemini-3.1-pro-preview";
    } else if (model === 'ultra') {
      geminiModel = "gemini-3.1-pro-preview";
      thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    }

    try {
      const apiKey = model === 'standard' ? (process.env.FREE_API_KEY || 'AIzaSyCUDAZvfBUrHzQEULRzjFhAkfpni3CqgTg') : (process.env.API_KEY || process.env.GEMINI_API_KEY);
      const ai = new GoogleGenAI({ apiKey: apiKey as string });
      const response = await ai.models.generateContent({
        model: geminiModel,
        contents: `Analyze this list of mods for a ${loader} modpack on Minecraft ${version}. Check for incompatibilities, missing dependencies, or performance issues.\n\nMods:\n${JSON.stringify(mods)}`,
        config: {
          systemInstruction: "You are an expert Minecraft modpack reviewer. Analyze the provided mod list and return a JSON object with an array of issues and an overall score out of 100.",
          responseMimeType: "application/json",
          ...(thinkingConfig ? { thinkingConfig } : {}),
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER, description: "Overall quality score out of 100" },
              issues: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, description: "Type of issue: 'error', 'warning', or 'suggestion'" },
                    message: { type: Type.STRING, description: "Description of the issue" }
                  },
                  required: ["type", "message"]
                }
              }
            },
            required: ["score", "issues"]
          }
        }
      });

      const jsonStr = response.text?.trim() || "{}";
      const data = JSON.parse(jsonStr);

      res.json({
        success: true,
        data
      });
    } catch (error: any) {
      console.error("AI Analysis Error:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to analyze modpack" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
