import React from 'react';
import { BarChart3, ExternalLink, Zap } from "lucide-react";
import { useGetTrades, useGetTradesSummary } from '../lib/api';

export default function TradesView() {
  const { data: tradesRes, isLoading } = useGetTrades(50);
  const { data: summary } = useGetTradesSummary();
  const trades = tradesRes?.trades ?? [];
  const successRate = summary?.successRate || 0;
  const avgLatencyMs = summary?.avgLatencyMs || 0;

  return (
    <div className="space-y-6 fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black italic uppercase text-white">Execution Ledger</h2>
          <p className="text-[10px] text-secondary uppercase tracking-[0.2em] font-bold mt-1">
            Audit trail for all cross-chain arbitrage vectors
          </p>
        </div>
        <div className="flex gap-4">
          <div className="card-ash px-4 py-2 rounded-lg text-right">
            <div className="text-[8px] text-secondary font-black uppercase">Success Rate</div>
            <div className="text-lg font-black text-emerald-500 font-mono">
              {successRate.toFixed(1)}%
            </div>
          </div>
          <div className="card-ash px-4 py-2 rounded-lg text-right">
            <div className="text-[8px] text-secondary font-black uppercase">Avg Latency</div>
            <div className="text-lg font-black text-white font-mono">
              {avgLatencyMs}ms
            </div>
          </div>
        </div>
      </div>

      <div className="card-ash overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr>
                <th className="px-4 py-3">TIMESTAMP</th>
                <th className="px-4 py-3">STATUS</th>
                <th className="px-4 py-3">ROUTE</th>
                <th className="px-4 py-3 text-right">NET PROFIT</th>
                <th className="px-4 py-3 text-right">BRIBE</th>
                <th className="px-4 py-3 text-right">LATENCY</th>
                <th className="px-4 py-3 text-center">TX</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-20 text-center text-secondary animate-pulse font-bold uppercase tracking-widest">
                    Decrypting Ledger...
                  </td>
                </tr>
              ) : (
                trades.map((trade: any) => (
                  <tr key={trade.id} className="border-b border-ash group">
                    <td className="px-4 py-3 font-mono text-secondary">
                      {trade.timestamp ? new Date(trade.timestamp).toLocaleTimeString() : "--:--:--"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                        trade.status === 'EXECUTED' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-zinc-800 text-secondary'
                      }`}>
                        {trade.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-white uppercase">
                      {trade.tokenIn} <span className="text-zinc-600">→</span> {trade.tokenOut}
                    </td>
                    <td className="px-4 py-3 bg-data-black text-right font-mono text-emerald-400 font-bold">
                      +{parseFloat(trade.profit).toFixed(5)} ETH
                    </td>
                    <td className="px-4 py-3 bg-data-black text-right font-mono text-secondary">
                      {parseFloat(trade.bribePaid).toFixed(5)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-cyan-400 font-bold">
                      {trade.latencyMs}ms
                    </td>
                    <td className="px-4 py-3 text-center">
                      {trade.txHash ? (
                        <a href={`https://etherscan.io/tx/${trade.txHash}`} target="_blank" className="text-zinc-600 hover:text-white transition-colors">
                          <ExternalLink size={14} />
                        </a>
                      ) : (
                        <span className="text-zinc-800">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}