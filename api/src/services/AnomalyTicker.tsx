import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnomalyTickerProps {
  logs: string[];
}

/**
 * Strategic Anomaly Ticker
 * Visualizes system-wide warnings (Bribe intensity, Latency spikes, Risk shifts)
 * with high-impact motion cues.
 */
export const AnomalyTicker: React.FC<AnomalyTickerProps> = ({ logs }) => {
  return (
    <div className="bg-black/40 border border-white/10 rounded-lg p-4 h-48 overflow-hidden relative">
      <div className="text-xs font-mono text-white/40 uppercase mb-2 tracking-widest flex justify-between">
        <span>System Anomaly Log</span>
        <span className="text-emerald-500/80 animate-pulse">Live Feed</span>
      </div>
      <div className="space-y-2 overflow-y-auto h-full pr-2">
        <AnimatePresence initial={false}>
          {logs.map((log, i) => {
            const isRisk = log.includes('[RISK]');
            const isPerf = log.includes('[PERF]');
            
            return (
              <motion.div
                key={log + i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className={`font-mono text-xs p-2 rounded border-l-2 ${
                  isRisk ? 'bg-red-500/10 border-red-500 text-red-200' :
                  isPerf ? 'bg-amber-500/10 border-amber-500 text-amber-200' :
                  'bg-blue-500/10 border-blue-500 text-blue-200'
                }`}
              >
                <span className="opacity-50 mr-2">[{new Date().toLocaleTimeString()}]</span>
                {log}
              </motion.div>
            );
          })}
        </AnimatePresence>
        {logs.length === 0 && (
          <div className="text-white/20 font-mono text-xs italic">Waiting for telemetry data...</div>
        )}
      </div>
    </div>
  );
};