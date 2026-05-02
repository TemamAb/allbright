import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTelemetry } from '../hooks/useTelemetry';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { THIRTY_SIX_KPIS } from '@/constants/kpi';
import type { KPI, KPICategory } from '@/types/kpi';

type CategoryType = typeof THIRTY_SIX_KPIS[number];

const Telemetry: React.FC = () => {
  const [refetchInterval, setRefetchInterval] = useState(5000); // Default to 5 seconds
  const { kpis, isLive, refetch } = useTelemetry({ query: { refetchInterval } });
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

  const getKpiStatus = (kpi: KPI): 'good' | 'warn' | 'bad' => {
    const observed = typeof kpi.value === 'number' ? kpi.value : parseFloat(String(kpi.value));
    const target = typeof kpi.designTarget === 'number' ? kpi.designTarget : parseFloat(String(kpi.designTarget));

    if (isNaN(observed) || isNaN(target)) {
      if (kpi.comparison === 'positive_trajectory' && String(kpi.value).includes('Positive')) return 'good';
      if (kpi.comparison === 'active' && String(kpi.value).includes('Active')) return 'good';
      if (kpi.comparison === 'nominal' && String(kpi.value).includes('Nominal')) return 'good';
      return 'warn'; // Cannot compare, or special string status not met
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
      if (kpi.comparison === 'positive_trajectory' || kpi.comparison === 'active' || kpi.comparison === 'nominal') {
        return String(kpi.value);
      }
      return 'N/A';
    }

    const variance = ((observed - target) / target) * 100;
    const prefix = variance >= 0 ? '+' : '';
    return `${prefix}${variance.toFixed(1)}%`;
  };

  const filteredKpis = THIRTY_SIX_KPIS.filter((cat) => cat.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.kpis.some(kpi => kpi.name.toLowerCase().includes(searchTerm.toLowerCase())));

  const getCategorySummary = (cat: CategoryType) => {
    const liveKpis = kpis.categories[cat.id] || [];
    if (liveKpis.length === 0) return 'N/A';

    let totalScore = 0;
    let kpiCount = 0;

    for (const kpi of liveKpis) {
      const status = getKpiStatus(kpi);
      if (status === 'good') totalScore += 100;
      else if (status === 'warn') totalScore += 75;
      else totalScore += 0; // 'bad'
      kpiCount++;
    }

    return kpiCount > 0 ? (totalScore / kpiCount).toFixed(1) : 'N/A';
  };

  const getCatStatus = (summaryStr: string) => {
    const summary = parseFloat(summaryStr);
    return summary > 90 ? 'good' : summary > 75 ? 'warn' : 'bad';
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-6 animate-in fade-in duration-500">
      {/* Global Efficiency Score */}
      <div className="bg-[#1a1a1c] border border-zinc-800 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between shadow-2xl shrink-0">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-slate-100">Global Efficiency Score</h1>
          <p className="text-xs text-zinc-500 font-mono tabular-nums mt-1">Last Update: {kpis.timestamp?.toLocaleString() || 'N/A'}</p>
        </div>
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <div className={`px-3 py-1 rounded border text-xs font-bold font-mono tracking-widest uppercase ${isLive ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}>
            {isLive ? '● LIVE' : '● OFFLINE'}
          </div>
          <div className="text-4xl font-black text-emerald-400 font-mono tabular-nums">{(kpis.ges || 0).toFixed(1)}%</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4 items-center shrink-0">
        <Select value={String(refetchInterval)} onValueChange={(value) => setRefetchInterval(Number(value))}>
          <SelectTrigger className="w-[180px] border-zinc-800 bg-[#1a1a1c] text-zinc-200">
            <SelectValue placeholder="Refresh Interval" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1c] border-zinc-800 text-zinc-200">
            <SelectItem value="2000">2 Seconds</SelectItem>
            <SelectItem value="5000">5 Seconds</SelectItem>
            <SelectItem value="10000">10 Seconds</SelectItem>
            <SelectItem value="30000">30 Seconds</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 text-zinc-500 transform -translate-y-1/2 pointer-events-none" />
          <Input
            placeholder="Search KPIs..."
            className="pl-10 pr-4 h-10 border-zinc-800 bg-[#1a1a1c] text-zinc-200 placeholder-zinc-500 focus:border-primary/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm" className="border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Telemetry Grid */}
      <div className="flex-1 bg-black border border-zinc-800 rounded-xl overflow-hidden flex flex-col shadow-2xl">
        <div className="px-6 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider font-mono">36 KPI Telemetry Grid</h2>
        </div>
        <div className="flex-1 bg-black overflow-y-auto p-4">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-black z-10">
              <tr className="border-b border-zinc-800 text-zinc-500">
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest font-medium w-[250px]">Category / KPI</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest font-medium font-mono">Observed</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest font-medium font-mono">Target</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest font-medium text-center">Count</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest font-medium">Status</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              {filteredKpis.map((cat) => {
                const isExpanded = expandedCategories.has(cat.id);
                const categorySummaryScore = getCategorySummary(cat);
                const categoryStatus = getCatStatus(categorySummaryScore);
                const liveKpis = kpis.categories[cat.id] || [];

                return (
                  <React.Fragment key={cat.id}>
                    <tr 
                      className="cursor-pointer border-b border-zinc-900 hover:bg-zinc-900/50 transition-colors"
                      onClick={() => toggleCategory(cat.id)}
                    >
                      <td className="px-4 py-3 font-bold text-xs text-zinc-200 uppercase">
                        <div className="flex items-center gap-3">
                          <span className={`w-5 h-5 rounded flex items-center justify-center text-xs ${getStatusClasses(categoryStatus)}`}>
                            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </span>
                          {cat.label}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm font-bold tabular-nums">
                        <span className={getStatusClasses(categoryStatus)}>
                          {categorySummaryScore}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-xs font-mono text-zinc-500">N/A</td> {/* Target for category is not directly displayed */}
                      <td className="px-4 py-3 text-center text-xs font-mono text-zinc-500">{cat.kpis.length}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${getStatusClasses(categoryStatus)}`}>
                          {categoryStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-[10px] uppercase font-bold text-zinc-500 hover:text-primary transition-colors">
                          {isExpanded ? 'Collapse' : 'Expand'}
                        </span>
                      </td>
                    </tr>
                    {isExpanded && cat.kpis.map((kpi, idx) => {
                      const liveKpiData = liveKpis.find(lk => lk.id === kpi.id) || kpi; // Use live data if available, else default
                      const kpiStatus = getKpiStatus(liveKpiData);
                      const variance = calculateVariance(liveKpiData);
                      const varianceColor = variance.startsWith('+') ? 'text-emerald-400' : variance.startsWith('-') ? 'text-red-400' : 'text-zinc-400';

                      return (
                      <tr key={`${cat.id}-${idx}`} className="bg-zinc-900/20 border-b border-zinc-900/50">
                        <td className="px-4 py-2 pl-12 text-xs text-zinc-400 font-mono">{liveKpiData.name}</td>
                        <td className="px-4 py-2 text-xs font-mono text-zinc-300 tabular-nums">
                          {typeof liveKpiData.value === 'number' ? liveKpiData.value.toFixed(2) : liveKpiData.value} <span className="text-zinc-600">{liveKpiData.unit}</span>
                        </td>
                        <td className="px-4 py-2 text-xs font-mono text-zinc-300 tabular-nums">
                          {typeof liveKpiData.designTarget === 'number' ? liveKpiData.designTarget.toFixed(2) : liveKpiData.designTarget} <span className="text-zinc-600">{liveKpiData.unit}</span>
                        </td>
                        <td className="px-4 py-2 text-xs font-mono tabular-nums text-zinc-500">
                          1 {/* Individual KPI */}
                        </td>
                        <td className="px-4 py-2 text-xs font-mono">
                          <span className={getStatusClasses(kpiStatus)}>
                            {kpiStatus}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded font-mono tabular-nums ${varianceColor}`}>
                            {variance}
                          </span>
                        </td>
                      </tr>
                    );})}
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
