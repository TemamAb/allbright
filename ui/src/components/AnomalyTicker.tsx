import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnomalyTickerProps {
  logs: string[];
  maxLogs?: number; // Configurable bound to prevent memory leaks
}

export const AnomalyTicker: React.FC<AnomalyTickerProps> = ({
  logs,
  maxLogs = 50 // Default bound to prevent unbounded growth
}) => {
  // Apply memory bounds: only keep the most recent logs
  const boundedLogs = useMemo(() => {
    return logs.slice(-maxLogs);
  }, [logs, maxLogs]);

  // Create stable keys to prevent AnimatePresence memory leaks
  const logItems = useMemo(() => {
    return boundedLogs.map((log, i) => ({
      id: `${log}_${i}_${boundedLogs.length}`, // Include length to force re-render on truncation
      content: log,
      timestamp: new Date().toLocaleTimeString(),
      isRisk: log.includes('[RISK]'),
      isPerf: log.includes('[PERF]'),
    }));
  }, [boundedLogs]);

  return (
    <div className="bg-black/40 border border-white/10 rounded-lg p-4 h-48 overflow-hidden relative">
      <div className="text-xs font-mono text-white/40 uppercase mb-2 tracking-widest flex justify-between">
        <span>System Anomaly Log</span>
        <span className="text-emerald-500/80 animate-pulse">
          Live Feed ({boundedLogs.length}/{logs.length > maxLogs ? `${logs.length}` : 'unlimited'})
        </span>
      </div>
      <div className="space-y-2 overflow-y-auto h-full pr-2">
        <AnimatePresence initial={false} mode="popLayout">
          {logItems.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.3 }}
              className={`font-mono text-xs p-2 rounded border-l-2 ${
                item.isRisk ? 'bg-red-500/10 border-red-500 text-red-200' :
                item.isPerf ? 'bg-amber-500/10 border-amber-500 text-amber-200' :
                'bg-blue-500/10 border-blue-500 text-blue-200'
              }`}
            >
              <span className="opacity-50 mr-2">[{item.timestamp}]</span>
              {item.content}
            </motion.div>
          ))}
        </AnimatePresence>
        {boundedLogs.length === 0 && (
          <div className="text-white/20 font-mono text-xs italic">Waiting for telemetry data...</div>
        )}
      </div>
    </div>
  );
};