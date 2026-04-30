import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search, RefreshCw } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTelemetry } from '../hooks/useTelemetry';
import { THIRTY_SIX_KPIS } from '../types/kpi';
import type { KPI } from '../types/kpi';

type CategoryType = typeof THIRTY_SIX_KPIS[number];

const Telemetry: React.FC = () => {
  const { kpis, isLive } = useTelemetry();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['profitability']));
  const [searchTerm, setSearchTerm] = useState('');

  const toggleCategory = (id: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCategories(newExpanded);
  };

  const getStatusColor = (status: KPI['status']) => ({
    good: 'bg-grafana-green text-grafana-bg',
    warn: 'bg-grafana-yellow text-grafana-bg',
    bad: 'bg-grafana-red text-grafana-bg',
    default: 'bg-grafana-ash text-grafana-text',
  }[status] || 'bg-grafana-ash text-grafana-text');

  const calculateVariance = (value: KPI['value'], target: KPI['target']) => {
    const v = typeof value === 'number' ? value : 0;
    const t = typeof target === 'number' ? target : 1;
    if (t === 0) return 'N/A';
    const variance = ((v - t) / t * 100);
    return variance.toFixed(1) + '%';
  };

  const filteredKpis = THIRTY_SIX_KPIS.filter((cat) => cat.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.kpis.some(kpi => kpi.name.toLowerCase().includes(searchTerm.toLowerCase())));

  const getCategorySummary = (cat: CategoryType) => {
    const catKpis = (kpis.categories[cat.id as keyof typeof kpis.categories] as KPI[] || cat.kpis);
    const avgScore = catKpis.reduce((sum, kpi) => {
      const v = typeof kpi.value === 'number' ? kpi.value : 0;
      const t = typeof kpi.target === 'number' ? kpi.target : 1;
      const score = t === 0 ? 50 : Math.max(0, 100 - Math.abs((v - t) / t * 100));
      return sum + score;
    }, 0) / catKpis.length;
    return avgScore.toFixed(1);
  };

  const getCatStatus = (summaryStr: string) => {
    const summary = parseFloat(summaryStr);
    return summary > 90 ? 'good' : summary > 75 ? 'warn' : 'bad';
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      {/* Global Efficiency Score */}
      <div className="bg-[#1a1a1c] border border-zinc-800 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between shadow-2xl shrink-0">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-slate-100">Global Efficiency Score</h1>
          <p className="text-xs text-zinc-500 font-mono mt-1">Last Update: {kpis.timestamp?.toLocaleString() || 'N/A'}</p>
        </div>
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <div className={`px-3 py-1 rounded border text-xs font-bold font-mono tracking-widest uppercase ${isLive ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}>
            {isLive ? '● LIVE' : '● OFFLINE'}
          </div>
          <div className="text-4xl font-black text-green-400 font-mono">{(kpis.ges || 0).toFixed(1)}%</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4 items-center shrink-0">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 text-zinc-500 transform -translate-y-1/2 pointer-events-none" />
          <Input
            placeholder="Search KPIs..."
            className="pl-10 pr-4 h-10 border-zinc-800 bg-[#1a1a1c] text-zinc-200 placeholder-zinc-500 focus:border-primary/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm" className="border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Telemetry Grid */}
      <div className="flex-1 bg-[#1a1a1c] border border-zinc-800 rounded-xl overflow-hidden flex flex-col shadow-2xl">
        <div className="px-6 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider font-mono">36 KPI Telemetry Grid</h2>
        </div>
        <div className="flex-1 bg-black overflow-y-auto p-4">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-black z-10">
              <tr className="border-b border-zinc-800 text-zinc-500">
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest font-medium w-[300px]">Category</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest font-medium">Score</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest font-medium text-center">Count</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest font-medium">Status</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              {filteredKpis.map((cat) => {
                const isExpanded = expandedCategories.has(cat.id);
                const summary = getCategorySummary(cat);
                const catStatus = getCatStatus(summary);
                const liveKpis = (kpis.categories[cat.id as keyof typeof kpis.categories] as KPI[] || cat.kpis);

                return (
                  <React.Fragment key={cat.id}>
                    <tr 
                      className="cursor-pointer border-b border-zinc-900 hover:bg-zinc-900/50 transition-colors"
                      onClick={() => toggleCategory(cat.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className={`w-5 h-5 rounded flex items-center justify-center text-xs ${catStatus === 'good' ? 'bg-green-500/20 text-green-400' : catStatus === 'warn' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </span>
                          <span className="font-bold text-xs uppercase tracking-wider text-zinc-200">{cat.label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-mono text-sm font-bold ${catStatus === 'good' ? 'text-green-400' : catStatus === 'warn' ? 'text-yellow-400' : 'text-red-400'}`}>
                          {summary}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-xs font-mono text-zinc-500">{liveKpis.length}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${catStatus === 'good' ? 'bg-green-500/10 text-green-400' : catStatus === 'warn' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>
                          {catStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-[10px] uppercase font-bold text-zinc-500 hover:text-primary transition-colors">
                          {isExpanded ? 'Collapse' : 'Expand'}
                        </span>
                      </td>
                    </tr>
                    {isExpanded && liveKpis.map((kpi, idx) => (
                      <tr key={`${cat.id}-${idx}`} className="bg-zinc-900/20 border-b border-zinc-900/50">
                        <td className="px-4 py-2 pl-12 text-xs text-zinc-400 font-mono">{kpi.name}</td>
                        <td className="px-4 py-2 text-xs font-mono text-zinc-300">
                          {typeof kpi.value === 'number' ? kpi.value.toFixed(2) : kpi.value} <span className="text-zinc-600">{kpi.unit}</span>
                        </td>
                        <td className="px-4 py-2 text-xs font-mono text-zinc-500">
                          Target: {typeof kpi.target === 'number' ? kpi.target.toFixed(2) : kpi.target}
                        </td>
                        <td className="px-4 py-2 text-xs font-mono">
                          <span className={kpi.status === 'good' ? 'text-green-400' : kpi.status === 'warn' ? 'text-yellow-400' : 'text-red-400'}>
                            {calculateVariance(kpi.value, kpi.target)}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${kpi.status === 'good' ? 'bg-green-500/10 text-green-400' : kpi.status === 'warn' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>
                            {kpi.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Telemetry;
