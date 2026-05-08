import React from 'react';
import { Zap, Radio, Globe, ShieldCheck, ChevronDown } from 'lucide-react';
import { useEngine } from '@/stores/engine';

export default function Header() {
  const { engine, isLive } = useEngine();

  return (
    <header className="h-20 flex items-center justify-between px-10 bg-ash-black/80 backdrop-blur-md border-b border-ash-border sticky top-0 z-40">
      <div className="flex items-center gap-10">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className={`w-2.5 h-2.5 rounded-full ${isLive ? 'bg-cyan-accent shadow-[0_0_10px_rgba(34,211,238,0.5)] animate-pulse' : 'bg-zinc-800'}`} />
            <div className={`absolute -inset-1 rounded-full border border-cyan-accent/20 ${isLive ? 'animate-ping' : 'hidden'}`} />
          </div>
          <div>
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] leading-none mb-1">Engine Pulse</p>
            <p className={`text-[10px] font-black uppercase tracking-widest ${isLive ? 'text-white' : 'text-zinc-600'}`}>
              {isLive ? 'IPC Synchronized' : 'Searching for Uplink...'}
            </p>
          </div>
        </div>

        <div className="h-8 w-px bg-ash-border/50" />

        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-0.5">Execution Hub</span>
            <div className="flex items-center gap-2">
              <Globe size={12} className="text-zinc-500" />
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter">Mainnet-Alpha v0.8.2</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8">
        {/* Resource Indicators */}
        <div className="hidden md:flex items-center gap-6 pr-6 border-r border-ash-border/50">
          <div className="text-right">
            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-0.5">Mempool Latency</p>
            <p className="text-[10px] font-black text-cyan-accent font-mono">14ms</p>
          </div>
          <div className="text-right">
            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-0.5">Gas Base</p>
            <p className="text-[10px] font-black text-amber-500 font-mono">18.4 Gwei</p>
          </div>
        </div>

        {/* Identity & Status */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-accent" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Master Signer</span>
            </div>
            <span className="text-[9px] font-mono text-zinc-500 mt-0.5">0x742...f44e</span>
          </div>
          
          <button className="w-10 h-10 rounded-xl bg-ash-dark border border-ash-border flex items-center justify-center hover:border-zinc-700 transition-all group">
            <ChevronDown size={18} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
          </button>
        </div>
      </div>
    </header>
  );
}