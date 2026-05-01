import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { GESState, CATEGORIES } from '@/types/kpi';

interface Props {
  kpis: GESState;
}

const KPIGrid: React.FC<Props> = ({ kpis }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* GES Main Panel */}
      <div className="bg-grafana-panel border border-grafana-ash rounded-2xl p-8 col-span-full shadow-2xl hover:border-grafana-green/50 transition-all">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-5xl font-black text-grafana-green drop-shadow-2xl glow-green">Global Efficiency Score</h2>
          <div className="bg-gradient-to-r from-grafana-green to-emerald-500 text-grafana-bg px-12 py-6 rounded-2xl text-5xl font-black shadow-grafana-glow">
            {kpis.ges.toFixed(1)}%
          </div>
        </div>
      </div>
      
      {/* Category Panels */}
      {CATEGORIES.map(cat => {
        const score = kpis.categories[cat.id as keyof CategoryKPIs] * 100;
        const contrib = score * cat.weight;
        const statusClass = score > 90 ? 'border-grafana-green/50 from-grafana-green/10 to-emerald-400/10' : score > 75 ? 'border-grafana-yellow/50 from-amber-500/10 to-orange-400/10' : 'border-grafana-red/50 from-red-500/10 to-pink-400/10';
        const textClass = score > 90 ? 'text-grafana-green' : score > 75 ? 'text-grafana-yellow' : 'text-grafana-red';
        
        return (
          <div key={cat.id} className={`bg-grafana-panel border ${statusClass} rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all group hover:-translate-y-1`}>
            <div className="flex items-center gap-4 mb-6">

export default KPIGrid;

