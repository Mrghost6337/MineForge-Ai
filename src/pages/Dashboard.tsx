import { motion } from 'motion/react';
import { useAuth } from '../lib/auth-context';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Code2, Box, Server, Settings, LogOut, Pickaxe } from 'lucide-react';

export function Dashboard() {
  const { user, userPlan } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const tools = [
    { icon: Code2, title: 'Plugin Builder', desc: 'Generate Java plugins with AI', href: '/dashboard/plugins', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { icon: Box, title: 'Modpack Studio', desc: 'Curate and optimize modpacks', href: '/dashboard/modpacks', color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { icon: Server, title: 'Server Hosting', desc: 'Deploy and manage servers', href: '/dashboard/servers', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { icon: Pickaxe, title: 'Litematica Gen', desc: 'Create 3D structures', href: '/dashboard/litematica', color: 'text-amber-400', bg: 'bg-amber-500/10', pro: true },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 p-6 flex flex-col hidden md:flex">
        <div className="flex items-center gap-2 mb-12">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-zinc-800 to-black border border-white/10 flex items-center justify-center">
            <Pickaxe className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold tracking-tight">MineForge AI</span>
        </div>

        <nav className="flex-1 space-y-2">
          {tools.map((tool) => (
            <button key={tool.title} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all text-left group">
              <tool.icon className={`w-5 h-5 ${tool.color} group-hover:scale-110 transition-transform`} />
              <span className="text-sm font-medium">{tool.title}</span>
              {tool.pro && <span className="ml-auto text-[10px] uppercase font-bold tracking-wider bg-gradient-to-r from-amber-400 to-orange-500 text-black px-2 py-0.5 rounded-full">Pro</span>}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/10 space-y-4">
          <div className="flex items-center gap-3 px-4">
            <img src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.email}&background=random`} alt="Avatar" className="w-10 h-10 rounded-full border border-white/20" />
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.displayName || user?.email?.split('@')[0]}</p>
              <p className="text-xs text-gray-500 capitalize">{userPlan} Plan</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all text-left">
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <header className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back, {user?.displayName?.split(' ')[0] || 'Creator'}</h1>
            <p className="text-gray-400">What are we building today?</p>
          </div>
          <Button variant="glass" className="hidden sm:flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {tools.map((tool, i) => (
            <motion.div
              key={tool.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-panel p-6 hover:bg-white/[0.05] transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 ${tool.bg} rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110`} />
              
              <div className={`w-12 h-12 rounded-xl ${tool.bg} border border-white/10 flex items-center justify-center mb-6 relative z-10`}>
                <tool.icon className={`w-6 h-6 ${tool.color}`} />
              </div>
              
              <h3 className="text-lg font-semibold mb-2 relative z-10 flex items-center gap-2">
                {tool.title}
                {tool.pro && <span className="text-[10px] uppercase font-bold tracking-wider bg-gradient-to-r from-amber-400 to-orange-500 text-black px-2 py-0.5 rounded-full">Pro</span>}
              </h3>
              <p className="text-sm text-gray-400 relative z-10">{tool.desc}</p>
            </motion.div>
          ))}
        </div>

        <section>
          <h2 className="text-xl font-semibold mb-6">Recent Projects</h2>
          <div className="glass-panel p-12 text-center border-dashed border-white/20">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Box className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium mb-2">No projects yet</h3>
            <p className="text-gray-400 mb-6 max-w-sm mx-auto">Start by creating a new plugin, modpack, or server setup using the tools above.</p>
            <Button variant="primary">Create New Project</Button>
          </div>
        </section>
      </main>
    </div>
  );
}
