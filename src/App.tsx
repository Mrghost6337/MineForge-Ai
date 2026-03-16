/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/auth-context';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Pricing } from './components/Pricing';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { PluginBuilder } from './pages/PluginBuilder';
import { ModpackBuilder } from './pages/ModpackBuilder';
import { ServerManager } from './pages/ServerManager';
import { LitematicaGen } from './pages/LitematicaGen';
import { AddonBrowser } from './pages/AddonBrowser';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Analytics } from '@vercel/analytics/react';

function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar />
      <Hero />
      <Pricing />
      
      <footer className="py-12 border-t border-gray-200 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} MineForge AI. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/plugins" element={<PluginBuilder />} />
              <Route path="/dashboard/modpacks" element={<ModpackBuilder />} />
              <Route path="/dashboard/servers" element={<ServerManager />} />
              <Route path="/dashboard/litematica" element={<LitematicaGen />} />
              <Route path="/dashboard/addons" element={<AddonBrowser />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Analytics />
      </AuthProvider>
    </ErrorBoundary>
  );
}

