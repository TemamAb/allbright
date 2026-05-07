import React, { useState } from 'react';
import { Activity, Play, Square, ShieldCheck, Zap, Brain, Terminal, AlertCircle, HeartPulse, ScrollText } from 'lucide-react';
import { useLiveTelemetry } from '../services/useLiveTelemetry';
import { invoke } from '@tauri-apps/api/core';
import { SpecialistRegistryView } from './SpecialistRegistryView';
import { AiAuditLogView } from './AiAuditLogView';

/**
 * Copilot: The Unified Command Center
 * Merges Process Actuation (Mission Control) with Intelligence Monitoring.
 * Theme: Ash.Black (#111217)
 */
export const Copilot: React.FC = () => {
  const { state, isConnected } = useLiveTelemetry();
  const [workflowStage, setWorkflowStage] = useState('SIMULATION');
  const [activeTab, setActiveTab] = useState<'KPI' | 'HEALTH' | 'AUDIT'>('KPI');
  const [isStarting, setIsStarting] = useState(false);

  const ges = state?.totalWeightedScore ? (state.totalWeightedScore / 10).toFixed(1) : "0.0";
  const isElite = parseFloat(ges) >= 82.5;

  const handleToggleEngine = async () => {
    setIsStarting(true);
    try {
      if (state?.running) {
        await invoke('stop_solver');
      } else {
        // BSS-43: Enforce safety confirmation for Live stages
        if (['LIVE_SIM', 'CANARY', 'LIVE'].includes(workflowStage)) {
          const confirmed = window.confirm(`⚠️ CRITICAL: Entering ${workflowStage} mode. Real capital is at risk. Proceed?`);
          if (!confirmed) return;
        }
        await invoke('start_solver', { mode: workflowStage });
      }
    } catch (err) {
      console.error("Engine transition failed:", err);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-ash-black text-ash-text font-sans p-6">
      {/* Header: Global Efficiency Score */}
      <div className="flex justify-between items-center mb-8 border-b border-ash-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase tracking-widest">Copilot</h1>
          <p className="text-ash-muted text-sm mt-1">Autonomous Arbitrage Orchestration</p>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-right">
            <span className="block text-xs uppercase text-ash-muted mb-1">Global Efficiency (GES)</span>
            <span className={`text-4xl font-mono font-bold ${isElite ? 'text-emerald-accent' : 'text-amber-500'}`}>
              {ges}%
            </span>
          </div>
          <div className={`h-12 w-1 rounded-full ${isConnected ? 'bg-emerald-accent' : 'bg-red-500'}`} />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 flex-grow">
        {/* Left Column: Mission Actuator */}
        <div className="col-span-4 flex flex-col gap-6">
          <div className="bg-ash-dark border border-ash-border p-5 rounded-lg">
            <h2 className="text-xs uppercase font-bold text-ash-muted mb-4 flex items-center gap-2">
              <Activity size={14} /> Execution Control
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase text-ash-muted block mb-2 font-bold">Workflow Stage</label>
                <select 
                  value={workflowStage}
                  onChange={(e) => setWorkflowStage(e.target.value)}
                  disabled={state?.running}
                  className="w-full bg-ash-black border border-ash-border rounded p-2 text-sm focus:border-cyan-accent outline-none"
                >
                  <option value="SIMULATION">SIMULATION</option>
                  <option value="PAPER_TRADING">PAPER TRADING</option>
                  <option value="SHADOW_MODE">SHADOW MODE</option>
                  <option value="LIVE_SIM">LIVE SIMULATION</option>
                  <option value="CANARY">CANARY RELEASE</option>
                  <option value="LIVE">FULL LIVE MODE</option>
                </select>
              </div>

              <button
                onClick={handleToggleEngine}
                disabled={isStarting}
                className={`w-full py-3 rounded font-bold transition-all flex items-center justify-center gap-2 ${
                  state?.running 
                    ? 'bg-red-900/20 text-red-500 border border-red-500/50 hover:bg-red-500 hover:text-white' 
                    : 'bg-emerald-600/20 text-emerald-accent border border-emerald-500/50 hover:bg-emerald-600 hover:text-white'
                }`}
              >
                {state?.running ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                {state?.running ? 'STOP ENGINE' : 'START MISSION'}
              </button>
            </div>
          </div>

          {/* AI Insights Panel */}
          <div className="bg-ash-dark border border-ash-border p-5 rounded-lg flex-grow">
            <h2 className="text-xs uppercase font-bold text-ash-muted mb-4 flex items-center gap-2">
              <Brain size={14} /> Intelligence Reasoning
            </h2>
            <div className="text-xs font-mono text-cyan-accent leading-relaxed">
              {state?.marketPulse?.latestAlphaReasoning || "Awaiting market discovery pulse..."}
            </div>
          </div>
        </div>

        {/* Right Column: KPI Matrix */}
        <div className="col-span-8 bg-ash-dark border border-ash-border p-5 rounded-lg overflow-y-auto">
          <div className="flex items-center gap-6 mb-6 border-b border-ash-border pb-4 overflow-x-auto scrollbar-hide">
            <button 
              onClick={() => setActiveTab('KPI')}
              className={`text-xs uppercase font-black flex items-center gap-2 transition-all pb-2 -mb-4 border-b-2 ${
                activeTab === 'KPI' ? 'text-white border-emerald-accent' : 'text-ash-muted border-transparent hover:text-ash-text'
              }`}
            >
              <ShieldCheck size={14} /> KPI Matrix
            </button>
            <button 
              onClick={() => setActiveTab('HEALTH')}
              className={`text-xs uppercase font-black flex items-center gap-2 transition-all pb-2 -mb-4 border-b-2 ${
                activeTab === 'HEALTH' ? 'text-white border-emerald-accent' : 'text-ash-muted border-transparent hover:text-ash-text'
              }`}
            >
              <HeartPulse size={14} /> Registry
            </button>
            <button 
              onClick={() => setActiveTab('AUDIT')}
              className={`text-xs uppercase font-black flex items-center gap-2 transition-all pb-2 -mb-4 border-b-2 ${
                activeTab === 'AUDIT' ? 'text-white border-emerald-accent' : 'text-ash-muted border-transparent hover:text-ash-text'
              }`}
            >
              <ScrollText size={14} /> AI Audit Log
            </button>
          </div>
          
          {activeTab === 'KPI' && (
            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Summary Cards */}
              <MetricCard label="24H Net Profit" value={`${state?.currentDailyProfit || 0} ETH`} delta="+2.4%" />
              <MetricCard label="p99 Latency" value={`${state?.avgLatencyMs || 0}ms`} delta="-0.2ms" good={true} />
              <MetricCard label="Win Rate" value={`${(state?.winRate || 0 * 100).toFixed(1)}%`} delta="+0.5%" />
              <MetricCard label="Risk Index" value={state?.riskIndex?.toFixed(4) || "0.00"} delta="STABLE" />
            </div>
          )}

          {activeTab === 'HEALTH' && <SpecialistRegistryView registry={state?.specialistRegistry || []} />}
          
          {activeTab === 'AUDIT' && <AiAuditLogView />}

          <div className="mt-6 border-t border-ash-border pt-6">
             {/* Specialist Status Feed */}
             <div className="space-y-2">
                {state?.anomalyLog?.slice(-5).map((log: string, i: number) => (
                  <div key={i} className="flex gap-3 text-[10px] font-mono border-l-2 border-amber-500 pl-3 py-1 bg-amber-500/5">
                    <span className="text-ash-muted">[{new Date().toLocaleTimeString()}]</span>
                    <span className="text-amber-200 uppercase">ANOMALY:</span>
                    <span>{log}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value: string; delta: string; good?: boolean }> = ({ label, value, delta, good }) => (
  <div className="bg-ash-black border border-ash-border p-4 rounded">
    <span className="block text-[10px] uppercase text-ash-muted mb-1 font-bold">{label}</span>
    <div className="flex justify-between items-baseline">
      <span className="text-xl font-mono font-bold text-white">{value}</span>
      <span className={`text-[10px] font-bold ${good === undefined ? 'text-ash-muted' : good ? 'text-emerald-500' : 'text-red-500'}`}>
        {delta}
      </span>
    </div>
  </div>
);

export default Copilot;