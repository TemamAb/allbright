import React, { useMemo } from "react";
import { AlertTriangle, Lock, Shield, TrendingUp, Unlock, Zap } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEngine } from "@/stores/engine";

export default function Dashboard() {
  const { engine, telemetry, telemetryFeed, isLoading, error, lastUpdate } = useEngine();
  
  const ges = telemetry.ges || 0;
  const episodes = engine?.aiEpisodes || 0;
  const successEma = engine?.winRate ?? 0;
  const momentum = engine?.profitMomentum || telemetryFeed?.sessionProfitEth || 0;
  const hardenedActive = ges > 82.5;
  const currentProfit = engine?.currentDailyProfit ?? telemetryFeed?.sessionProfitUsd ?? 0;
  const riskLabel = engine?.circuitBreakerOpen ? "Guarded" : "Nominal";
  const riskSubLabel = engine?.circuitBreakerOpen
    ? "Circuit breaker engaged"
    : "BSS-31 Guard Armed";

  const chartData = useMemo(
    () =>
      telemetryFeed?.profitHistory?.map((point) => ({
        time: point.time,
        value: point.usd,
      })) ?? [],
    [telemetryFeed?.profitHistory],
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {error && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3 text-amber-400">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest">
              Live telemetry degraded
            </p>
            <p className="text-xs text-amber-300/80 mt-1">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Global Efficiency Header */}
      <div className="bg-ash-black border border-ash-border rounded-xl p-8 flex items-center justify-between shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-accent/5 blur-[100px] -mr-48 -mt-48 group-hover:bg-emerald-accent/10 transition-colors" />
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Global Efficiency</h2>
          <p className="text-[10px] text-ash-muted font-bold mt-1 uppercase tracking-[0.3em]">
            {isLoading ? "Synchronizing..." : `Last Heartbeat: ${lastUpdate.toLocaleTimeString()}`}
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
            {chartData.length === 0 ? (
              <div className="h-full rounded-xl border border-dashed border-ash-border flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-zinc-600">
                Waiting for profit history
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.5} />
                  <XAxis dataKey="time" hide />
                  <YAxis hide domain={["auto", "auto"]} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#111217",
                      border: "1px solid #27272a",
                      borderRadius: "8px",
                      fontSize: "10px",
                    }}
                    itemStyle={{ color: "#10b981" }}
                    cursor={{ stroke: "#27272a", strokeWidth: 1 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: "#10b981", strokeWidth: 2, r: 4, stroke: "#111217" }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
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
              ${currentProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-emerald-accent mt-3 font-bold flex items-center gap-1">
              <Zap size={10} /> {telemetryFeed?.dataMode || "Live dashboard feed"}
            </div>
          </div>

          <div className="bg-ash-black border border-ash-border rounded-xl p-6 hover:border-emerald-accent/50 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <Shield size={16} className="text-emerald-accent" />
              <span className="text-[10px] font-bold text-ash-muted uppercase tracking-widest">Risk Mitigation</span>
            </div>
            <div className="text-4xl font-black text-white">{riskLabel}</div>
            <div className="text-[10px] text-ash-muted/60 mt-3 font-bold uppercase tracking-wider">
              {riskSubLabel}
            </div>
          </div>
        </div>
      </div>

      {/* AI Optimizer Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-ash-black border border-ash-border rounded-xl p-4">
          <div className="text-[10px] uppercase text-ash-muted font-bold tracking-wider mb-1">Learning Episodes</div>
          <div className="bg-black/40 p-3 rounded-lg text-2xl font-mono font-bold text-white border border-ash-border/30">
            {episodes || "--"}
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
            {Number(momentum).toFixed(4)}
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
