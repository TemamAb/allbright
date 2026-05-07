import React from "react";
import { Bolt, Lock } from "lucide-react";

export default function OptimizerView() {
  const stats = [
    { label: 'Episodes', value: '1,247' },
    { label: 'Success EMA', value: '95.2%' },
    { label: 'Profit Momentum', value: '0.00123' },
    { label: 'Hardened Config', value: 'LOCKED' }
  ];

  return (
    <div className="space-y-6 fade-in-up">
      <h2 className="text-3xl font-black italic uppercase text-white">AI Auto-Optimizer</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card-ash p-4">
            <div className="text-[10px] uppercase text-secondary font-bold tracking-wider">{stat.label}</div>
            <div className="bg-data-black mt-1 p-2 rounded text-2xl font-bold text-white text-center">
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      <div className="card-ash p-6 flex items-center gap-4">
        <Lock className="text-cyan-400" size={24} />
        <div>
          <span className="text-sm font-bold uppercase text-white">BSS-56 Elite lock:</span>
          <span className="bg-data-black px-2 py-1 rounded text-sm font-mono text-cyan-400 ml-3">
            ACTIVE (Gold Standard)
          </span>
        </div>
      </div>
      
      <div className="card-ash p-8 text-center space-y-4">
        <Bolt size={48} className="text-yellow-500 mx-auto animate-pulse" />
        <h3 className="text-xl font-black uppercase text-white">Continuous Optimization Active</h3>
        <p className="text-secondary text-sm max-w-lg mx-auto italic">
          The Meta-Learner is currently adjusting mempool sensitivity and bribe ratios based on the last 100 cycles.
        </p>
      </div>
    </div>
  );
}
