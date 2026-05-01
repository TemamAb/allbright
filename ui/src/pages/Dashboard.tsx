import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useSocket } from "../App";
import { useGetEngineStatus } from "@workspace/api-client-react";
import { GESState, CATEGORIES, THIRTY_SIX_KPIS, FullKPIState } from "../types/kpi";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTelemetry } from '../hooks/useTelemetry';

const profitData = [
  { time: '00:00', profit: 0.00 },
  { time: '01:00', profit: 0.12 },
  { time: '02:00', profit: 0.25 },
  { time: '03:00', profit: 0.33 },
  { time: '04:00', profit: 0.41 },
];

export default function Dashboard() {
  const telemetry = useTelemetry();
  const { data: engineStatus } = useGetEngineStatus();
  const kpis = telemetry.kpis as GESState & FullKPIState;
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const { isConnected } = useSocket();

  const toggleCategory = (catId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(catId)) {
      newExpanded.delete(catId);
    } else {
      newExpanded.add(catId);
    }
    setExpandedCategories(newExpanded);
  };

  const filteredCategories = THIRTY_SIX_KPIS.filter(cat => 
    cat.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const colors = {
      good: 'bg-grafana-green text-grafana-bg',
      warn: 'bg-grafana-yellow text-grafana-bg', 
      bad: 'bg-grafana-red text-grafana-bg'
    };
    return colors[status as keyof typeof colors] || 'bg-grafana-ash text-grafana-text';
  };

  const engineStatusText = engineStatus ? (
    engineStatus.running ? 
      `Engine running ${engineStatus.mode?.toLowerCase() === 'live' ? 'live' : 'in simulation'}` :
      'Engine stopped'
  ) : 'Loading engine status...';

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* GES Header */}
      <div className="bg-grafana-panel border border-grafana-ash rounded-xl p-12 text-center shadow-2xl hover:border-grafana-ash-light transition-all">
        <h1 className="text-6xl font-black text-grafana-green mb-4 drop-shadow-lg">{kpis.ges.toFixed(1)}%</h1>
        <p className="text-2xl font-bold text-grafana-text-dim uppercase tracking-widest mb-2">Global Efficiency Score</p>
        <p className="text-lg text-grafana-text-dim">
          Last Update: {kpis.timestamp.toLocaleTimeString()}
          {isConnected && <span className="ml-2 bg-grafana-green/20 text-grafana-green font-bold px-3 py-1 rounded-full text-sm">● LIVE</span>}
        </p>
      </div>

      {/* Engine Status */}
      <div className="bg-grafana-panel border border-grafana-ash rounded-xl p-10 shadow-xl hover:border-grafana-ash-light">
        <h3 className="text-xl font-bold text-grafana-text mb-6 uppercase tracking-wide">Engine Status</h3>
        <div className={`text-2xl font-black px-8 py-6 rounded-xl text-center shadow-grafana-glow ${
          engineStatus?.running 
            ? engineStatus.mode?.toLowerCase() === 'live' 
              ? 'bg-grafana-green/10 border-2 border-grafana-green/30 text-grafana-green' 
              : 'bg-grafana-yellow/20 border-2 border-grafana-yellow/30 text-grafana-yellow' 
            : 'bg-grafana-ash/50 border-2 border-grafana-ash-light/50 text-grafana-text-dim'
        }`}>
          {engineStatusText}
        </div>
      </div>

      {/* Search */}
      <Input
        placeholder="Search 36 KPIs..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-md h-12"
      />

      {/* 36 KPIs Table */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold">36 KPI Telemetry Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[350px]">KPI Category</TableHead>
                <TableHead className="w-[120px]">Score</TableHead>
                <TableHead className="w-[60px]">#</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Expand</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((cat) => {
                const catScore = (kpis.categories as any)[cat.id] || 0;
                const score = catScore * 100;
                const catStatus = score > 90 ? 'good' : score > 75 ? 'warn' : 'bad';
                const isExpanded = expandedCategories.has(cat.id);
                const catKpis = kpis.categories[cat.id] || cat.kpis;

                return (
                  <React.Fragment key={cat.id}>
                    <TableRow className="cursor-pointer hover:bg-accent" onClick={() => toggleCategory(cat.id)}>
                      <TableCell className="font-semibold flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${getStatusColor(catStatus)}`}>
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </span>
                        {cat.label}
                      </TableCell>
                      <TableCell>
                        <Badge className={`font-bold px-4 py-2 ${getStatusColor(catStatus)}`}>
                          {score.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">{catKpis.length}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(catStatus)}>{catStatus.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-8">
                          {isExpanded ? 'Collapse' : 'Expand'}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {isExpanded && catKpis.map((kpi, idx) => (
                      <TableRow key={idx} className="bg-muted/50">
                        <TableCell className="pl-12 font-medium">{kpi.name}</TableCell>
                        <TableCell className="font-mono">{kpi.value} {kpi.unit}</TableCell>
                        <TableCell className="font-mono">{kpi.target}</TableCell>
                        <TableCell className="font-mono text-sm opacity-75">N/A</TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(kpi.status)} text-xs px-2 py-0.5`}>{kpi.status.toUpperCase()}</Badge>
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

      {/* Profit Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Profit Trend (24h)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={profitData}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#374151"/>
              <XAxis dataKey="time" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip />
              <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
