import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search, RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEngine } from '@/stores/engine';
import { FORTY_FOUR_KPIS } from '@/constants/kpi';
import type { KPI } from '@/types/kpi';

const KpiMatrix: React.FC = () => {
  const { telemetry, isLive, isLoading, error, refresh, lastUpdate } = useEngine();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['efficiency', 'performance']));
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

  const getKpiStatus = (kpi: KPI): 'good' | 'warn' | 'bad' => {
    const observed = typeof kpi.value === 'number' ? kpi.value : parseFloat(String(kpi.value));
    const target = typeof kpi.designTarget === 'number' ? kpi.designTarget : parseFloat(String(kpi.designTarget));

    if (isNaN(observed) || isNaN(target)) {
      if (kpi.comparison === 'positive_trajectory' && String(kpi.value).includes('Positive')) return 'good';
      if (kpi.comparison === 'active' && String(kpi.value).includes('Active')) return 'good';
      if (kpi.comparison === 'nominal' && String(kpi.value).includes('Nominal')) return 'good';
      return 'warn';
    }

    switch (kpi.comparison) {
      case 'gt': return observed > target ? 'good' : observed >= target * 0.9 ? 'warn' : 'bad';
      case 'lt': return observed < target ? 'good' : observed <= target * 1.1 ? 'warn' : 'bad';
      case 'eq': return observed === target ? 'good' : observed >= target * 0.9 && observed <= target * 1.1 ? 'warn' : 'bad';
      default: return 'warn';
    }
  };

  const getStatusClasses = (status: 'good' | 'warn' | 'bad') => {
    switch (status) {
      case 'good': return 'bg-emerald-500/10 text-emerald-400';
      case 'warn': return 'bg-amber-500/10 text-amber-400';
      case 'bad': return 'bg-red-500/10 text-red-400';
      default: return 'bg-zinc-800 text-zinc-500';
    }
  };

  const calculateVariance = (kpi: KPI) => {
    const observed = typeof kpi.value === 'number' ? kpi.value : parseFloat(String(kpi.value));
    const target = typeof kpi.designTarget === 'number' ? kpi.designTarget : parseFloat(String(kpi.designTarget));

    if (isNaN(observed) || isNaN(target) || target === 0) {
      return 'N/A';
    }

    const variance = ((observed - target) / target) * 100;
    const prefix = variance >= 0 ? '+' : '';
    return `${prefix}${variance.toFixed(1)}%`;
  };

  const filteredCategories = FORTY_FOUR_KPIS.filter((cat) => 
    cat.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.kpis.some(kpi => kpi.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="h-full flex flex-col p-6 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-ash-black border border-ash-border rounded-xl p-6 flex flex-col md:flex-row items-center justify-between shadow-2xl shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-accent/10 p-3 rounded-xl border border-emerald-accent/20">
            <ShieldCheck className="text-emerald-accent" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-widest text-white leading-none">Institutional KPI Matrix</h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-2">
              Last Heartbeat: {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">Global Efficiency</p>
            <div className="text-4xl font-black text-emerald-accent font-mono tabular-nums">
              {(telemetry.ges || 0).toFixed(1)}%
            </div>
          </div>
          <div className={`px-4 py-2 rounded-lg border text-[10px] font-black tracking-widest uppercase flex items-center gap-2 ${isLive ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}>
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
            {isLive ? 'LIVE' : 'OFFLINE'}
          </div>
        </div>
      </div>

      {/* Search & Refresh */}
      <div className="flex gap-4 items-center shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 text-zinc-500 transform -translate-y-1/2 pointer-events-none" />
          <Input
            placeholder="Filter matrix by KPI name or category..."
            className="pl-10 pr-4 h-12 border-ash-border bg-ash-black text-zinc-200 placeholder-zinc-500 focus:border-cyan-accent/50 rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button 
          variant="outline" 
          className="h-12 border-ash-border bg-ash-black hover:bg-zinc-800 text-zinc-300 hover:text-white px-6 rounded-xl transition-all"
          onClick={() => refresh()}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${!isLive ? 'animate-spin' : ''}`} />
          Force Sync
        </Button>
      </div>

      {error && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-xs font-bold text-amber-400 uppercase tracking-widest">
          KPI matrix is operating with partial telemetry
        </div>
      )}

      {/* Main Matrix */}
      <div className="flex-1 bg-ash-black border border-ash-border rounded-xl overflow-hidden flex flex-col shadow-2xl">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-ash-black z-20 border-b border-ash-border shadow-sm">
              <tr className="text-zinc-500">
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black">Metric Category</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black">Design Target</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black">Current Value</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black">Delta</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-zinc-600 text-[10px] font-black uppercase tracking-widest">
                    Synchronizing institutional matrix...
                  </td>
                </tr>
              ) : filteredCategories.map((cat) => {
                const isExpanded = expandedCategories.has(cat.id);
                const liveKpis = telemetry.categories[cat.id] || cat.kpis;
                
                return (
                  <React.Fragment key={cat.id}>
                    <tr 
                      className="cursor-pointer border-b border-ash-border/30 hover:bg-white/[0.02] transition-colors group"
                      onClick={() => toggleCategory(cat.id)}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${isExpanded ? 'bg-cyan-accent/10 text-cyan-accent' : 'bg-zinc-800 text-zinc-500 group-hover:text-zinc-300'}`}>
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </div>
                          <span className="font-black text-sm text-white uppercase tracking-tighter">{cat.label}</span>
                          <span className="text-[10px] text-zinc-600 font-bold ml-2">({liveKpis.length} KPIs)</span>
                        </div>
                      </td>
                      <td colSpan={3} className="px-6 py-5">
                        <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-accent/40 rounded-full transition-all duration-1000"
                            style={{ width: `${Math.random() * 20 + 75}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-widest">
                          NOMINAL
                        </span>
                      </td>
                    </tr>
                    
                    {isExpanded && liveKpis.map((kpi, idx) => {
                      const status = getKpiStatus(kpi);
                      const variance = calculateVariance(kpi);
                      const isPositive = variance.startsWith('+');

                      return (
                        <tr key={`${cat.id}-${idx}`} className="bg-black/40 border-b border-ash-border/10 group/row hover:bg-black/60 transition-colors">
                          <td className="px-6 py-4 pl-16">
                            <span className="text-xs font-medium text-zinc-400 group-hover/row:text-zinc-200 transition-colors uppercase tracking-tight">{kpi.name}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-mono text-zinc-500 tabular-nums">
                              {kpi.designTarget} <span className="text-[10px] opacity-40">{kpi.unit}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-mono text-white font-bold tabular-nums">
                              {kpi.value} <span className="text-[10px] text-zinc-600">{kpi.unit}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-xs font-mono font-black ${isPositive ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {variance}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-widest ${getStatusClasses(status)} border-current/20`}>
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
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

export default KpiMatrix;
