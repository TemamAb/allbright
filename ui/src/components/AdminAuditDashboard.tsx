import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Activity, ShieldCheck, Terminal } from 'lucide-react';

interface ProcessHealth {
  cpu_usage: number;
  memory_usage: number;
  status: string;
}

interface LogEntry {
  timestamp: number;
  level: string;
  source: string;
  message: string;
}

export default function AdminAuditDashboard() {
  const [health, setHealth] = useState<ProcessHealth | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const healthData = await invoke<ProcessHealth>('audit_get_process_health');
        const logsData = await invoke<LogEntry[]>('audit_fetch_logs', { limit: 50 });
        setHealth(healthData);
        setLogs(logsData);
      } catch (error) {
        console.error("Failed to fetch audit data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
    // Refresh every 5 seconds
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold uppercase tracking-widest text-heading-blue flex items-center gap-2">
          <ShieldCheck size={24} /> Admin Audit Dashboard
        </h1>
        <p className="text-sm text-muted-foreground tracking-widest uppercase mt-1">Live Process and Health Monitoring</p>
      </header>

      {loading ? (
        <div className="text-muted-foreground animate-pulse text-sm">Initializing Audit Sensors...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Health Metrics */}
          <div className="bg-muted/10 border border-border rounded-lg p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-white mb-4 flex items-center gap-2">
              <Activity size={16} className="text-profit" /> Process Health
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-black/40 p-3 rounded border border-border">
                <span className="text-xs uppercase text-muted-foreground font-bold">Status</span>
                <span className="text-xs uppercase text-profit font-bold">{health?.status || 'UNKNOWN'}</span>
              </div>
              <div className="flex justify-between items-center bg-black/40 p-3 rounded border border-border">
                <span className="text-xs uppercase text-muted-foreground font-bold">CPU Usage</span>
                <span className="text-xs uppercase text-white font-mono">{health?.cpu_usage.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between items-center bg-black/40 p-3 rounded border border-border">
                <span className="text-xs uppercase text-muted-foreground font-bold">Memory</span>
                <span className="text-xs uppercase text-white font-mono">
                  {health ? (health.memory_usage / 1024 / 1024).toFixed(2) : 0} MB
                </span>
              </div>
            </div>
          </div>

          {/* Audit Logs */}
          <div className="bg-muted/10 border border-border rounded-lg p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-white mb-4 flex items-center gap-2">
              <Terminal size={16} className="text-heading-blue" /> Live Audit Stream
            </h2>
            <div className="bg-black/60 rounded border border-border overflow-hidden h-64 overflow-y-auto p-4 space-y-2">
              {logs.map((log, i) => (
                <div key={i} className="text-xs font-mono">
                  <span className="text-muted-foreground">[{new Date(log.timestamp * 1000).toLocaleTimeString()}]</span>{' '}
                  <span className={log.level === 'ERROR' ? 'text-red-500' : 'text-heading-blue'}>{log.level}</span>{' '}
                  <span className="text-white/70">[{log.source}]</span>{' '}
                  <span className="text-white">{log.message}</span>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-muted-foreground text-xs uppercase tracking-widest">No logs detected.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
