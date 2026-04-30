import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search, RefreshCw } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    good: 'bg-green-500',
    warn: 'bg-yellow-500',
    bad: 'bg-red-500',
    default: 'bg-gray-500',
  }[status] || 'bg-gray-500');

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
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-4xl font-black">Global Efficiency Score</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isLive ? "default" : "secondary"} className="text-lg px-3 py-1">
              {isLive ? '● LIVE' : '● OFFLINE'}
            </Badge>
            <div className="text-5xl font-black text-primary">{(kpis.ges || 0).toFixed(1)}%</div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xl text-muted-foreground">
            Last Update: {kpis.timestamp?.toLocaleString() || 'N/A'}
          </p>
        </CardContent>
      </Card>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground transform -translate-y-1/2 pointer-events-none" />
          <Input
            placeholder="Search KPIs..."
            className="pl-10 pr-4 h-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[350px]">Category</TableHead>
                <TableHead className="w-[120px]">Summary Score</TableHead>
                <TableHead className="w-[60px] text-center">#</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredKpis.map((cat) => {
                const isExpanded = expandedCategories.has(cat.id);
                const summary = getCategorySummary(cat);
                const catStatus = getCatStatus(summary);
                const liveKpis = (kpis.categories[cat.id as keyof typeof kpis.categories] as KPI[] || cat.kpis);

                return (
                  <React.Fragment key={cat.id}>
                    <TableRow 
                      className="cursor-pointer hover:bg-accent/50 border-b hover:border-primary/50 transition-colors"
                      onClick={() => toggleCategory(cat.id)}
                    >
                      <TableCell className="font-semibold pl-4">
                        <div className="flex items-center gap-3">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${getStatusColor(catStatus)}`}>
                            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </span>
                          <span>{cat.label}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-lg">
                        <Badge variant="secondary" className={`text-lg px-4 py-2 ${getStatusColor(catStatus)}`}>
                          {summary}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-mono">{liveKpis.length}</TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(catStatus)} px-3 py-1`}>
                          {catStatus.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <Button variant="ghost" size="sm" className="h-8 px-3" onClick={(e) => {
                          e.stopPropagation();
                          toggleCategory(cat.id);
                        }}>
                          {isExpanded ? 'Collapse' : 'Details'}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {isExpanded && liveKpis.map((kpi, idx) => (
                      <TableRow key={`${cat.id}-${idx}`} className="bg-muted/50 hover:bg-muted/70 border-l-4 border-primary/30">
                        <TableCell className="font-medium pl-16">{kpi.name}</TableCell>
                        <TableCell className="font-mono">{typeof kpi.value === 'number' ? kpi.value.toFixed(2) : kpi.value} <span className="text-muted-foreground text-xs">{kpi.unit}</span></TableCell>
                        <TableCell className="font-mono">{typeof kpi.target === 'number' ? kpi.target.toFixed(2) : kpi.target} <span className="text-muted-foreground text-xs">{kpi.unit}</span></TableCell>
                        <TableCell className="font-mono text-sm">{calculateVariance(kpi.value, kpi.target)}</TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(kpi.status)} px-2 py-0.5 text-xs`}>
                            {kpi.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    ))}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Telemetry;

