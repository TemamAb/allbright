import React, { useState } from "react";

export default function SettingsView() {
  const [engineMode, setEngineMode] = useState('LIVE_SIM');
  const [minMarginBps, setMinMarginBps] = useState(1000);
  const [bribeRatioBps, setBribeRatioBps] = useState(500);

  return (
    <div className="space-y-6 max-w-4xl fade-in-up">
      <h2 className="text-3xl font-black italic uppercase text-white">System Settings</h2>
      
      <div className="card-ash p-6 space-y-8">
        <div>
          <label className="text-[10px] uppercase font-bold text-secondary tracking-widest block mb-3">Execution Mode</label>
          <div className="flex gap-2">
            {['SHADOW', 'LIVE_SIM', 'LIVE'].map((mode) => (
              <button 
                key={mode}
                onClick={() => setEngineMode(mode)} 
                className={`px-6 py-2 text-xs font-black rounded border transition-all ${
                  engineMode === mode 
                    ? 'bg-black text-cyan-400 border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.2)]' 
                    : 'bg-[#32323e] text-secondary border-transparent'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-secondary text-[10px] uppercase font-bold tracking-widest">Min Margin (BPS)</label>
            <span className="text-cyan-400 font-mono font-bold">{minMarginBps} BPS</span>
          </div>
          <input 
            type="range" 
            value={minMarginBps} 
            onChange={(e) => setMinMarginBps(parseInt(e.target.value))}
            min="100" max="5000" step="50" 
            className="w-full accent-cyan-500 bg-data-black h-1.5 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-secondary text-[10px] uppercase font-bold tracking-widest">Bribe Ratio (BPS)</label>
            <span className="text-cyan-400 font-mono font-bold">{bribeRatioBps} BPS</span>
          </div>
          <input 
            type="range" 
            value={bribeRatioBps} 
            onChange={(e) => setBribeRatioBps(parseInt(e.target.value))}
            min="100" max="2500" step="10" 
            className="w-full accent-cyan-500 bg-data-black h-1.5 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div className="pt-6 border-t border-ash flex justify-end">
          <button className="bg-cyan-600 hover:bg-cyan-500 text-black font-black py-3 px-10 rounded-xl text-xs uppercase tracking-widest transition-all">
            Save Configuration
          </button>
        </div>
      </div>

      <div className="card-ash p-6 border-red-500/20 bg-red-500/5">
        <h3 className="text-red-400 font-black uppercase text-xs tracking-widest mb-2">Danger Zone</h3>
        <p className="text-[10px] text-red-400/70 mb-4 font-medium uppercase">Irreversible system actions and emergency overrides.</p>
        <button className="border border-red-500/50 text-red-500 hover:bg-red-500/10 px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all">
          Reset System State
        </button>
      </div>
    </div>
  );
}