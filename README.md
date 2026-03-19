# MineForge Host Client - Source Code

This repository contains the full source code for the **MineForge Host Client**, a professional Minecraft server hosting application built with Electron, React, and TypeScript.

## Project Structure

- `desktop-client/`: The main Electron application source.
  - `src/main.ts`: Electron main process (server management, process control).
  - `src/App.tsx`: React dashboard UI.
  - `src/preload.ts`: IPC bridge between Electron and React.
- `server.ts`: Backend for browser-based authentication.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Java Runtime Environment (JRE)](https://www.oracle.com/java/technologies/downloads/) (Required to run Minecraft servers)
- [Git](https://git-scm.com/)

## Build Instructions (HOW TO GET THE .EXE)

To build the **REAL Windows installer (.exe)** from this source code, follow these steps on your Windows PC:

1. **Download and Extract**: Download the `MineForge-Host-Client-Source.zip` from the dashboard and extract it.
2. **Install Node.js**: Ensure you have [Node.js](https://nodejs.org/) installed on your computer.
3. **Open Terminal**: Open a terminal (CMD or PowerShell) in the extracted `desktop-client` folder.
4. **Install Dependencies**:
   ```bash
   npm install
   ```
5. **Build the .exe**:
   ```bash
   npm run build:win
   ```
6. **Find your Installer**:
   After the build finishes, your valid binary executable (`.exe`) will be in the `desktop-client/release/` folder.

## Features
- **Local Hosting**: Run Minecraft servers directly on your PC.
- **Auto-Setup**: Automatic download of Paper/Fabric jars and EULA generation.
- **Plugin Marketplace**: One-click installation of popular plugins.
- **Resource Monitor**: Real-time CPU, RAM, and TPS tracking.
- **System Tray**: Runs in the background with a tray icon.

## Security Note

The application is designed to manage files within `C:\MineForge`. Ensure the application has the necessary permissions to create and modify files in this directory.
