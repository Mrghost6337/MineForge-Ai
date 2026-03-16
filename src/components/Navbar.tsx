import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../lib/auth-context';
import { Button } from './ui/Button';
import { Pickaxe } from 'lucide-react';

export function Navbar() {
  const { user } = useAuth();

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between backdrop-blur-md border-b border-white/5 bg-black/50"
    >
      <Link to="/" className="flex items-center gap-2 group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-black border border-white/10 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.1)] group-hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] transition-all">
          <Pickaxe className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-semibold tracking-tight text-gradient">MineForge AI</span>
      </Link>

      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
        <Link to="#features" className="hover:text-white transition-colors">Features</Link>
        <Link to="#pricing" className="hover:text-white transition-colors">Pricing</Link>
        <Link to="/docs" className="hover:text-white transition-colors">Documentation</Link>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <Button href="/dashboard" variant="glass">Dashboard</Button>
        ) : (
          <>
            <Button href="/login" variant="ghost" className="hidden sm:inline-flex">Log in</Button>
            <Button href="/login" variant="primary">Start Now</Button>
          </>
        )}
      </div>
    </motion.nav>
  );
}
