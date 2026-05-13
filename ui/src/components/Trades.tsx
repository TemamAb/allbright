import React from 'react';
import { useGetTrades, useGetTradesSummary } from "@/lib/api";
import { ExternalLink, Zap, History, TrendingUp, Clock, Download } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "./ui/badge";
import { useToast } from "@/hooks/useToast";

export default function Trades() {
  const { data: tradesRes, isLoading, error } = useGetTrades({ limit: 50 });
  const { data: summary } = useGetTradesSummary();
  const trades = tradesRes?.trades ?? [];
  const { addToast } = useToast();

  const handleExportCSV = () => {
    if (trades.length === 0) {
      addToast('No trades to export', 'warning');
      return;
    }

    const headers = ['Time', 'Status', 'Token In', 'Token Out', 'Profit (ETH)', 'Bribe Paid', 'Latency (ms)', 'Tx Hash'];
    const rows = trades.map(trade => [
      trade.timestamp ? format(new Date(trade.timestamp), "yyyy-MM-dd HH:mm:ss") : '',
      trade.status || '',
      trade.tokenIn || '',
      trade.tokenOut || '',
      trade.profit || '0',
      trade.bribePaid || '0',
      trade.latencyMs || '0',
      trade.txHash || ''
    ]);
    const csv = [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `allbright-trades-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Trades exported successfully', 'success');
  };

  return (
    <div className="h-full space-y-8 p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header section with stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">Execution Ledger</h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] mt-3">Comprehensive Audit Trail</p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-ash-dark hover:bg-ash-dark/80 border border-ash-border rounded-lg text-sm font-medium text-cyan-accent hover:text-white transition-colors"
            title="Export trades to CSV"
          >
            <Download size={16} />
            Export CSV
          </button>

          <div className="flex gap-6 bg-ash-black border border-ash-border p-6 rounded-2xl shadow-xl">
          <div className="text-right border-r border-ash-border/50 pr-6">
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Success Rate</p>
            <div className="text-2xl font-black text-emerald-accent font-mono">
              {summary?.successRate ? summary.successRate.toFixed(1) : "0.0"}%
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Avg Profit</p>
            <div className="text-2xl font-black text-white font-mono tabular-nums">
              {summary?.avgProfitPerTrade ? summary.avgProfitPerTrade.toFixed(4) : "0.0000"}<span className="text-xs text-zinc-600 ml-1">ETH AVG</span>
            </div>
          </div>
        </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-xs font-bold text-red-400 uppercase tracking-widest">
          Execution ledger unavailable
        </div>
      )}

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
                  {String(trade.status).toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs font-black text-white uppercase tracking-tighter italic">
                      {trade.tokenIn || trade.protocol || "UNKNOWN"} 
                      <TrendingUp size={12} className="text-zinc-700" />
                      {trade.tokenOut || "UNKNOWN"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-sm text-emerald-accent font-black tabular-nums">
                    {parseFloat(trade.profit || "0").toFixed(5)} <span className="text-[10px] opacity-40">ETH</span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-xs text-zinc-500 tabular-nums">
                    {parseFloat(trade.bribePaid || "0").toFixed(5)}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-xs text-cyan-accent/80 tabular-nums font-bold">
                    {trade.latencyMs ?? 0}<span className="text-[9px] ml-0.5 opacity-40">MS</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <a 
                      href={trade.txHash ? `https://etherscan.io/tx/${trade.txHash}` : "#"}
                      target="_blank" 
                      rel="noreferrer"
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
