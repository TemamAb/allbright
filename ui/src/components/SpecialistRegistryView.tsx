import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface SpecialistRegistryViewProps {
  registry: any[];
}

/**
 * SpecialistRegistryView: Modularized AI agent health monitoring.
 * Provides visibility into consecutive failures and automated remediation status.
 */
export const SpecialistRegistryView: React.FC<SpecialistRegistryViewProps> = ({ registry }) => {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="rounded-lg border border-ash-border overflow-hidden bg-ash-black/20 shadow-inner">
        <table className="w-full text-left border-collapse">
          <thead className="bg-ash-black text-[9px] uppercase text-ash-muted font-black tracking-widest border-b border-ash-border">
            <tr>
              <th className="px-4 py-3">Agent</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Intensity (100b)</th>
              <th className="px-4 py-3 text-center">Misses</th>
              <th className="px-4 py-3 text-right">Last Tuning</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ash-border/30 text-[11px]">
            {registry?.map((agent: any) => (
              <tr key={agent.id} className="hover:bg-ash-black/40 transition-colors group">
                <td className="px-4 py-3 font-bold text-white group-hover:text-cyan-accent transition-colors">{agent.name}</td>
                <td className="px-4 py-3 text-ash-muted font-mono text-[10px] uppercase">{agent.category}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded font-black text-[9px] tracking-tighter ${
                    agent.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' : 
                    agent.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                    {agent.status}
                  </span>
                </td>
                        <td className="px-4 py-3 text-center">
                          <div className="h-6 w-16 mx-auto opacity-70 group-hover:opacity-100 transition-opacity">
                            <ResponsiveContainer width="100%" height="100%" debounce={1}>
                              <LineChart data={agent.decisionHistory?.map((v: number) => ({v})) || Array.from({length: 12}, () => ({v: 0.5}))}>
                                <Line 
                                  type="monotone" 
                                  dataKey="v" 
                                  stroke={agent.status === 'ACTIVE' ? '#10b981' : '#71717a'} 
                                  strokeWidth={2} 
                                  dot={false} 
                                  isAnimationActive={false}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </td>
                <td className="px-4 py-3 text-center font-mono text-zinc-500">
                  {agent.consecutiveMisses || 0}
                </td>
                <td className="px-4 py-3 text-right font-mono text-ash-muted tabular-nums">
                  {agent.lastTuningMs > 0 ? new Date(agent.lastTuningMs).toLocaleTimeString() : 'AWAITING_CYCLE'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[9px] text-ash-muted italic">* Automated remediation active: Agents failing {'>'}3 cycles are re-initialized.</p>
    </div>
  );
};