import React from 'react';
import { useGetTrades, useGetTradesSummary } from "@/lib/api";
import { BarChart2, ExternalLink, Zap } from "lucide-react";
import { Be } from "@/lib/utils";
import { format } from "date-fns";

export default function Trades() {
  const { data: tradesRes, isLoading } = useGetTrades({ limit: 50 });
  const { data: summary } = useGetTradesSummary();
  const trades = tradesRes?.trades ?? [];

  return (
    <div className="h-full space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-lg font-black uppercase tracking-widest flex items-center gap-2">
            <BarChart2 size={18} className="text-cyan-500" />
            Execution Ledger
          </h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Audit trail for all cross-chain arbitrage vectors</p>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <div className="text-[10px] text-zinc-500 font-bold uppercase">Success Rate</div>
            <div className="text-lg font-black text-emerald-500 
          <div className="text-right">
            <div className="text-[10px] text-zinc-500 font-bold uppercase">Avg Latency</div>
            <div className="text-lg font-black text-white font-mono tabular-nums">{(su
        </div>
      </div>

      <div className="bg-black border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#111217]">
              <tr className="text-[10px] text-zinc-500 uppercase tracking-widest border-b border-zinc-800">
                <th className="px-6 py-4 font-bold">Timestamp</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Route</th>
                <th className="px-6 py-4 font-bold text-right">Net Profit</th>
                <th className="px-6 py-4 font-bold text-right">Bribe</th>
                <th className="px-6 py-4 font-bold text-right">Latency</th>
                <th className="px-6 py-4 font-bold text-center">Tx</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/50">
              {isLoading ? (
                <tr><td colSpan={7} className="p-20 text-center text-zinc-600 animate-pulse text-xs uppercase font-bold">Decrypting Ledger...</td></tr>
              ) : trades.map((trade: any) => (
                <tr key={trade.id} className="hover:bg-zinc-900/30 transition-colors group">
                  <td className="px-6 py-3 text-xs font-mono text-zinc-400">
                    {trade.timestamp ? format(new Date(trade.timestamp), "HH:mm:ss") : "--:--:--"}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                      trade.status === 'EXECUTED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-800 text-zinc-500'
                    }`}>
                      {trade.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-xs font-bold text-zinc-200">
                    {trade.tokenIn} <span className="text-zinc-600">→</span> {trade.tokenOut}
                  </td>
                  <td className="px-6 py-3 text-right font-mono text-xs text-emerald-400 font-bold tabular-nums">
                    +{parseFloat(trade.profit).toFixed(5)} ETH
                  </td>
                  <td className="px-6 py-3 text-right font-mono text-xs text-zinc-500 tabular-nums">
                    {parseFloat(trade.bribePaid).toFixed(5)}
                  </td>
                  <td className="px-6 py-3 text-right font-mono text-xs text-cyan-400 tabular-nums">
                    {trade.latencyMs}ms
                  </td>
                  <td className="px-6 py-3 text-center">
                    <a href={`https://etherscan.io/tx/${trade.txHash}`} target="_blank" className="text-zinc-600 hover:text-white transition-colors">
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