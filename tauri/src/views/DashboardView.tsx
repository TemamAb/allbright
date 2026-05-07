import React, { useEffect, useState } from "react";
import { TrendingUp, Shield, Activity, ChartLine } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { useGetEngineStatus } from "../lib/api";

const sampleData = [
  { time: '00:00', value: 0.2 }, { time: '04:00', value: 0.5 },
  { time: '08:00', value: 0.3 }, { time: '12:00', value: 0.8 },
  { time: '16:00', value: 0.7 }, { time: '20:00', value: 0.9 }
];

export default function DashboardView() {
  const { data: engineStatus } = useGetEngineStatus();
  const [gesScore, setGesScore] = useState(85.2);
  const [aiEpisodes, setAiEpisodes] = useState(1247);
  const [aiEma, setAiEma] = useState(0.952);
  const [aiMomentum, setAiMomentum] = useState(0.001234);
  const [hardenedActive, setHardenedActive] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setGesScore(prev => Math.min(98, prev + (Math.random() - 0.5) * 0.3));
      setAiEpisodes(prev => prev + 1);
      setAiEma(prev => Math.min(0.99, prev + (Math.random() - 0.5) * 0.003));
      setAiMomentum(prev => Math.max(0.0005, prev + (Math.random() - 0.5) * 0.0002));
    }, 3800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (gesScore > 82.5 && !hardenedActive) setHardenedActive(true);
  }, [gesScore]);

  return (
    <div className="space-y-6 fade-in-up">
      {/* Global Efficiency Header */}
      <div className="card-ash p-6 flex justify-between items-center shadow-2xl">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Global Efficiency</h2>
          <p className="text-[10px] text-secondary font-bold mt-1 uppercase tracking-[0.3em]">
            Last Heartbeat: {new Date().toLocaleTimeString()}
          </p>
        </div>
        <div className="bg-data-black px-6 py-3 rounded-xl text-6xl font-black text-emerald-500 font-mono tabular-nums">
          {gesScore.toFixed(1)}%
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Alpha Capture Chart */}
        <div className="lg:col-span-2 card-ash p-6">
          <div className="flex justify-between mb-4">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Real-time Alpha Capture</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-emerald-500">LIVE FEED</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>
          <div className="chart-container h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sampleData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="time" hide={true} />
                <YAxis hide={true} domain={['auto', 'auto']} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#000000', border: '1px solid #27272a', fontSize: '10px' }}
                  itemStyle={{ color: '#10b981' }}
                />
                <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="space-y-6">
          <div className="card-ash p-6">
            <div className="flex gap-3 mb-4">
              <TrendingUp size={16} className="text-cyan-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">24H Net Yield</span>
            </div>
            <div className="bg-data-black inline-block px-4 py-2 rounded-lg text-2xl font-black text-white font-mono">
              $1,247.82
            </div>
            <div className="text-[10px] text-emerald-500 mt-3 font-bold">+12.4% vs Baseline</div>
          </div>

          <div className="card-ash p-6">
            <div className="flex gap-3 mb-4">
              <Shield size={16} className="text-emerald-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">Risk Mitigation</span>
            </div>
            <div className="bg-data-black inline-block px-4 py-2 rounded-lg text-2xl font-black text-white font-bold">
              Nominal
            </div>
            <div className="text-[10px] text-secondary mt-3 uppercase font-bold tracking-wider">BSS-31 Guard Armed</div>
          </div>
        </div>
      </div>

      {/* Bottom Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-ash p-4">
          <div className="text-[10px] uppercase text-secondary font-bold tracking-wider">Learning Episodes</div>
          <div className="bg-data-black mt-1 p-2 rounded text-2xl font-mono font-bold text-white text-center">
            {aiEpisodes}
          </div>
        </div>
        <div className="card-ash p-4">
          <div className="text-[10px] uppercase text-secondary font-bold tracking-wider">Success EMA</div>
          <div className="bg-data-black mt-1 p-2 rounded text-2xl font-mono font-bold text-white text-center">
            {(aiEma * 100).toFixed(1)}%
          </div>
        </div>
        <div className="card-ash p-4">
          <div className="text-[10px] uppercase text-secondary font-bold tracking-wider">Profit Momentum</div>
          <div className="bg-data-black mt-1 p-2 rounded text-2xl font-mono font-bold text-white text-center">
            {aiMomentum.toFixed(4)}
          </div>
        </div>
        <div className="card-ash p-4">
          <div className="text-[10px] uppercase text-secondary font-bold tracking-wider">Hardened Mode</div>
          <div className="bg-data-black mt-1 p-2 rounded text-2xl font-mono font-bold text-white text-center">
            {hardenedActive ? 'ACTIVE' : 'STANDBY'}
          </div>
        </div>
      </div>
    </div>
  );
}