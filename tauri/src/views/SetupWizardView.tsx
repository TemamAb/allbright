import React from "react";
import { Sparkles, CheckCircle2, Clock } from "lucide-react";

export default function SetupWizardView() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] fade-in-up">
      <div className="text-center max-w-md w-full">
        <Sparkles size={64} className="text-green-500 mb-6 mx-auto" />
        <h2 className="text-3xl font-black uppercase text-white tracking-tighter">Zero-Config Onboarding</h2>
        <p className="text-secondary text-sm font-medium mt-2">AlphaCopilot prepares elite environment</p>
        
        <div className="mt-8 card-ash rounded-xl p-6 space-y-4">
          <div className="flex justify-between items-center bg-data-black/50 p-3 rounded-lg border border-ash">
            <span className="text-secondary font-bold text-xs uppercase tracking-widest">Gate 01: Core Kernel</span>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-black uppercase">Verified</span>
              <CheckCircle2 size={14} className="text-emerald-500" />
            </div>
          </div>
          
          <div className="flex justify-between items-center bg-data-black/50 p-3 rounded-lg border border-ash">
            <span className="text-secondary font-bold text-xs uppercase tracking-widest">Gate 02: RPC Mesh</span>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-black uppercase">Verified</span>
              <CheckCircle2 size={14} className="text-emerald-500" />
            </div>
          </div>
          
          <div className="flex justify-between items-center bg-data-black/50 p-3 rounded-lg border border-ash">
            <span className="text-secondary font-bold text-xs uppercase tracking-widest">Gate 03: Signer Sync</span>
            <div className="flex items-center gap-2">
              <span className="bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded text-[10px] font-black uppercase">Pending</span>
              <Clock size={14} className="text-yellow-500 animate-spin-slow" />
            </div>
          </div>
        </div>

        <button className="mt-8 w-full bg-cyan-600 hover:bg-cyan-500 text-black font-black py-4 rounded-xl text-xs uppercase tracking-[0.2em] transition-all">
          Initiate Full Synchronization
        </button>
      </div>
    </div>
  );
}
