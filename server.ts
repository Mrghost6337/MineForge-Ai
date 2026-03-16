import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
