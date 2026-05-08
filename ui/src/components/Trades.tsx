import React from 'react';
import { useGetTrades, useGetTradesSummary } from "@/lib/api";
import { BarChart2, ExternalLink, Zap, History, TrendingUp, Clock } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "./ui/badge";

export default function Trades() {
  const { data: tradesRes, isLoading } = useGetTrades({ limit: 50 });
  const { data: summary } = useGetTradesSummary();
  const trades = tradesRes?.trades ?? [];

  return (
    <div className="h-full space-y-8 p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header section with stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">Execution Ledger</h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] mt-3">Comprehensive Audit Trail</p>
        </div>
        
        <div className="flex gap-6 bg-ash-black border border-ash-border p-6 rounded-2xl shadow-xl">
          <div className="text-right border-r border-ash-border/50 pr-6">
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Success Rate</p>
            <div className="text-2xl font-black text-emerald-accent font-mono">
              {summary?.successRate ? (summary.successRate * 100).toFixed(1) : "0.0"}%
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Avg Latency</p>
            <div className="text-2xl font-black text-white font-mono tabular-nums">
              {summary?.avgLatencyMs ? summary.avgLatencyMs.toFixed(0) : "0"}<span className="text-xs text-zinc-600 ml-1">MS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-ash-black border border-ash-border rounded-2xl overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-accent/30 via-emerald-accent/30 to-transparent" />
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] text-[10px] text-zinc-500 font-black uppercase tracking-widest border-b border-ash-border/50">
                <th className="px-6 py-5">Time</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Route Configuration</th>
                <th className="px-6 py-5 text-right">Net Yield</th>
                <th className="px-6 py-5 text-right">Bribe/Gas</th>
                <th className="px-6 py-5 text-right">Latency</th>
                <th className="px-6 py-5 text-center">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ash-border/20">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <History size={32} className="text-zinc-800 animate-spin" />
                      <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">Decrypting Secure Ledger...</span>
                    </div>
                  </td>
                </tr>
              ) : trades.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-32 text-center flex flex-col items-center gap-4">
                    <Zap size={32} className="text-zinc-800" />
                    <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">No execution records found in buffer</span>
                  </td>
                </tr>
              ) : trades.map((trade: any) => (
                <tr key={trade.id} className="hover:bg-white/[0.01] transition-colors group">
                  <td className="px-6 py-4 font-mono text-[10px] text-zinc-500">
                    <div className="flex items-center gap-2">
                      <Clock size={12} className="text-zinc-700" />
                      {trade.timestamp ? format(new Date(trade.timestamp), "HH:mm:ss") : "--:--:--"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={`${
                      trade.status === 'EXECUTED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                    } text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-widest`}>
                      {trade.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs font-black text-white uppercase tracking-tighter italic">
                      {trade.tokenIn} 
                      <TrendingUp size={12} className="text-zinc-700" />
                      {trade.tokenOut}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-sm text-emerald-accent font-black tabular-nums">
                    +{parseFloat(trade.profit).toFixed(5)} <span className="text-[10px] opacity-40">ETH</span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-xs text-zinc-500 tabular-nums">
                    {parseFloat(trade.bribePaid).toFixed(5)}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-xs text-cyan-accent/80 tabular-nums font-bold">
                    {trade.latencyMs}<span className="text-[9px] ml-0.5 opacity-40">MS</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <a 
                      href={`https://etherscan.io/tx/${trade.txHash}`} 
                      target="_blank" 
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-ash-border/50 text-zinc-600 hover:text-white hover:border-white/20 transition-all"
                    >
                      <ExternalLink size={14} />
                    </a>
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
