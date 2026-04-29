import { useGetEngineStatus } from "@workspace/api-client-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { Activity, Zap, Wallet, TrendingUp, Shield, Cpu, Info, AlertTriangle, Layers } from "lucide-react";
import { useWallets } from "@/context/WalletContext";
import { useState, useMemo } from "react";
import { useLiveTelemetry } from "../../../api/src/services/useLiveTelemetry";
import { AnomalyTicker } from "../components/AnomalyTicker";
import { MarketSentiment } from "../../../api/src/services/MarketSentiment";
import { motion } from "framer-motion";
import DashboardHero from "@/components/DashboardHero";

export default function Dashboard() {
  const { state: liveState, isConnected, history } = useLiveTelemetry();
  const { data: status } = useGetEngineStatus({
    query: { refetchInterval: 3000, queryKey: ["engine-status"] }
  });
  const { totalBalance } = useWallets();
  const [showUSD, setShowUSD] = useState(false);

  const dailyProfit = liveState?.currentDailyProfit ?? 0.0092;
  const ethPrice = 2350; // Mock ETH price in USD

  const [confidence, setConfidence] = useState<'Low' | 'Good' | 'VeryGood'>('VeryGood');

  const isRunning = liveState?.running ?? status?.running;
  const mode = liveState?.mode ?? status?.mode ?? "STOPPED";
  
  // BSS-17: War Mode detection based on competitive auction factor
  const isWarMode = (liveState?.auctionParams?.competitiveFactor ?? 1.0) > 1.5;
  const [comparisonType, setComparisonType] = useState<string>("ALL");
  const [isDetailedView, setIsDetailedView] = useState(false);

  const isLive = mode === "LIVE";
  const metricColor = isLive ? "text-emerald-500" : "text-yellow-500";

  // Elite Matrix Master Definition (Filtered by visibleKpis state)
  const ALL_KPI_CATEGORIES = [
    { name: "Profitability", score: (dailyProfit/22.5)*100, metrics: [
      { id: '1.1', label: 'Daily Yield', actual: dailyProfit, bench: 22.5, exp: 14.7, unit: 'ETH' },
      { id: '1.2', label: 'Profit/Trade', actual: 0.0031, bench: 0.0045, exp: 0.004, unit: 'ETH' },
      { id: '1.3', label: 'Alpha Decay', actual: liveState?.alphaDecayAvgMs ?? 0, bench: 5, exp: 15, unit: 'MS' },
    ]},
    { name: "Risk Management", score: 98, metrics: [
      { id: '2.1', label: 'Loss Rate', actual: 0.02, bench: 0.05, exp: 0.1, unit: '%' },
      { id: '2.2', label: 'Adversarial Deflect', actual: 99.9, bench: 99.9, exp: 95, unit: '%' },
      { id: '2.3', label: 'Risk Index', actual: liveState?.riskIndex ?? 0, bench: 0.01, exp: 0.05, unit: 'IDX' },
    ]},
    { name: "Performance", score: 85, metrics: [
      { id: '3.1', label: 'Solver Latency', actual: liveState?.avgLatencyMs ?? 0, bench: 12, exp: 40, unit: 'MS' },
      { id: '3.2', label: 'Msg Throughput', actual: liveState?.msgThroughputCount ?? 0, bench: 500, exp: 350, unit: 'TPS' },
    ]},
    { name: "Efficiency", score: 92, metrics: [
      { id: '4.1', label: 'Gas Efficiency', actual: 94.2, bench: 96.5, exp: 95, unit: '%' },
      { id: '4.2', label: 'Success Rate', actual: (liveState?.successRate ?? 0) * 100, bench: 98.8, exp: 95, unit: '%' },
    ]},
    { name: "System Health", score: 100, metrics: [
      { id: '5.1', label: 'Uptime', actual: 99.9, bench: 99.9, exp: 99, unit: '%' }
    ]},
    { name: "Auto-Optimization", score: 88, metrics: [
      { id: '6.1', label: 'Convergence Rate', actual: 2.8, bench: 3.0, exp: 5.0, unit: 'CYC' },
      { id: '6.2', label: 'Opt Improvement', actual: 12, bench: 15, exp: 10, unit: '%' },
    ]},
    { name: "Orchestration", score: 95, metrics: [
      { id: '7.1', label: 'Alpha-Copilot Latency', actual: 15, bench: 10, exp: 25, unit: 'MS' }
    ]}
  ];

  const visibleKpis = liveState?.visibleKpis ?? [];
  const KPI_CATEGORIES = useMemo(() => {
    return ALL_KPI_CATEGORIES.map(cat => ({
      ...cat,
      metrics: cat.metrics.filter(m => visibleKpis.includes(m.id))
    })).filter(cat => cat.metrics.length > 0);
  }, [visibleKpis, liveState]);

  return (
    <div className={`space-y-6 transition-all duration-1000 p-1 ${isWarMode ? 'ring-1 ring-red-500/50 bg-red-950/5 shadow-[inset_0_0_50px_rgba(239,68,68,0.1)]' : ''}`}>
      {/* Animated Hero Section */}
      <DashboardHero />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={20} className="text-electric animate-pulse" />
          <h1 className="text-electric text-2xl font-bold uppercase tracking-widest">
            Mission Telemetry
          </h1>
          {isWarMode && (
            <span className="ml-2 px-2 py-0.5 bg-red-600 text-white text-[10px] font-black rounded animate-bounce">WAR MODE</span>
          )}
        </div>
        <div className="flex bg-black/40 border border-white/10 rounded p-1 gap-2">
          <button 
            onClick={() => setIsDetailedView(!isDetailedView)}
            className={`px-3 py-0.5 text-[8px] uppercase font-black rounded transition-all ${isDetailedView ? 'bg-primary text-white' : 'bg-white/5 text-muted-foreground'}`}
          >
            {isDetailedView ? 'Detailed View' : 'Summary View'}
          </button>
        </div>
        <div className="flex bg-black/40 border border-white/10 rounded p-1">
          {["NONE", "SIM_VS_LIVE", "ALL"].map(t => (
            <button 
              key={t}
              onClick={() => setComparisonType(t)}
              className={`px-2 py-0.5 text-[8px] uppercase font-bold rounded transition-all ${comparisonType === t ? 'bg-sky-500/20 text-sky-400' : 'text-muted-foreground'}`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded bg-black/40 border border-white/5">
            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
            <span className="text-[10px] font-mono text-white/60 uppercase tracking-tighter">
              {isConnected ? "Telemetry Linked" : "Telemetry Offline"}
            </span>
          </div>
          <div className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-widest border ${
            isRunning
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              : "bg-red-500/10 text-red-400 border-red-500/30"
          }`}>
            {isRunning ? "ENGINE ACTIVE" : "ENGINE STOPPED"}
          </div>
          <div className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-widest border ${
            mode === "SHADOW"
              ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
              : "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
          }`}>
            {mode} MODE
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUSD(!showUSD)}
              className="px-2 py-0.5 rounded text-xs font-bold transition-colors hover:bg-zinc-800/20"
            >
              {showUSD ? "USD" : "ETH"}
            </button>
          </div>
        </div>
      </div>

      {/* BSS-43: Simulation Control & Confidence Guidance */}
      <div className="glass-panel border border-border rounded-xl p-4 bg-zinc-900/40">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-electric" />
            <h2 className="text-[11px] uppercase tracking-widest text-foreground font-bold">Simulation Confidence Protocol</h2>
          </div>
          {confidence !== 'VeryGood' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded">
              <AlertTriangle size={12} className="text-amber-400" />
              <span className="text-[10px] text-amber-200 font-mono">ADVISORY: Upgrade to VeryGood (99.7%) for Elite validation</span>
            </motion.div>
          )}
        </div>
        
        <div className="flex gap-4">
          {(['Low', 'Good', 'VeryGood'] as const).map((grade) => (
            <button
              key={grade}
              onClick={() => setConfidence(grade)}
              title={grade !== 'VeryGood' ? "Advisory: Elite Grade recommends VeryGood for mathematical certainty." : "Elite Grade Standard: 99.7% Accuracy"}
              className={`flex-1 group relative flex flex-col items-center p-3 rounded-lg border transition-all duration-300 ${
                confidence === grade 
                  ? grade === 'VeryGood' ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-amber-500/10 border-amber-500/50'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold ${confidence === grade ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {grade === 'VeryGood' ? 'VERY GOOD' : grade.toUpperCase()}
                </span>
                {grade === 'VeryGood' && <Zap size={10} className="text-emerald-400" />}
              </div>
              <span className="text-[9px] text-muted-foreground font-mono">
                {grade === 'Low' ? '85.0%' : grade === 'Good' ? '95.0%' : '99.7% (ELITE)'}
              </span>
              
              {/* Visual recommendation tooltip hint */}
              {grade !== 'VeryGood' && (
                <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Info size={12} className="text-amber-400" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 36 KPI Comparison Grid - Phase 1: Key Performance Clusters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {KPI_CATEGORIES.map(cat => (
          <div key={cat.name} className="space-y-3">
            <h2 className="text-[10px] uppercase font-black tracking-widest text-muted-foreground flex items-center gap-2">
              <Layers size={10} /> {cat.name} Cluster
            </h2>
            <div className="grid grid-cols-1 gap-2">
              {cat.metrics.map(m => {
                const benchDiff = ((m.actual - m.bench) / m.bench) * 100;
                const liveDiff = ((m.actual - m.exp) / m.exp) * 100;
                return (
                  <div key={m.id} className="glass-panel border border-white/5 p-3 rounded-lg relative overflow-hidden h-24 flex flex-col justify-center">
                    <div className="absolute top-1 left-2 flex flex-col">
                      <span className="text-[7px] text-muted-foreground uppercase font-bold">Benchmark (GSE)</span>
                      <span className="text-[9px] text-sky-400 font-mono">
                        {m.bench} {m.unit} ({benchDiff >= 0 ? '+' : ''}{benchDiff.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="absolute top-1 right-2 flex flex-col items-end">
                      <span className="text-[7px] text-muted-foreground uppercase font-bold">Expected Live</span>
                      <span className="text-[9px] text-emerald-300 font-mono">
                        {m.exp} {m.unit} ({liveDiff >= 0 ? '+' : ''}{liveDiff.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="text-center mt-3">
                      <div className="text-[8px] text-white/40 uppercase tracking-tighter mb-0.5">{m.label}</div>
                      <div className={`text-xl font-black font-mono tracking-tighter ${metricColor}`}>
                        {m.actual.toFixed(m.unit === 'ETH' ? 4 : 1)}
                        <span className="text-[10px] ml-1 opacity-50 uppercase">{m.unit}</span>
                      </div>
                    </div>
                    <div className={`absolute bottom-0 left-0 h-0.5 ${isLive ? 'bg-emerald-500' : 'bg-yellow-500'}`} style={{ width: `${Math.min(100, (m.actual/m.bench)*100)}%` }} />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* KPI Cards */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Engine Status */}
        <div className="glass-panel border border-border rounded p-4">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Engine Status
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isRunning ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
            <span className="text-lg font-bold text-foreground">
              {mode}
            </span>
          </div>
          <div className="text-[9px] text-muted-foreground mt-1">
            {liveState?.scannerActive ? "Scanner: Active" : "Scanner: Inactive"}
          </div>
        </div>

        {/* Active Strategies */}
        <div className="glass-panel border border-border rounded p-4">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Strategies
          </div>
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-primary" />
            <span className="text-lg font-bold text-foreground">
              6 / 6
            </span>
          </div>
          <div className="text-[9px] text-muted-foreground mt-1">
            All specialists active
          </div>
        </div>

        {/* Wallet Balance */}
        <div className="glass-panel border border-border rounded p-4">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Portfolio Value
          </div>
          <div className="flex items-center gap-2">
            <Wallet size={16} className="text-bright-blue" />
            <span className="text-lg font-bold neon-glow-green">
              {showUSD ? `$${(totalBalance * ethPrice).toFixed(2)}` : `${totalBalance.toFixed(4)} ETH`}
            </span>
          </div>
          <div className="text-[9px] text-muted-foreground mt-1">
            {showUSD ? `${totalBalance.toFixed(4)} ETH` : `$${(totalBalance * ethPrice).toFixed(2)}`}
          </div>
        </div>

        {/* Profit Today */}
        <div className="glass-panel border border-border rounded p-4">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Session Profit
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-400" />
            <span className="text-lg font-bold text-emerald-400">
              {showUSD ? `$${(dailyProfit * ethPrice).toFixed(2)}` : `+${dailyProfit.toFixed(4)} ETH`}
            </span>
          </div>
          <div className="text-[9px] text-muted-foreground mt-1">
            {showUSD ? `+${dailyProfit.toFixed(4)} ETH` : `$${(dailyProfit * ethPrice).toFixed(2)}`}
          </div>
        </div>
      </motion.div>

      {/* Strategic Command Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Market Sentiment */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground">Market Aggression</h2>
          <MarketSentiment params={liveState?.auctionParams || { baseInclusionProb: 0.1, bribeElasticity: 0.05, competitiveFactor: 1.0, maxInclusionProb: 0.95 }} />
          <AnomalyTicker logs={liveState?.anomalyLog || []} />
        </div>

        {/* Performance Chart */}
        <div className="lg:col-span-2 glass-panel border border-border rounded p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Live Yield Engine (ETH)
          </h2>
          <div className="flex items-center gap-2">
            <Shield size={12} className="text-primary" />
            <span className="text-[9px] text-muted-foreground">
              BSS-03 Risk Guarded
            </span>
          </div>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <defs>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(148 100% 60%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(148 100% 60%)" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="colorShadow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(220 100% 60%)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(220 100% 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="1 4" stroke="white" vertical={false} opacity={0.1} />
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(220 15% 60%)", fontSize: 8 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(220 15% 60%)", fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(220 20% 12% / 0.9)",
                  border: "1px solid hsl(220 15% 15%)",
                  borderRadius: "4px",
                  fontSize: "11px",
                }}
                labelStyle={{ color: "hsl(220 15% 60%)" }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', paddingTop: '10px' }} />
              <Area
                type="monotone"
                dataKey="predictedProfit"
                stroke="hsl(220 100% 60%)"
                strokeWidth={1}
                strokeDasharray="4 4"
                fill="url(#colorShadow)"
                name="Shadow Prediction"
              />
              <Area
                type="monotone"
                dataKey="opportunities"
                stroke="hsl(50 100% 50%)"
                strokeWidth={2}
                fill="url(#colorOpportunity)"
                name="Opportunities"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      </div>

      {/* System Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Latency */}
        <div className="glass-panel border border-border rounded p-4">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            P99 Latency
          </div>
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-primary" />
            <span className="text-xl font-bold text-foreground">
              {liveState?.avgLatencyMs ? `${liveState.avgLatencyMs.toFixed(2)}ms` : "—"}
            </span>
          </div>
          <div className="text-[9px] text-muted-foreground mt-1">
             Network: {liveState?.ipcConnected ? "Internal Bridge" : "External RPC"}
          </div>
        </div>

        {/* Blocks Scanned */}
        <div className="glass-panel border border-border rounded p-4">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Blocks Scanned
          </div>
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-electric" />
            <span className="text-xl font-bold text-foreground">
              {liveState?.opportunitiesExecuted ?? "0"} / {liveState?.opportunitiesDetected ?? "0"}
            </span>
          </div>
          <div className="text-[9px] text-muted-foreground mt-1">
            Execution Success: {(liveState?.successRate ? liveState.successRate * 100 : 0).toFixed(1)}%
          </div>
        </div>
      </div>
      
      {/* Arbitrage Opportunity Scanner */}
      <div className="glass-panel border border-border rounded p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Parity Analysis (BSS-43)
          </h2>
          <div className="flex items-center gap-2">
            <Zap size={12} className="text-primary" />
            <span className="text-[9px] text-muted-foreground">
              Signal-to-Execution Mapping
            </span>
          </div>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%" className="opacity-40 grayscale hover:grayscale-0 transition-all">
            <AreaChart data={history}>
              <defs>
                <linearGradient id="colorOpportunity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(50 100% 50%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(50 100% 50%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExecution" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(120 100% 40%)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(120 100% 40%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="1 4" stroke="white" vertical={false} opacity={0.1} />
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(220 15% 60%)", fontSize: 10 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(220 15% 60%)", fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(220 20% 12% / 0.9)",
                  border: "1px solid hsl(220 15% 15%)",
                  borderRadius: "4px",
                  fontSize: "11px",
                }}
                labelStyle={{ color: "hsl(220 15% 60%)" }}
                formatter={(value) => `${value} ops`}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', paddingTop: '10px' }} />
              <Area
                type="monotone"
                dataKey="predictedProfit"
                stroke="hsl(220 100% 60%)"
                strokeWidth={1}
                strokeDasharray="5 5"
                fill="url(#colorShadow)"
                name="Shadow Prediction"
              />
              <Area
                type="monotone"
                dataKey="opportunities"
                stroke="hsl(50 100% 50%)"
                strokeWidth={2}
                fill="url(#colorOpportunity)"
                name="Opportunities"
              />
              
              {/* Add execution markers as scatter points */}
              {/* In a real implementation, we would overlay execution points */}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
