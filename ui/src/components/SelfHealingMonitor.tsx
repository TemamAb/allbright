import React from 'react';
import { useLiveTelemetry } from '../services/useLiveTelemetry';
import { Activity, ShieldCheck, Timer, Zap } from 'lucide-react';

/**
 * BSS-60: Self-Healing Monitor Component
 * Visually tracks automated recovery cycles and cooldown windows.
 */
export const SelfHealingMonitor: React.FC = () => {
  const { selfHealingCooldownRemaining, resetSuccessCount, state } = useLiveTelemetry();

  const isCooldownActive = selfHealingCooldownRemaining > 0;
  const isHealingEnabled = state?.selfHealingEnabled ?? false;

  return (
    <div className="p-4 bg-[#1a1c20] border border-[#27272a] rounded-lg shadow-xl">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-500/10 rounded-md">
            <ShieldCheck className="w-4 h-4 text-cyan-500" />
          </div>
          <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest">
            Sovereign Healing
          </h3>
        </div>
        <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-black tracking-tighter border ${
          isHealingEnabled 
            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500' 
            : 'bg-red-500/5 border-red-500/20 text-red-500'
        }`}>
          {isHealingEnabled ? 'BSS-60 ACTIVE' : 'DISABLED'}
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col border-r border-[#27272a]">
          <span className="text-[10px] text-gray-500 uppercase font-semibold mb-1">Total Recoveries</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-mono text-emerald-400 font-bold tracking-tighter">
              {resetSuccessCount}
            </span>
            <Zap className="w-3 h-3 text-emerald-600 mb-1" />
          </div>
        </div>

        <div className="flex flex-col text-right">
          <span className="text-[10px] text-gray-500 uppercase font-semibold mb-1">Cooldown Timer</span>
          {isCooldownActive ? (
            <div className="flex items-center justify-end gap-2 text-orange-400">
              <Timer className="w-4 h-4 animate-pulse" />
              <span className="text-2xl font-mono font-bold tracking-tighter">{selfHealingCooldownRemaining}s</span>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-1.5 text-cyan-400">
              <Activity className="w-4 h-4" />
              <span className="text-sm font-black uppercase tracking-tight">READY</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};