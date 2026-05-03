import React, { useEffect, useState } from 'react';
import { ShieldCheck, XCircle, CheckCircle2, Zap } from 'lucide-react';

/**
 * BSS-52 Sidebar Advice Component
 * Guides users of all levels to maintain "Elite Grade" performance.
 */
export const SidebarAdvice: React.FC = () => {
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/engine/status');
        const data = await response.json();
        setOnboardingComplete(data.onboardingComplete);
      } catch (err) {
        // Silent fail to avoid UI clutter during init
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 5000); // Polling for state transition
    return () => clearInterval(interval);
  }, []);

  if (!onboardingComplete) return null;

  return (
    <div className="p-4 space-y-4 font-sans border-t border-[#404040] bg-[#1e1e1e]/50">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-3.5 h-3.5 text-[#f2cc0c]" />
        <span className="text-[10px] font-black uppercase tracking-widest text-[#8e8e8e]">Commercial Operator Handbook</span>
      </div>

      <div className="space-y-3">
        {/* The Dos */}
        <div className="space-y-1.5">
          <p className="text-[9px] font-bold text-[#73bf69] uppercase">The Dos</p>
          <ul className="space-y-1">
            <li className="flex gap-2 text-[10px] text-[#d8d9da] leading-tight">
              <CheckCircle2 className="w-3 h-3 text-[#73bf69] shrink-0" />
              Optimize for GES {'>'} 82.5% before Cloud Sync.
            </li>
            <li className="flex gap-2 text-[10px] text-[#d8d9da] leading-tight">
              <CheckCircle2 className="w-3 h-3 text-[#73bf69] shrink-0" />
              Monitor Net Realized Profit (NRP) 24/7.
            </li>
            <li className="flex gap-2 text-[10px] text-[#d8d9da] leading-tight">
              <CheckCircle2 className="w-3 h-3 text-[#73bf69] shrink-0" />
              Secure profits via the Withdrawal Panel.
            </li>
          </ul>
        </div>

        {/* The Don'ts */}
        <div className="space-y-1.5">
          <p className="text-[9px] font-bold text-[#e02f44] uppercase">The Don'ts</p>
          <ul className="space-y-1">
            <li className="flex gap-2 text-[10px] text-[#d8d9da] leading-tight">
              <XCircle className="w-3 h-3 text-[#e02f44] shrink-0" />
              Bypass hardware encryption protocols.
            </li>
            <li className="flex gap-2 text-[10px] text-[#d8d9da] leading-tight">
              <XCircle className="w-3 h-3 text-[#e02f44] shrink-0" />
              Attempt codebase modifications (Admin Only).
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
