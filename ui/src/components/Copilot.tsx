import React, { useState } from 'react';
import { Activity, Play, Square, ShieldCheck, Brain, Zap, Terminal, HeartPulse, ScrollText, Radio } from 'lucide-react';
import { useEngine } from '@/stores/engine';
import { invoke } from '@tauri-apps/api/core';
import { SpecialistRegistryView } from './SpecialistRegistryView';
import { AiAuditLogView } from './AiAuditLogView';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export const Copilot: React.FC = () => {
  const { engine, telemetry, isLive } = useEngine();
  const [workflowStage, setWorkflowStage] = useState('SIMULATION');
  const [activeTab, setActiveTab] = useState<'KPI' | 'REGISTRY' | 'AUDIT'>('KPI');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const ges = telemetry.ges || 0;
  const isElite = ges >= 82.5;

  const handleToggleEngine = async () => {
    setIsTransitioning(true);
    try {
      if (engine.running) {
        await invoke('stop_solver');
      } else {
        if (['LIVE_SIM', 'CANARY', 'LIVE'].includes(workflowStage)) {
          const confirmed = window.confirm(`⚠️ CRITICAL: Entering ${workflowStage} mode. Real capital is at risk. Proceed?`);
          if (!confirmed) return;
        }
        await invoke('start_solver', { mode: workflowStage });
      }
    } catch (err) {
      console.error("Engine transition failed:", err);
    } finally {
      setIsTransitioning(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Top Banner */}
      <div className="bg-ash-black border border-ash-border rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-accent via-emerald-accent to-transparent" />
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-accent/5 blur-[100px] group-hover:bg-emerald-accent/10 transition-all duration-1000" />
        
        <div className="flex items-center gap-6 relative z-10">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-500 ${engine.running ? 'bg-emerald-accent/10 border-emerald-accent/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-ash-dark border-ash-border'}`}>
            <Brain className={engine.running ? 'text-emerald-accent' : 'text-zinc-600'} size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">Command Center</h1>
            <div className="flex items-center gap-3 mt-3">
              <Badge className={`${engine.running ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-zinc-800 text-zinc-500 border-zinc-700'} text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-widest`}>
                {engine.running ? '● SYSTEM ACTIVE' : '○ SYSTEM STANDBY'}
              </Badge>
              <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest flex items-center gap-2">
                <Radio size={12} className={isLive ? 'text-cyan-accent animate-pulse' : 'text-zinc-800'} />
                {workflowStage} Mode
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-12 relative z-10 mt-6 md:mt-0">
          <div className="text-right">
            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1">Global Efficiency</p>
            <div className={`text-5xl font-black font-mono tabular-nums ${isElite ? 'text-emerald-accent' : 'text-amber-500'}`}>
              {ges.toFixed(1)}%
            </div>
          </div>
          <Button 
            onClick={handleToggleEngine}
            disabled={isTransitioning}
            className={`h-16 px-8 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl flex items-center gap-4 ${
              engine.running 
                ? 'bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white shadow-red-500/10' 
                : 'bg-emerald-accent text-black hover:bg-emerald-accent/80 shadow-emerald-accent/20'
            }`}
          >
            {engine.running ? <Square size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
            {engine.running ? 'Abort Mission' : 'Engage Kernel'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 flex-grow">
        {/* Left Column: Actuator & Reasoning */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
          <div className="bg-ash-black border border-ash-border rounded-2xl p-6 shadow-xl">
            <h2 className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
              <Zap size={14} className="text-cyan-accent" /> Control Actuation
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-3">Target Workflow Stage</label>
                <div className="grid grid-cols-2 gap-2">
                  {['SIMULATION', 'PAPER', 'SHADOW', 'LIVE'].map((stage) => (
                    <button
                      key={stage}
                      onClick={() => setWorkflowStage(stage)}
                      disabled={engine.running}
                      className={`h-10 rounded-xl text-[9px] font-black uppercase transition-all border ${
                        workflowStage === stage 
                          ? 'bg-cyan-accent/10 border-cyan-accent/40 text-cyan-accent' 
                          : 'bg-black/40 border-ash-border text-zinc-600 hover:text-zinc-400'
                      } ${engine.running ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {stage}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-ash-border/50">
                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest mb-4">
                  <span className="text-zinc-500">Mempool Health</span>
                  <span className="text-emerald-accent">NOMINAL</span>
                </div>
                <div className="h-1.5 w-full bg-black rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-accent/40 w-[88%] rounded-full" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-ash-black border border-ash-border rounded-2xl p-6 flex-grow shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Brain size={80} className="text-cyan-accent" />
            </div>
            <h2 className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
              <Terminal size={14} className="text-cyan-accent" /> Logic Reasoning
            </h2>
            <div className="text-xs font-mono text-cyan-accent/80 leading-relaxed custom-scrollbar overflow-y-auto max-h-[300px]">
              {engine.marketPulse?.latestAlphaReasoning || "Initializing neural reasoning loops... Waiting for mempool discovery events."}
            </div>
          </div>
        </div>

        {/* Right Column: Matrix & Logs */}
        <div className="col-span-12 lg:col-span-8 bg-ash-black border border-ash-border rounded-2xl p-8 flex flex-col shadow-2xl">
          <div className="flex items-center gap-8 mb-8 border-b border-ash-border/50 pb-6 overflow-x-auto custom-scrollbar">
            {[
              { id: 'KPI', icon: ShieldCheck, label: 'Metric Matrix' },
              { id: 'REGISTRY', icon: HeartPulse, label: 'Specialist Registry' },
              { id: 'AUDIT', icon: ScrollText, label: 'Neural Audit' }
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all pb-4 -mb-6 border-b-2 ${
                  activeTab === tab.id ? 'text-white border-emerald-accent' : 'text-zinc-600 border-transparent hover:text-zinc-400'
                }`}
              >
                <tab.icon size={14} /> {tab.label}
              </button>
            ))}
          </div>
          
          <div className="flex-grow">
            {activeTab === 'KPI' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <MetricCard label="Active Episodes" value={engine.aiEpisodes?.toString() || "0"} unit="LE" />
                <MetricCard label="System Win Rate" value={`${((engine.winRate || 0) * 100).toFixed(1)}%`} good={engine.winRate > 0.75} />
                <MetricCard label="Net Momentum" value={engine.profitMomentum || "0.00"} unit="ETH/h" />
                <MetricCard label="Node Latency" value={`${engine.avgLatencyMs || 0}`} unit="ms" good={engine.avgLatencyMs < 50} />
              </div>
            )}

            {activeTab === 'REGISTRY' && <SpecialistRegistryView registry={engine.specialistRegistry || []} />}
            {activeTab === 'AUDIT' && <AiAuditLogView />}
          </div>

          <div className="mt-8 pt-8 border-t border-ash-border/50">
             <div className="space-y-3">
                {(engine.anomalyLog || []).slice(-3).map((log: string, i: number) => (
                  <div key={i} className="flex gap-4 text-[9px] font-mono border-l-2 border-amber-500/50 pl-4 py-2 bg-amber-500/[0.03] rounded-r-lg group">
                    <span className="text-zinc-700">[{new Date().toLocaleTimeString()}]</span>
                    <span className="text-amber-500 font-black uppercase">ANOMALY</span>
                    <span className="text-zinc-400 group-hover:text-zinc-200 transition-colors">{log}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value: string; unit?: string; good?: boolean }> = ({ label, value, unit, good }) => (
  <div className="bg-ash-dark border border-ash-border p-6 rounded-2xl group hover:border-white/10 transition-all">
    <span className="block text-[9px] font-black uppercase text-zinc-500 mb-3 tracking-widest">{label}</span>
    <div className="flex items-baseline gap-2">
      <span className="text-3xl font-black font-mono text-white tabular-nums">{value}</span>
      {unit && <span className="text-[10px] font-bold text-zinc-600 uppercase">{unit}</span>}
      <div className={`ml-auto w-1.5 h-1.5 rounded-full ${good === undefined ? 'bg-zinc-800' : good ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
    </div>
  </div>
);

export default Copilot;