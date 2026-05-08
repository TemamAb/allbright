import React, { useState } from 'react';
import { Wand2, Rocket, ShieldCheck, ChevronRight, Sparkles, CheckCircle2, Circle } from 'lucide-react';
import { Button } from './ui/button';

const SetupWizard: React.FC = () => {
  const [step, setStep] = useState(1);

  const steps = [
    { id: 1, title: 'Identity', desc: 'Elite Brand Config', icon: <Sparkles className="text-amber-400" /> },
    { id: 2, title: 'Engine', desc: 'RPC & Signer Sync', icon: <Rocket className="text-cyan-accent" /> },
    { id: 3, title: 'Audit', desc: 'Benchmark Verification', icon: <ShieldCheck className="text-emerald-accent" /> }
  ];

  return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[85vh] animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="max-w-2xl w-full space-y-12">
        {/* Top Info */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-emerald-accent/10 border border-emerald-accent/20 mb-2 shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-transform hover:scale-110 duration-500">
            <Wand2 className="h-10 w-10 text-emerald-accent" />
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Zero-Config Deployment</h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.4em]">Initializing Elite Execution Environment</p>
        </div>

        {/* Progress Bar */}
        <div className="flex justify-between items-center px-8 relative">
          <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-ash-border -z-10 -translate-y-1/2" />
          <div 
            className="absolute top-1/2 left-0 h-[2px] bg-emerald-accent -z-10 -translate-y-1/2 transition-all duration-700 ease-in-out"
            style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
          />
          {steps.map(s => (
            <div key={s.id} className="flex flex-col items-center gap-3 bg-ash-black px-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black border transition-all duration-500 ${
                step >= s.id 
                  ? 'bg-emerald-accent border-emerald-accent text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                  : 'bg-black border-ash-border text-zinc-700'
              }`}>
                {step > s.id ? <CheckCircle2 size={16} /> : s.id}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest ${step >= s.id ? 'text-white' : 'text-zinc-700'}`}>{s.title}</span>
            </div>
          ))}
        </div>

        {/* Content Card */}
        <div className="bg-ash-black border border-ash-border rounded-3xl shadow-2xl overflow-hidden relative group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-accent/40 to-transparent" />
          
          <div className="p-10 space-y-10">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-ash-dark border border-ash-border rounded-2xl flex items-center justify-center transition-all group-hover:border-emerald-accent/30">
                {steps[step-1].icon}
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight italic">{steps[step-1].title} Configuration</h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">{steps[step-1].desc}</p>
              </div>
            </div>

            <div className="min-h-[160px] flex flex-col justify-center">
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                  <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block">Deployment Signature</label>
                  <input 
                    type="text" 
                    placeholder="e.g. ALLBRIGHT PRIME" 
                    className="w-full bg-black/40 border border-ash-border rounded-xl p-4 text-sm font-black text-white uppercase tracking-widest focus:outline-none focus:border-emerald-accent/50 transition-all placeholder:text-zinc-800" 
                  />
                  <div className="flex items-start gap-3 bg-emerald-500/[0.03] p-4 rounded-xl border border-emerald-500/10">
                    <Sparkles size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">Setup Advisor: Standardizing on "PRIME" or "QUANTUM" suffixes improves institutional branding recognized by bridge validators.</p>
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 text-center">
                  <div className="border-2 border-dashed border-ash-border rounded-2xl p-10 hover:border-cyan-accent/30 hover:bg-cyan-accent/[0.02] transition-all cursor-pointer group/upload">
                    <Rocket size={32} className="text-zinc-800 mx-auto mb-4 group-hover/upload:text-cyan-accent transition-colors" />
                    <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mb-2">Drop Secure Configuration .JSON</p>
                    <p className="text-[9px] text-zinc-700 font-bold uppercase">Zero-Config AI Sync Mode</p>
                  </div>
                </div>
              )}
              {step === 3 && (
                <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-500">
                  {[
                    { l: 'Gate 01: Core Kernel Architecture', s: 'Verified' },
                    { l: 'Gate 02: Mempool Intelligence Unit', s: 'Verified' },
                    { l: 'Gate 03: Throughput Benchmark', s: 'Pending' },
                  ].map(g => (
                    <div key={g.l} className="flex justify-between items-center p-4 bg-black/40 rounded-xl border border-ash-border/50 group/row hover:border-zinc-700 transition-colors">
                      <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{g.l}</span>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${g.s === 'Verified' ? 'text-emerald-accent' : 'text-amber-500'}`}>{g.s}</span>
                        <div className={`w-1.5 h-1.5 rounded-full ${g.s === 'Verified' ? 'bg-emerald-accent' : 'bg-amber-500 animate-pulse'}`} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button 
              onClick={() => step < 3 && setStep(step + 1)}
              className="w-full h-14 bg-white hover:bg-zinc-200 text-black font-black uppercase tracking-[0.2em] text-xs rounded-2xl flex items-center justify-center gap-3 transition-all shadow-2xl shadow-white/5 active:scale-[0.98]"
            >
              {step === 3 ? 'Finalize Institutional Audit' : 'Advance Calibration Phase'} 
              <ChevronRight size={18} />
            </Button>
          </div>
        </div>

        {/* Bottom Info */}
        <p className="text-center text-[9px] font-black text-zinc-700 uppercase tracking-widest">
          Secured by RSA-4096 / Sovereign Armor Protocol D
        </p>
      </div>
    </div>
  );
};
export default SetupWizard;