import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { GESState, CATEGORIES } from '@/types/kpi';

interface Props {
  kpis: GESState;
}

const KPIGrid: React.FC<Props> = ({ kpis }) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-white">Global Efficiency Score</h2>
        <Badge variant="secondary" className="text-3xl">
          {kpis.ges.toFixed(1)}%
        </Badge>
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
                  <Badge className={score > 90 ? 'bg-green-500' : score > 75 ? 'bg-yellow-500' : 'bg-red-500'}>
                    {score.toFixed(1)}%
                  </Badge>
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

