import React from 'react';
import { Brain, Cpu, Lock, TrendingUp, AlertTriangle, Zap, Activity, ShieldCheck } from 'lucide-react';
import { useEngine } from '@/stores/engine';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

const AiOptimizer: React.FC = () => {
  const { engine, telemetry } = useEngine();

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">Neural Optimizer</h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] mt-3">Copilot Meta-Learner Persistence</p>
        </div>
        
        <div className="bg-ash-black border border-ash-border px-6 py-4 rounded-2xl flex items-center gap-4 shadow-xl">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-cyan-accent" />
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Active Inference Mode</span>
          </div>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Learning Episodes" value={engine.aiEpisodes?.toString() || "0"} icon={<Cpu className="text-cyan-accent" />} />
        <MetricCard title="Optimization Loops" value={(engine.optimizationCycles || 0).toString()} icon={<TrendingUp className="text-emerald-accent" />} />
        <MetricCard title="Success EMA" value={`${((engine.winRate || 0) * 100).toFixed(1)}%`} icon={<Brain className="text-purple-400" />} />
        <MetricCard title="Profit Momentum" value={engine.profitMomentum || "0.00"} unit="ETH/h" icon={<Zap className="text-amber-400" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sentinel Lock */}
        <div className="lg:col-span-1 bg-ash-black border border-ash-border rounded-2xl p-8 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-accent/5 blur-3xl -mr-16 -mt-16" />
          <div className="flex items-center gap-4 mb-8">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${engine.hardened ? 'bg-emerald-accent/10 border-emerald-accent/30 text-emerald-accent' : 'bg-ash-dark border-ash-border text-zinc-600'}`}>
              <Lock size={24} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Sentinel Lock</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">BSS-56 Elite Guard</p>
            </div>
          </div>
          
          <p className="text-[10px] text-zinc-500 leading-relaxed font-medium mb-8 uppercase tracking-tight">
            Once system GES exceeds 82.5%, the Copilot freezes the "Gold Standard" neural weights to prevent strategy drift and adversarial poisoning.
          </p>

          <div className="space-y-4">
            <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${engine.hardened ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-ash-border bg-black'}`}>
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Lock Status</span>
              <Badge className={`${engine.hardened ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-800 text-zinc-500'} text-[8px] font-black uppercase px-2 py-0.5 rounded`}>
                {engine.hardened ? 'ENGAGED' : 'STANDBY'}
              </Badge>
            </div>
            
            <Button 
              className={`w-full h-12 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${engine.hardened ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-emerald-accent text-black hover:bg-emerald-accent/80'}`}
              disabled={engine.hardened}
            >
              Force Manual Freeze
            </Button>
          </div>
        </div>

        {/* Neural Network Visualization (Placeholder for future Canvas) */}
        <div className="lg:col-span-2 bg-ash-black border border-ash-border rounded-2xl p-8 shadow-xl flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.05)_0%,transparent_70%)]" />
          <Brain size={64} className="text-ash-border mb-6 animate-pulse" />
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">Neural Mapping Active</p>
          <div className="absolute bottom-8 left-8 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-accent" />
              <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Input Layer</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Hidden Vector</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-accent" />
              <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Actuator</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, unit, icon }: { title: string, value: string, unit?: string, icon: React.ReactNode }) => (
  <div className="bg-ash-black border border-ash-border rounded-2xl p-6 shadow-xl group hover:border-white/10 transition-all">
    <div className="flex items-center justify-between mb-4">
      <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{title}</span>
      <div className="w-8 h-8 rounded-lg bg-white/[0.02] flex items-center justify-center border border-ash-border/30 group-hover:border-white/20 transition-all">
        {icon}
      </div>
    </div>
    <div className="flex items-baseline gap-2">
      <span className="text-3xl font-black text-white font-mono tracking-tighter tabular-nums">{value}</span>
      {unit && <span className="text-[10px] font-bold text-zinc-600 uppercase">{unit}</span>}
    </div>
  </div>
);

export default AiOptimizer;