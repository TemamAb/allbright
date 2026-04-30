import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { GESState, CATEGORIES } from '@/types/kpi';

interface Props {
  kpis: GESState;
}

const KPIGrid: React.FC<Props> = ({ kpis }) => {
  return (
    <div className="bg-grafana-panel border border-grafana-ash rounded-xl p-8 shadow-2xl">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-4xl font-black text-grafana-green drop-shadow-lg">Global Efficiency Score</h2>
        <div className="bg-grafana-green text-grafana-bg px-8 py-4 rounded-xl text-3xl font-black shadow-grafana-glow">
          {kpis.ges.toFixed(1)}%
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Weight</TableHead>
            <TableHead>Contribution</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {CATEGORIES.map(cat => {
            const score = kpis.categories[cat.id as keyof CategoryKPIs] * 100;
            const contrib = score * cat.weight;
            return (
              <TableRow key={cat.id}>
                <TableCell className="font-bold">{cat.label}</TableCell>
                <TableCell>
                  <div className={`px-6 py-2 rounded-xl font-black text-lg shadow-grafana-glow ${score > 90 ? 'bg-grafana-green text-grafana-bg' : score > 75 ? 'bg-grafana-yellow text-grafana-bg' : 'bg-grafana-red text-grafana-bg'}`}>
                    {score.toFixed(1)}%
                  </div>
                </TableCell>
                <TableCell>{(cat.weight * 100).toFixed(0)}%</TableCell>
                <TableCell>{contrib.toFixed(1)}%</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default KPIGrid;

