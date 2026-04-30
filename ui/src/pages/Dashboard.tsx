import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useSocket } from "../App";
import { GESState, CATEGORIES, THIRTY_SIX_KPIS, FullKPIState } from "../types/kpi";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTelemetry } from '../hooks/useTelemetry';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const profitData = [
  { time: '00:00', profit: 0.00 },
  { time: '01:00', profit: 0.12 },
  { time: '02:00', profit: 0.25 },
  { time: '03:00', profit: 0.33 },
  { time: '04:00', profit: 0.41 },
];

export default function Dashboard() {
  const telemetry = useTelemetry();
  const [kpis] = useState(telemetry.kpis as GESState & FullKPIState);
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
      good: 'bg-green-500',
      warn: 'bg-yellow-500',
      bad: 'bg-red-500'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* GES Header */}
      <Card>
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-5xl font-black text-primary">{kpis.ges.toFixed(1)}%</CardTitle>
          <p className="text-2xl font-bold text-muted-foreground uppercase tracking-wide">Global Efficiency Score</p>
          <p className="text-sm text-muted-foreground mt-1">
            Last Update: {kpis.timestamp.toLocaleTimeString()}
            {isConnected && <span className="ml-2 text-green-500 font-bold">● LIVE</span>}
          </p>
        </CardHeader>
      </Card>

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
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${getStatusColor(catStatus)}">
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
                          <Badge className={getStatusColor(kpi.status)} className="text-xs px-2 py-0.5">{kpi.status.toUpperCase()}</Badge>
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

      {/* Profit Chart (Retained) */}
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

