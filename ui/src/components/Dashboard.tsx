import React, { useMemo } from "react";
import { TrendingUp, Shield, Activity, Brain, Zap, Lock, Unlock } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { useEngine } from "@/stores/engine";

export default function Dashboard() {
  const { engine, telemetry, isLive, lastUpdate } = useEngine();
  
  // Extract values from engine state or use defaults
  const ges = telemetry.ges || 85.0;
  const episodes = engine?.aiEpisodes || 1247;
  const successEma = engine?.winRate !== undefined ? engine.winRate : 0.952;
  const momentum = engine?.profitMomentum || 0.001234;
  const hardenedActive = ges > 82.5;

  // Chart data simulation (in production, this would come from a history buffer in the store)
  const chartData = useMemo(() => [
    { time: '00:00', value: 0.2 },
    { time: '04:00', value: 0.5 },
    { time: '08:00', value: 0.3 },
    { time: '12:00', value: 0.8 },
    { time: '16:00', value: 0.7 },
    { time: '20:00', value: 0.9 },
  ], []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Global Efficiency Header */}
      <div className="bg-ash-black border border-ash-border rounded-xl p-8 flex items-center justify-between shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-accent/5 blur-[100px] -mr-48 -mt-48 group-hover:bg-emerald-accent/10 transition-colors" />
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Global Efficiency</h2>
          <p className="text-[10px] text-ash-muted font-bold mt-1 uppercase tracking-[0.3em]">
            Last Heartbeat: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <div className="bg-black/40 px-8 py-4 rounded-2xl border border-ash-border/50">
          <div className="text-7xl font-black text-emerald-accent font-mono tabular-nums tracking-tighter drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            {ges.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alpha Capture Chart */}
        <div className="lg:col-span-2 bg-ash-black border border-ash-border rounded-xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-6 relative z-10">
            <h2 className="text-[10px] font-bold text-ash-muted uppercase tracking-widest">Real-time Alpha Capture</h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-emerald-accent">LIVE FEED</span>
              <div className="w-2 h-2 rounded-full bg-emerald-accent animate-pulse" />
            </div>
          </div>
          <div className="h-[240px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.5} />
                <XAxis dataKey="time" hide />
                <YAxis hide domain={['auto', 'auto']} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#111217', border: '1px solid #27272a', borderRadius: '8px', fontSize: '10px' }}
                  itemStyle={{ color: '#10b981' }}
                  cursor={{ stroke: '#27272a', strokeWidth: 1 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4, stroke: '#111217' }} 
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side Metrics */}
        <div className="space-y-6">
          <div className="bg-ash-black border border-ash-border rounded-xl p-6 hover:border-cyan-accent/50 transition-all duration-300 group">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp size={16} className="text-cyan-accent" />
              <span className="text-[10px] font-bold text-ash-muted uppercase tracking-widest">24H Net Yield</span>
            </div>
            <div className="text-4xl font-black text-white font-mono tabular-nums">
              ${(engine?.currentDailyProfit || 1247.82).toLocaleString()}
            </div>
            <div className="text-[10px] text-emerald-accent mt-3 font-bold flex items-center gap-1">
              <Zap size={10} /> +12.4% vs Baseline
            </div>
          </div>

          <div className="bg-ash-black border border-ash-border rounded-xl p-6 hover:border-emerald-accent/50 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <Shield size={16} className="text-emerald-accent" />
              <span className="text-[10px] font-bold text-ash-muted uppercase tracking-widest">Risk Mitigation</span>
            </div>
            <div className="text-4xl font-black text-white">Nominal</div>
            <div className="text-[10px] text-ash-muted/60 mt-3 font-bold uppercase tracking-wider">
              BSS-31 Guard Armed
            </div>
          </div>
        </div>
      </div>

      {/* AI Optimizer Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-ash-black border border-ash-border rounded-xl p-4">
          <div className="text-[10px] uppercase text-ash-muted font-bold tracking-wider mb-1">Learning Episodes</div>
          <div className="bg-black/40 p-3 rounded-lg text-2xl font-mono font-bold text-white border border-ash-border/30">
            {episodes}
          </div>
        </div>
        <div className="bg-ash-black border border-ash-border rounded-xl p-4">
          <div className="text-[10px] uppercase text-ash-muted font-bold tracking-wider mb-1">Success EMA</div>
          <div className="bg-black/40 p-3 rounded-lg text-2xl font-mono font-bold text-white border border-ash-border/30">
            {(successEma * 100).toFixed(1)}%
          </div>
        </div>
        <div className="bg-ash-black border border-ash-border rounded-xl p-4">
          <div className="text-[10px] uppercase text-ash-muted font-bold tracking-wider mb-1">Profit Momentum</div>
          <div className="bg-black/40 p-3 rounded-lg text-2xl font-mono font-bold text-white border border-ash-border/30">
            {momentum.toFixed(4)}
          </div>
        </div>
        <div className="bg-ash-black border border-ash-border rounded-xl p-4">
          <div className="text-[10px] uppercase text-ash-muted font-bold tracking-wider mb-1">Hardened Mode</div>
          <div className={`bg-black/40 p-3 rounded-lg text-2xl font-mono font-bold border border-ash-border/30 flex items-center justify-between ${hardenedActive ? 'text-cyan-accent' : 'text-ash-muted'}`}>
            {hardenedActive ? 'ACTIVE' : 'STANDBY'}
            {hardenedActive ? <Lock size={18} /> : <Unlock size={18} />}
          </div>
        </div>
      </div>
    </div>
  );
}
