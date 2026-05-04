// ui/src/components/RpcHealthMap.tsx
import React, { useState, useEffect } from 'react';
import { RpcHealthReport, RpcHealthMetric } from '../types/rpc';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { AlertCircle, CheckCircle, XCircle, Clock, WifiOff } from 'lucide-react'; // Assuming lucide-react is available

interface RpcHealthMapProps {
  apiUrl?: string; // Base URL for the API, defaults to VITE_API_BASE_URL
}

const RpcHealthMap: React.FC<RpcHealthMapProps> = ({ apiUrl }) => {
  const [report, setReport] = useState<RpcHealthReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const baseApiUrl = apiUrl || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  useEffect(() => {
    const fetchRpcHealth = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${baseApiUrl}/api/rpc/v1/rpc-health`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: RpcHealthReport = await response.json();
        setReport(data);
      } catch (err) {
        console.error("Failed to fetch RPC health:", err);
        setError("Failed to load RPC health data.");
      } finally {
        setLoading(false);
      }
    };

    fetchRpcHealth();
    const interval = setInterval(fetchRpcHealth, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [baseApiUrl]);

  const getStatusBadge = (status: RpcHealthReport['overall_status']) => {
    switch (status) {
      case 'healthy': return <Badge className="bg-green-500 hover:bg-green-600 text-white">Healthy</Badge>;
      case 'degraded': return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">Degraded</Badge>;
      case 'unhealthy': return <Badge className="bg-red-500 hover:bg-red-600 text-white">Unhealthy</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getMetricStatusIcon = (metric: RpcHealthMetric) => {
    if (!metric.is_healthy) return <XCircle className="h-4 w-4 text-red-500" />;
    if (metric.current_latency_ms > 200 || metric.error_rate > 0.1) return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  if (loading) {
    return <Card><CardContent className="p-4 text-center">Loading RPC Health...</CardContent></Card>;
  }

  if (error) {
    return <Card><CardContent className="p-4 text-center text-red-500">Error: {error}</CardContent></Card>;
  }

  if (!report || report.metrics.length === 0) {
    return <Card><CardContent className="p-4 text-center">No RPC metrics available.</CardContent></Card>;
  }

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-3">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">RPC Health Map</CardTitle>
        <div className="flex items-center space-x-2">
          {getStatusBadge(report.overall_status)}
          <span className="text-xs text-muted-foreground">
            {report.active_rpc_count}/{report.total_rpc_count} Active
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {report.metrics.map((metric) => (
            <Card key={metric.id} className={metric.is_healthy ? "" : "border-red-500"}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center space-x-2">
                  {getMetricStatusIcon(metric)}
                  <span>{metric.id}</span>
                </CardTitle>
                {metric.is_healthy ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span>{metric.current_latency_ms}ms</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Block: {metric.last_block_number}
                </p>
                <div className="mt-2 text-xs text-muted-foreground">
                  Error Rate: {(metric.error_rate * 100).toFixed(1)}%
                  <Progress value={metric.error_rate * 100} className="h-1 mt-1" />
                </div>
                {metric.consecutive_failures > 0 && (
                  <p className="text-xs text-red-400 mt-1">
                    {metric.consecutive_failures} consecutive failures
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RpcHealthMap;