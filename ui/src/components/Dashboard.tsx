import React, { useState, useEffect } from "react";
import { TrendingUp, Shield, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

// Sample chart data
const sampleData = [
  { time: '00:00', value: 0.1 }, { time: '04:00', value: 0.4 },
  { time: '08:00', value: 0.3 }, { time: '12:00', value: 0.8 }
];

// Mock engine status (replace with API call in production)
const useGetEngineStatus = () => {
  const [data, setData] = useState({ running: true, mode: 'LIVE', ghostMode: false });
  return { data };
};

export default function Dashboard() {
  const [ges, setGes] = useState(85.0);
  const { data: engineStatus } = useGetEngineStatus();
  const isGhostMode = engineStatus?.ghostMode;

  // Simulate GES updates
  useEffect(() => {
    const interval = setInterval(() => {
      setGes(prev => prev + (Math.random() - 0.5) * 0.5);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full space-y-6 animate-in fade-in duration-500">
      {/* GES Header - Ash.Black Theme */}
      <div className="bg-ash-black border border-ash-border rounded-xl p-8 flex items-center justify-between shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-accent/5 blur-[80px] -mr-32 -mt-32" />
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Global Efficiency</h2>
          <p className="text-[10px] text-ash-muted font-bold mt-1 uppercase tracking-[0.3em]">Last Heartbeat: {new Date().toLocaleTimeString()}</p>
        </div>
        <div className="text-7xl font-black text-emerald-accent font-mono tabular-nums tracking-tighter">
          {isGhostMode ? <span className="text-ash-muted">MASKED</span> : `${ges.toFixed(1)}%`}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts Panel */}
        <div className="lg:col-span-2 bg-ash-black border border-ash-border rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[10px] font-bold text-ash-muted uppercase tracking-widest">Real-time Alpha Capture</h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-emerald-accent">LIVE FEED</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-accent animate-ping" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={sampleData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="time" hide />
              <YAxis hide domain={['auto', 'auto']} />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: '#111217', border: '1px solid #27272a', fontSize: '10px' }}
                itemStyle={{ color: '#10b981' }}
              />
              <Line type="stepAfter" dataKey="value" stroke="#10b981" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Secondary Metrics */}
        <div className="space-y-6">
          <div className="bg-ash-black border border-ash-border rounded-xl p-6 hover:border-cyan-accent/50 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp size={16} className="text-cyan-accent" />
              <span className="text-[10px] font-bold text-ash-muted uppercase tracking-widest">24H Net Yield</span>
            </div>
            <div className="text-3xl font-black text-white font-mono tabular-nums">$1,247.82</div>
            <div className="text-[10px] text-emerald-accent mt-2 font-bold">+12.4% vs Baseline</div>
          </div>
          <div className="bg-ash-black border border-ash-border rounded-xl p-6 hover:border-cyan-accent/50 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <Shield size={16} className="text-emerald-accent" />
              <span className="text-[10px] font-bold text-ash-muted uppercase tracking-widest">Risk Mitigation</span>
            </div>
            <div className="text-3xl font-black text-white">Nominal</div>
            <div className="text-[10px] text-ash-muted/60 mt-2 font-bold uppercase">BSS-31 Guard Armed</div>
          </div>
        </div>
      </div>
    </div>
  );
}
