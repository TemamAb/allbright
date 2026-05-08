import React, { useState } from 'react';
import { Settings, Server, Key, Sliders, Save, RefreshCcw, ShieldCheck, Database, Globe } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

const SystemSettings: React.FC = () => {
  const [config, setConfig] = useState({
    mode: 'LIVE_SIM',
    rpcEndpoint: 'https://eth-mainnet.g.alchemy.com/v2/...',
    pimlicoKey: 'pim_...',
    minMarginBps: 1000,
    bribeRatioBps: 500
  });

  return (
    <div className="p-8 space-y-12 max-w-5xl animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">System Settings</h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] mt-3">High-Authority Engine Parameters</p>
        </div>
        
        <Button className="h-12 px-8 rounded-xl bg-emerald-accent text-black hover:bg-emerald-accent/80 font-black uppercase tracking-widest shadow-xl shadow-emerald-accent/10 flex items-center gap-3">
          <Save size={18} />
          Commit Configuration
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Infrastructure */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-ash-black border border-ash-border rounded-2xl p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-cyan-accent/30" />
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
              <Server size={14} className="text-cyan-accent" /> Network Infrastructure
            </h3>

            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">Primary Execution Mode</label>
                <div className="grid grid-cols-3 gap-3">
                  {['SHADOW', 'LIVE_SIM', 'LIVE'].map(m => (
                    <button 
                      key={m}
                      onClick={() => setConfig(prev => ({ ...prev, mode: m }))}
                      className={`h-11 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all ${
                        config.mode === m 
                          ? 'bg-cyan-accent/10 border-cyan-accent/40 text-cyan-accent' 
                          : 'bg-black/40 text-zinc-600 border-ash-border hover:text-zinc-400'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Database size={12} className="text-zinc-700" /> RPC Backbone URL
                  </label>
                  <div className="relative">
                    <input 
                      type="password" 
                      value={config.rpcEndpoint}
                      className="w-full bg-black/40 border border-ash-border rounded-xl px-4 py-3 text-xs font-mono text-zinc-400 focus:outline-none focus:border-cyan-accent/50 transition-all" 
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <RefreshCcw size={14} className="text-zinc-700 hover:text-zinc-500 cursor-pointer" />
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Key size={12} className="text-zinc-700" /> Account Abstraction Key
                  </label>
                  <input 
                    type="password" 
                    value={config.pimlicoKey}
                    className="w-full bg-black/40 border border-ash-border rounded-xl px-4 py-3 text-xs font-mono text-zinc-400 focus:outline-none focus:border-cyan-accent/50 transition-all" 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-ash-black border border-ash-border rounded-2xl p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-accent/30" />
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
              <Sliders size={14} className="text-emerald-accent" /> Profit & Risk Thresholds
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="flex justify-between items-baseline">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Min Margin Yield</label>
                  <span className="text-xs font-black text-emerald-accent font-mono">{config.minMarginBps} BPS</span>
                </div>
                <input 
                  type="range" 
                  min="100" max="5000" step="50" 
                  value={config.minMarginBps} 
                  onChange={(e) => setConfig(prev => ({ ...prev, minMarginBps: parseInt(e.target.value) }))} 
                  className="w-full h-1.5 bg-black rounded-lg appearance-none cursor-pointer accent-emerald-accent" 
                />
                <div className="flex justify-between text-[8px] font-black text-zinc-700 uppercase">
                  <span>Conservative</span>
                  <span>Aggressive</span>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-baseline">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Bribe Allocation</label>
                  <span className="text-xs font-black text-cyan-accent font-mono">{config.bribeRatioBps} BPS</span>
                </div>
                <input 
                  type="range" 
                  min="100" max="2500" step="10" 
                  value={config.bribeRatioBps} 
                  onChange={(e) => setConfig(prev => ({ ...prev, bribeRatioBps: parseInt(e.target.value) }))} 
                  className="w-full h-1.5 bg-black rounded-lg appearance-none cursor-pointer accent-cyan-accent" 
                />
                <div className="flex justify-between text-[8px] font-black text-zinc-700 uppercase">
                  <span>Standard</span>
                  <span>Flash-Priority</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Status & Security */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-ash-black border border-ash-border rounded-2xl p-8 shadow-xl h-full flex flex-col">
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
              <ShieldCheck size={14} className="text-zinc-500" /> Security State
            </h3>
            
            <div className="space-y-6 flex-grow">
              <StatusRow label="Encrypted Storage" status="NOMINAL" good={true} />
              <StatusRow label="Hardware Root" status="VERIFIED" good={true} />
              <StatusRow label="Relay Connectivity" status="SECURE" good={true} />
              <StatusRow label="Anti-Hijack Buffer" status="ACTIVE" good={true} />
            </div>

            <div className="mt-8 pt-8 border-t border-ash-border/50">
              <div className="bg-ash-dark rounded-2xl p-6 border border-ash-border/30 group hover:border-white/10 transition-all cursor-pointer">
                <div className="flex items-center gap-4 mb-4">
                  <Globe size={24} className="text-zinc-700" />
                  <div>
                    <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Region Enforcement</h4>
                    <p className="text-[9px] text-zinc-600 font-bold uppercase mt-1">Institutional Compliance</p>
                  </div>
                </div>
                <Badge className="bg-zinc-800 text-zinc-400 text-[8px] font-black uppercase px-2 py-0.5 rounded tracking-widest">
                  GLOBAL RESTRICTED
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatusRow = ({ label, status, good }: { label: string, status: string, good?: boolean }) => (
  <div className="flex items-center justify-between py-4 border-b border-ash-border/30 last:border-0">
    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{label}</span>
    <div className="flex items-center gap-3">
      <span className={`text-[10px] font-black ${good ? 'text-emerald-accent' : 'text-zinc-400'}`}>{status}</span>
      <div className={`w-1.5 h-1.5 rounded-full ${good ? 'bg-emerald-accent animate-pulse' : 'bg-zinc-800'}`} />
    </div>
  </div>
);

export default SystemSettings;