import React, { useState } from "react";
import { useTelemetry } from "@/hooks/useTelemetry";
import { THIRTY_SIX_KPIS } from "@/constants/kpi";
import type { KPI } from "@/types/kpi";
import { ChevronDown, ChevronUp, Zap, TrendingUp, Shield, Cpu, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const { kpis, isLive } = useTelemetry();

  return (
    <div className="h-full space-y-6 animate-in fade-in duration-500">
      {/* Status Header */}
      <div className="bg-black border border-zinc-800 rounded-xl p-8 flex items-center justify-between shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[80px] -mr-32 -mt-32" />
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Global Efficiency</h2>
          <p className="text-[10px] text-zinc-500 font-bold mt-1 uppercase tracking-[0.3em]">Last Heartbeat: {new Date().toLocaleTimeString()}</p>
        </div>
        <div className="text-7xl font-black text-emerald-500 tabular-nums tracking-tighter">
          {(kpis.ges || 85.4).toFixed(1)}%
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts Panel */}
        <div className="lg:col-span-2 bg-black border border-zinc-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Real-time Alpha Capture</h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-emerald-500">LIVE FEED</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={[{time: '00:00', value: 0.1}, {time: '04:00', value: 0.4}, {time: '08:00', value: 0.3}, {time: '12:00', value: 0.8}]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
              <XAxis dataKey="time" hide />
              <YAxis hide domain={['auto', 'auto']} />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: '#000', border: '1px solid #27272a', fontSize: '10px' }}
                itemStyle={{ color: '#10b981' }}
              />
              <Line type="stepAfter" dataKey="value" stroke="#10b981" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Secondary Metrics */}
        <div className="space-y-6">
          <div className="bg-black border border-zinc-800 rounded-xl p-6 hover:border-cyan-500/50 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp size={16} className="text-cyan-500" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">24H Net Yield</span>
            </div>
            <div className="text-3xl font-black text-white">$1,247.82</div>
            <div className="text-[10px] text-emerald-500 mt-2 font-bold">+12.4% vs Baseline</div>
          </div>
          <div className="bg-black border border-zinc-800 rounded-xl p-6 hover:border-cyan-500/50 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <Shield size={16} className="text-emerald-500" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Risk Mitigation</span>
            </div>
            <div className="text-3xl font-black text-white">Nominal</div>
            <div className="text-[10px] text-zinc-600 mt-2 font-bold uppercase">BSS-31 Guard Armed</div>
          </div>
        </div>
      </div>

      {/* 36 KPI Table View */}
      <div className="bg-black border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-zinc-800 bg-[#1a1c20]/50">
          <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Operational Telemetry (36-KPI)</h2>
        </div>
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#000000]">
              <tr className="text-[10px] text-zinc-500 uppercase tracking-widest border-b border-zinc-800">
                <th className="px-6 py-4 font-medium">Metric Category</th>
                <th className="px-6 py-4 font-medium text-center">Observed</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium text-right">Trend</th>
              </tr>
            </thead>
            <tbody>
              {THIRTY_SIX_KPIS.slice(0, 8).map((cat) => (
                <tr key={cat.id} className="border-b border-zinc-900/50 hover:bg-zinc-900/30 transition-colors">
                  <td className="px-6 py-4 text-xs font-bold text-zinc-200">{cat.label}</td>
                  <td className="px-6 py-4 text-center font-mono text-xs text-cyan-400">92.4%</td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase">Nominal</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <ChevronUp size={12} className="inline text-emerald-500" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
