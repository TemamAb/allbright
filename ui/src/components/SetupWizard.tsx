import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Wand2, Rocket, ShieldCheck, ChevronRight, Sparkles } from 'lucide-react';

const SetupWizard: React.FC = () => {
  const [step, setStep] = useState(1);

  const steps = [
    { id: 1, title: 'Commercial Identity', desc: 'Define your elite DeFi brand.', icon: <Sparkles className="text-yellow-500" /> },
    { id: 2, title: 'Engine Connection', desc: 'Sync your RPC and execution signers.', icon: <Rocket className="text-blue-500" /> },
    { id: 3, title: 'Security Audit', desc: 'Verify gates and elite benchmarks.', icon: <ShieldCheck className="text-green-500" /> }
  ];

  return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[80vh]">
      <div className="max-w-xl w-full space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 mb-4">
            <Wand2 className="h-8 w-8 text-green-500" />
          </div>
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Zero-Config Onboarding</h2>
          <p className="text-zinc-500">AlphaCopilot is preparing your elite environment.</p>
        </div>

        <div className="flex justify-between px-4 relative">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-zinc-800 -z-10" />
          {steps.map(s => (
            <div key={s.id} className={`flex flex-col items-center gap-2 ${step >= s.id ? 'opacity-100' : 'opacity-30'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${step === s.id ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-black text-white border-zinc-700'}`}>
                {s.id}
              </div>
            </div>
          ))}
        </div>

        <Card className="bg-zinc-950 border-zinc-800 shadow-2xl overflow-hidden">
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                {steps[step-1].icon}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">{steps[step-1].title}</h3>
                <p className="text-sm text-zinc-500">{steps[step-1].desc}</p>
              </div>
            </div>

            <div className="py-4 space-y-4">
              {step === 1 && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-600 uppercase">App Name</label>
                  <input type="text" placeholder="e.g. Allbright Prime" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:ring-1 focus:ring-green-500" />
                  <p className="text-[10px] text-zinc-500 italic leading-relaxed">AI Setup Advisor: Names with 'Prime' or 'Quantum' suffixes are trending in institutional DeFi.</p>
                </div>
              )}
              {step === 2 && (
                <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 text-center">
                  <p className="text-xs text-zinc-400 mb-4 italic">Drop your .env file here for Zero-Config AI sync.</p>
                  <div className="border-2 border-dashed border-zinc-700 rounded-xl p-8 hover:border-blue-500 transition-colors cursor-pointer">
                    <p className="text-xs text-zinc-600 font-bold uppercase">Click or Drag to Upload</p>
                  </div>
                </div>
              )}
              {step === 3 && (
                <div className="space-y-3">
                  {[
                    { l: 'Gate 01: Core Architecture', s: 'Verified' },
                    { l: 'Gate 02: Mempool Intelligence', s: 'Verified' },
                    { l: 'Gate 03: Performance Thresholds', s: 'Pending' },
                  ].map(g => (
                    <div key={g.l} className="flex justify-between items-center p-3 bg-zinc-900 rounded border border-zinc-800">
                      <span className="text-xs text-zinc-400 font-bold uppercase">{g.l}</span>
                      <span className={`text-[10px] font-black ${g.s === 'Verified' ? 'text-green-500' : 'text-yellow-500'}`}>{g.s}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button 
              onClick={() => step < 3 && setStep(step + 1)}
              className="w-full py-4 bg-white hover:bg-zinc-200 text-black font-black uppercase tracking-widest text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-white/5"
            >
              {step === 3 ? 'Complete Final Audit' : 'Proceed to Next Phase'} <ChevronRight className="h-4 w-4" />
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
export default SetupWizard;