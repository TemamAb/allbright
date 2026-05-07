import React from "react";

export default function LogsView() {
  const logs = [
    { id: 1, time: '14:20:01', level: 'INFO', message: 'Mempool scan initiated on Polygon POS' },
    { id: 2, time: '14:20:05', level: 'DEBUG', message: 'Alpha-08 kernel synchronized with RPC' },
    { id: 3, time: '14:20:12', level: 'WARN', message: 'Gas price spike detected (850 gwei). Skipping low-margin bundles.' },
    { id: 4, time: '14:21:00', level: 'INFO', message: 'BSS-43 Deployment readiness gate: PASS' }
  ];

  return (
    <div className="space-y-6 fade-in-up">
      <h2 className="text-2xl font-black uppercase text-white">System Logs</h2>
      <div className="card-ash p-4 bg-data-black font-mono text-[10px] space-y-1 h-[60vh] overflow-y-auto">
        {logs.map((log) => (
          <div key={log.id} className="flex gap-4 border-b border-zinc-800/50 py-1">
            <span className="text-zinc-600">[{log.time}]</span>
            <span className={log.level === 'WARN' ? 'text-yellow-500' : log.level === 'ERROR' ? 'text-red-500' : 'text-cyan-500'}>
              {log.level}
            </span>
            <span className="text-zinc-300">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
