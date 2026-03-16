import { motion } from 'motion/react';
import { Button } from './ui/Button';
import { Sparkles, Code2, Server, Box, Cpu } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-[128px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel mb-8 text-sm font-medium text-blue-600 border-blue-500/20 shadow-sm">
            <Sparkles className="w-4 h-4" />
            <span>Introducing MineForge AI 2.0</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 text-gradient leading-tight">
            Build Minecraft<br />with Intelligence.
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            The ultimate AI platform for creators. Generate plugins, build modpacks, and deploy servers with unprecedented speed and precision.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" href="/dashboard" className="w-full sm:w-auto text-lg px-10">
              Start Building Free
            </Button>
            <Button variant="glass" size="lg" href="#features" className="w-full sm:w-auto text-lg px-10">
              Explore Features
            </Button>
          </div>
        </motion.div>

        {/* Feature Preview Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
          className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
        >
          {[
            { icon: Code2, title: "AI Plugin Builder", desc: "Generate complex Java plugins from natural language prompts." },
            { icon: Box, title: "Smart Modpacks", desc: "Auto-resolve dependencies and optimize performance instantly." },
            { icon: Server, title: "One-Click Hosting", desc: "Deploy your creations to high-performance servers in seconds." }
          ].map((feature, i) => (
            <div key={i} className="glass-panel p-6 text-left hover:bg-white/80 transition-colors duration-500">
              <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center mb-4 shadow-sm">
                <feature.icon className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
