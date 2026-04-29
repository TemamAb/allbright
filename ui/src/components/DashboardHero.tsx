import { motion } from "framer-motion";
import { useGetEngineStatus } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Activity, Zap, Brain, Cpu } from "lucide-react";

export default function DashboardHero() {
  const { data: status } = useGetEngineStatus({
    query: { refetchInterval: 2000 }
  });
  const isRunning = status?.running;
  const mode = status?.mode ?? "STOPPED";

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-2xl p-8 mb-6 glass-panel border border-primary/20"
    >
      {/* Animated background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-electric/20 rounded-full blur-3xl opacity-30 animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-primary/20 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-secondary/20 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
      </div>
      
      <div className="relative flex items-center gap-8">
        {/* Logo */}
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="flex-shrink-0"
        >
          <img src="/logo.png" alt="BrightSky" className="h-24 w-24 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
        </motion.div>
        
        {/* Text and status */}
        <div className="flex-1">
          <h1 className="text-4xl font-black bg-gradient-to-r from-slate-200 to-slate-100 bg-clip-text text-transparent">
            BRIGHTSKY
            <span className="text-electric animate-pulse"> ELITE</span>
          </h1>
          <p className="mt-2 text-lg text-slate-400">
            Mission Control for High-Frequency Trading
          </p>
          
          {/* Status Badges */}
          <div className="mt-4 flex flex-wrap gap-3">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full backdrop-blur-sm border ${
              isRunning 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' 
                : 'bg-red-500/20 text-red-300 border-red-500/50'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400 animate-ping' : 'bg-red-400'}`} />
              <span className="text-xs font-bold uppercase tracking-wider">
                {isRunning ? 'Engine Active' : 'Engine Stopped'}
              </span>
            </div>
            
            {isRunning && (
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full backdrop-blur-sm border ${
                mode === 'SHADOW' 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' 
                  : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
              }`}>
                <Zap className="w-3 h-3" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {mode === 'SHADOW' ? 'Shadow Simulation' : 'Live Execution'}
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/50 text-slate-300 border border-slate-800/50">
              <Activity className="w-3 h-3 text-primary" />
              <span className="text-xs font-mono">
                IPC: <span className="text-emerald-400">LIVE</span>
              </span>
            </div>
          </div>
          
          <div className="mt-6">
            <Link href="/copilot">
              <motion.button 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 bg-gradient-to-r from-primary/90 to-secondary/90 hover:from-primary hover:to-secondary text-slate-900 font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-neon transition-all"
              >
                <Brain className="w-5 h-5" />
                Open Alpha-Copilot
              </motion.button>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
