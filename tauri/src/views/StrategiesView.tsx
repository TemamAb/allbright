import React, { useState, useEffect } from "react";
import { Globe, BrainCircuit, Bolt, Shield, CheckCircle2, Play, Square } from "lucide-react";
import { startSolver, stopSolver, getSolverStatus } from '../lib/tauri';

export default function StrategiesView() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentMode, setCurrentMode] = useState('stopped');
  const [loading, setLoading] = useState(false);

  const [strategiesList, setStrategiesList] = useState([
    { id: 'arb', title: 'Multi-Chain Arbitrage', desc: '8 chain arbitrage execution vectors', active: true, icon: Globe },
    { id: 'graph', title: 'Graph Solver SPFA', desc: 'Negative cycle detection in mempool', active: true, icon: BrainCircuit },
    { id: 'sim', title: 'Pre-Exec Simulation', desc: 'Full eth_call validation before broadcast', active: true, icon: Bolt },
    { id: 'risk', title: 'Risk Engine', desc: 'BSS-31 Dynamic profit gates and circuit breakers', active: true, icon: Shield }
  ]);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await getSolverStatus();
        setIsRunning(status.running);
        setCurrentMode(status.mode);
      } catch (error) {
        console.error('Failed to get solver status:', error);
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleStrategy = (id: string) => {
    setStrategiesList(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  const toggleAllStrategies = async () => {
    setLoading(true);
    try {
      if (isRunning) {
        await stopSolver();
        setIsRunning(false);
        setCurrentMode('stopped');
      } else {
        await startSolver('simulation');
        setIsRunning(true);
        setCurrentMode('simulation');
      }
    } catch (error) {
      console.error('Failed to toggle solver:', error);
      alert(`Failed to ${isRunning ? 'stop' : 'start'} solver: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black uppercase text-white">Strategy Configurator</h2>
          <p className="text-[10px] text-secondary uppercase tracking-widest mt-1">Manage arbitrage execution parameters</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-700'}`}></div>
            <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">
              {isRunning ? `${currentMode} mode` : 'stopped'}
            </span>
          </div>
          <button
            onClick={toggleAllStrategies}
            disabled={loading}
            className={`px-6 py-2 rounded-lg font-black uppercase text-[10px] tracking-widest transition-all ${
              isRunning 
                ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30' 
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
            } disabled:opacity-50`}
          >
            {loading ? '...' : isRunning ? <div className="flex items-center gap-2"><Square size={12} /> STOP CORE</div> : <div className="flex items-center gap-2"><Play size={12} /> START CORE</div>}
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {strategiesList.map((strat) => {
          const Icon = strat.icon;
          return (
            <div 
              key={strat.id} 
              className={`strategy-card rounded-xl p-5 transition-all ${strat.active ? 'strategy-active shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'opacity-60 grayscale'}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <div className={`p-2 rounded-lg ${strat.active ? 'bg-cyan-500/20' : 'bg-zinc-800'}`}>
                    <Icon size={20} className={strat.active ? 'text-cyan-400' : 'text-zinc-500'} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm uppercase text-white tracking-widest">{strat.title}</h3>
                    <p className="text-[10px] text-secondary mt-1 font-medium leading-relaxed">
                      {strat.desc}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => toggleStrategy(strat.id)} 
                  className={`text-[9px] uppercase font-black px-3 py-1.5 rounded transition-colors ${
                    strat.active ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-[#32323e] text-secondary border border-transparent'
                  }`}
                >
                  {strat.active ? 'ACTIVE' : 'INACTIVE'}
                </button>
              </div>
              
              {strat.active && (
                <div className="mt-4 pt-4 border-t border-ash flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[9px] text-emerald-500 font-bold uppercase tracking-widest">
                    <CheckCircle2 size={12} />
                    Strategy online
                  </div>
                  <span className="text-[8px] text-zinc-600 font-mono">v2.1.0-ELITE</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}