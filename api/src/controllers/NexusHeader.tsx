import React, { useEffect, useState } from 'react';
import { ShieldCheck, Wallet, Activity, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * BSS-52 Global Header Component
 * Hardened for commercial white-labeling and dynamic identity.
 */
export const GlobalHeader: React.FC = () => {
  const [metrics, setMetrics] = useState({ 
    balance: 0, 
    ges: 0, 
    running: false,
    appName: 'Trading Engine',
    intelSource: 'BRIGHTSKY_BOOTSTRAP',
    integrityPass: true,
    ghostMode: false,
    logoUrl: null as string | null
  });

  useEffect(() => {
    const sync = async () => {
      try {
        const res = await fetch('/api/engine/status');
        const data = await res.json();
        
        // BSS-43: Integrity Watchdog Logic
        const benchmarks: any = { profit: 850, risk: 900, perf: 825, eff: 880, health: 920, autoOpt: 800 };
        const scores = data.domainScores || {};
        const threshold = data.integrityThreshold || 70;
        
        const isPass = Object.keys(benchmarks).every(key => {
          const score = scores[key] || 0;
          const bench = benchmarks[key];
          return score >= (bench * (threshold / 100));
        });

        setMetrics({ 
          balance: data.totalWalletBalance || 0, 
          ges: data.totalWeightedScore || 0,
          running: data.running,
          appName: data.appName || (data.ghostMode ? 'Elite Protocol' : 'BrightSky'),
          intelSource: data.intelligenceSource || 'BRIGHTSKY_BOOTSTRAP',
          integrityPass: isPass,
          ghostMode: data.ghostMode,
          logoUrl: data.logoUrl || null
        });
      } catch (e) {
        console.error("Header sync failed", e);
      }
    };
    sync();
    const itv = setInterval(sync, 5000);
    return () => clearInterval(itv);
  }, []);

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-[#404040] bg-[#1e1e1e] sticky top-0 z-50 font-sans">
      <div className="flex items-center gap-4">
        <div className={`w-7 h-7 rounded flex items-center justify-center overflow-hidden transition-all duration-500 ${metrics.integrityPass ? 'bg-[#73bf69]' : 'bg-[#e02f44] animate-pulse shadow-[0_0_15px_rgba(224,47,68,0.5)]'}`}>
          {metrics.logoUrl ? (
            <img src={metrics.logoUrl} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <ShieldCheck className={metrics.integrityPass ? 'text-[#1e1e1e]' : 'text-white'} size={18} />
          )}
        </div>
        <div className="flex flex-col">
          <span className="font-black text-sm tracking-tight text-[#d8d9da] uppercase leading-none">
            {metrics.appName.toUpperCase()}
          </span>
          <span className="text-[8px] text-[#8e8e8e] uppercase tracking-[0.2em] font-bold mt-0.5">
            Operational Command Interface
          </span>
        </div>
      </div>

      <div className="flex items-center gap-8">
        {/* Intelligence Health Badge */}
        <div className="flex items-center gap-2">
          <Activity className={`w-3 h-3 ${metrics.intelSource === 'USER_PRIVATE' ? 'text-[#73bf69]' : 'text-[#f2cc0c]'}`} />
          <span className="text-[10px] font-bold text-[#8e8e8e] uppercase tracking-tighter">AI Node:</span>
          <Badge variant="outline" className={`h-5 text-[9px] border-[#404040] ${metrics.intelSource === 'USER_PRIVATE' ? 'text-[#73bf69] bg-[#73bf69]/5' : 'text-[#f2cc0c] bg-[#f2cc0c]/5'}`}>
            {metrics.intelSource === 'USER_PRIVATE' ? 'PRIVATE' : 'BOOTSTRAP'}
          </Badge>
        </div>

        <div className="flex flex-col items-end gap-0.5">
          <span className="text-[9px] text-[#8e8e8e] uppercase font-bold tracking-widest leading-none">Global Efficiency</span>
          <span className={`text-xs font-mono font-bold tabular-nums ${metrics.ges > 825 ? 'text-[#73bf69]' : 'text-[#f2cc0c]'}`}>
            {(metrics.ges / 10).toFixed(1)}%
          </span>
        </div>

        <div className="h-6 w-[1px] bg-[#404040]" />

        {/* High-Visibility Balance Metric */}
        <div className="flex items-center gap-3 bg-[#2d2d2d] border border-[#404040] px-4 py-2 rounded shadow-inner">
          <Wallet className="w-4 h-4 text-[#5794f2]" />
          <div className="flex flex-col">
            <span className="text-[9px] text-[#8e8e8e] uppercase font-black tracking-tight leading-none mb-0.5">Total System Balance</span>
            <span className="text-sm font-mono font-black text-[#73bf69] tabular-nums flex items-baseline gap-1 leading-none">
              {metrics.balance.toFixed(4)} 
              <span className="text-[9px] text-[#8e8e8e] font-bold ml-1">ETH</span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};