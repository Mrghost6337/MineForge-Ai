import { motion } from 'motion/react';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Code2, Box, Server, Settings, LogOut, Pickaxe, Globe } from 'lucide-react';
import { useEffect, useState } from 'react';

export function Dashboard() {
  const { user, userPlan } = useAuth();
  const navigate = useNavigate();
  const [isDesktopRedirecting, setIsDesktopRedirecting] = useState(false);

  useEffect(() => {
    const isDesktopLogin = localStorage.getItem('desktopLogin') === 'true';
    if (isDesktopLogin && user) {
      setIsDesktopRedirecting(true);
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          window.location.href = `mineforge://auth?token=${data.session.access_token}`;
          localStorage.removeItem('desktopLogin');
        }
      });
    }
  }, [user]);

  const handleLogout = async () => {
    localStorage.removeItem('mock_user');
    await supabase.auth.signOut();
    navigate('/');
  };

  const tools = [
    { icon: Code2, title: 'Plugin Builder', desc: 'Generate Java plugins with AI', href: '/dashboard/plugins', color: 'text-blue-500', bg: 'bg-blue-50' },
    { icon: Box, title: 'Modpack Studio', desc: 'Curate and optimize modpacks', href: '/dashboard/modpacks', color: 'text-purple-500', bg: 'bg-purple-50' },
    { icon: Server, title: 'Server Hosting', desc: 'Deploy and manage servers', href: '/dashboard/servers', color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { icon: Pickaxe, title: 'Litematica Gen', desc: 'Create 3D structures', href: '/dashboard/litematica', color: 'text-amber-500', bg: 'bg-amber-50', pro: true },
    { icon: Globe, title: 'Addon Browser', desc: 'Search Modrinth & CurseForge', href: '/dashboard/addons', color: 'text-indigo-500', bg: 'bg-indigo-50' },
  ];

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Creator';
  const avatarUrl = user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${displayName}&background=random`;

  if (isDesktopRedirecting) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-100">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Server className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Login Successful!</h1>
          <p className="text-gray-500 mb-8">You can now close this window and return to the MineForge Desktop App.</p>
          <Button onClick={() => window.location.href = '/dashboard'} variant="secondary" className="w-full">
            Continue to Web Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 p-6 flex flex-col hidden md:flex bg-white/50 backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-12">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gray-100 to-white border border-gray-200 flex items-center justify-center shadow-sm">
            <Pickaxe className="w-4 h-4 text-gray-800" />
          </div>
          <span className="font-semibold tracking-tight">MineForge AI</span>
        </div>

        <nav className="flex-1 space-y-2">
          {tools.map((tool) => (
            <Link key={tool.title} to={tool.href} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 transition-all text-left group">
              <tool.icon className={`w-5 h-5 ${tool.color} group-hover:scale-110 transition-transform`} />
              <span className="text-sm font-medium">{tool.title}</span>
              {tool.pro && <span className="ml-auto text-[10px] uppercase font-bold tracking-wider bg-gradient-to-r from-amber-200 to-orange-300 text-orange-900 px-2 py-0.5 rounded-full">Pro</span>}
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-200 space-y-4">
          <div className="flex items-center gap-3 px-4">
            <img src={avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full border border-gray-200 shadow-sm" />
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{displayName}</p>
              <p className="text-xs text-gray-500 capitalize">{userPlan} Plan</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 rounded-2xl text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all text-left">
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <header className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2 text-gray-900">Welcome back, {displayName.split(' ')[0]}</h1>
            <p className="text-gray-600">What are we building today?</p>
          </div>
          <Button variant="secondary" className="hidden sm:flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {tools.map((tool, i) => (
            <motion.div
              key={tool.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link to={tool.href} className="block glass-panel p-6 hover:bg-white/80 transition-all cursor-pointer group relative overflow-hidden h-full">
                <div className={`absolute top-0 right-0 w-32 h-32 ${tool.bg} rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110 opacity-50`} />
                
                <div className={`w-12 h-12 rounded-2xl ${tool.bg} border border-white flex items-center justify-center mb-6 relative z-10 shadow-sm`}>
                  <tool.icon className={`w-6 h-6 ${tool.color}`} />
                </div>
                
                <h3 className="text-lg font-semibold mb-2 relative z-10 flex items-center gap-2 text-gray-900">
                  {tool.title}
                  {tool.pro && <span className="text-[10px] uppercase font-bold tracking-wider bg-gradient-to-r from-amber-200 to-orange-300 text-orange-900 px-2 py-0.5 rounded-full">Pro</span>}
                </h3>
                <p className="text-sm text-gray-600 relative z-10">{tool.desc}</p>
              </Link>
            </motion.div>
          ))}
        </div>

        <section>
          <h2 className="text-xl font-semibold mb-6 text-gray-900">Recent Projects</h2>
          <div className="glass-panel p-12 text-center border-dashed border-gray-300">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Box className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-gray-900">No projects yet</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">Start by creating a new plugin, modpack, or server setup using the tools above.</p>
            <Button variant="primary">Create New Project</Button>
          </div>
        </section>
      </main>
    </div>
  );
}
