const { io } = require("socket.io-client");
const os = require("os");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

// Configuration
const SERVER_URL = "http://localhost:3000"; // Change this to the MineForge web platform URL
const USER_ID = "YOUR_USER_ID_HERE"; // Replace with actual user ID from dashboard

console.log("Starting MineForge Local Host Client...");
console.log(`OS: ${os.platform()} ${os.release()}`);

// Setup local directories
const baseDir = os.platform() === "win32" 
  ? path.join("C:", "MineForge") 
  : path.join(os.homedir(), "MineForge");

const serversDir = path.join(baseDir, "servers");
const pluginsDir = path.join(baseDir, "plugins");

[baseDir, serversDir, pluginsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Connect to Web Platform
const socket = io(SERVER_URL);
let serverProcess = null;

socket.on("connect", () => {
  console.log("Connected to MineForge Cloud!");
  
  // Register this device as a host
  socket.emit("register_host", { 
    userId: USER_ID, 
    os: `${os.type()} ${os.release()}` 
  });
});

socket.on("execute_command", (command) => {
  console.log(`Received command from web: ${command}`);
  
  if (command === "start_server") {
    startMinecraftServer();
  } else if (command === "stop_server") {
    stopMinecraftServer();
  } else if (command.startsWith("cmd:")) {
    const mcCommand = command.substring(4);
    if (serverProcess) {
      serverProcess.stdin.write(mcCommand + "\n");
      socket.emit("log_from_host", { userId: USER_ID, log: `> ${mcCommand}` });
    }
  }
});

function startMinecraftServer() {
  if (serverProcess) {
    console.log("Server is already running.");
    return;
  }

  console.log("Starting local Minecraft server...");
  socket.emit("log_from_host", { userId: USER_ID, log: "[MineForge Host] Starting local server process..." });
  
  // Simulated server startup for demonstration
  // In a real app, this would be: spawn("java", ["-Xmx4G", "-jar", "server.jar", "nogui"], { cwd: path.join(serversDir, "server1") })
  
  let tps = 20.0;
  
  // Simulate logs
  setTimeout(() => socket.emit("log_from_host", { userId: USER_ID, log: "[10:00:00] [Server thread/INFO]: Starting minecraft server version 1.20.4" }), 1000);
  setTimeout(() => socket.emit("log_from_host", { userId: USER_ID, log: "[10:00:01] [Server thread/INFO]: Loading properties" }), 2000);
  setTimeout(() => socket.emit("log_from_host", { userId: USER_ID, log: "[10:00:05] [Server thread/INFO]: Done (4.123s)! For help, type \"help\"" }), 4000);

  // Simulate resource monitoring
  serverProcess = setInterval(() => {
    tps = Math.max(15, Math.min(20, tps + (Math.random() - 0.5)));
    socket.emit("stats_from_host", {
      userId: USER_ID,
      stats: {
        players: Math.floor(Math.random() * 5),
        tps: tps,
        cpu: Math.floor(Math.random() * 30) + 10,
        ram: (Math.random() * 2 + 2).toFixed(1)
      }
    });
  }, 2000);
}

function stopMinecraftServer() {
  if (!serverProcess) return;
  
  console.log("Stopping local Minecraft server...");
  socket.emit("log_from_host", { userId: USER_ID, log: "[MineForge Host] Stopping local server process..." });
  
  clearInterval(serverProcess);
  serverProcess = null;
  
  setTimeout(() => socket.emit("log_from_host", { userId: USER_ID, log: "[10:05:00] [Server thread/INFO]: Stopping server" }), 500);
  setTimeout(() => socket.emit("log_from_host", { userId: USER_ID, log: "[10:05:02] [Server thread/INFO]: ThreadedAnvilChunkStorage: All dimensions are saved" }), 1500);
  
  // Reset stats
  setTimeout(() => {
    socket.emit("stats_from_host", {
      userId: USER_ID,
      stats: { players: 0, tps: 0, cpu: 0, ram: 0 }
    });
  }, 2000);
}

socket.on("disconnect", () => {
  console.log("Disconnected from MineForge Cloud.");
});
