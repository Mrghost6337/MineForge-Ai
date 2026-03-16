import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import { Server } from "socket.io";
import http from "http";

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

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Endpoint to download the host client script
  app.get('/api/download-host-client', (req, res) => {
    const userId = req.query.userId as string || 'YOUR_USER_ID_HERE';
    const serverUrl = req.protocol + '://' + req.get('host');
    
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
    const { prompt } = req.body;
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are an expert Minecraft plugin developer. Create a Spigot/Paper plugin based on this prompt: ${prompt}`,
        config: {
          systemInstruction: "You are a Minecraft plugin generator. Return ONLY valid JSON matching the requested schema. Do not include markdown formatting like ```json.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              pluginName: { type: Type.STRING, description: "The name of the plugin class (e.g., MyPlugin)" },
              code: { type: Type.STRING, description: "The full Java code for the main plugin class" },
              config: { type: Type.STRING, description: "The default config.yml contents" }
            },
            required: ["pluginName", "code", "config"]
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
          config: data.config || `settings:\n  enabled: true`
        }
      });
    } catch (error) {
      console.error("AI Generation Error:", error);
      res.status(500).json({ success: false, error: "Failed to generate plugin" });
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
