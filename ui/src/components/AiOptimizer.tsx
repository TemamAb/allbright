import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Brain, Cpu, Lock, TrendingUp, AlertTriangle } from 'lucide-react';

const AiOptimizer: React.FC = () => {
  const [aiState, setAiState] = useState({
    episodes: 0,
    ema: 0.95,
    momentum: 0,
    intensity: 0,
    hardened: false
  });

  const baseApiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  useEffect(() => {
    const socket = io(baseApiUrl);
    socket.on('copilot_event', (event) => {
      if (event.type === 'TRADE_OBSERVED') {
        setAiState(prev => ({
          ...prev,
          episodes: event.data.episodes,
          ema: event.data.ema,
          momentum: event.data.momentum
        }));
      }
      if (event.type === 'config-hardened') {
        setAiState(prev => ({ ...prev, hardened: true }));
      }
    });
    return () => { socket.disconnect(); };
  }, [baseApiUrl]);

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-3xl font-black text-white tracking-tight italic uppercase">AI Auto-Optimizer</h2>
        <p className="text-zinc-500 font-medium mt-1">AlphaCopilot meta-learner persistence and status.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Learning Episodes" value={aiState.episodes.toString()} icon={<Cpu className="text-blue-500" />} />
        <MetricCard title="Success EMA" value={`${(aiState.ema * 100).toFixed(2)}%`} icon={<Brain className="text-purple-500" />} />
        <MetricCard title="Profit Momentum" value={aiState.momentum.toFixed(6)} icon={<TrendingUp className="text-green-500" />} />
        <MetricCard title="Adversarial Load" value={aiState.intensity.toString()} icon={<AlertTriangle className="text-red-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <Lock className={`h-4 w-4 ${aiState.hardened ? 'text-green-500' : 'text-zinc-600'}`} />
              Configuration Hardening
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-zinc-500 leading-relaxed">
              BSS-56: Once the system achieves elite performance (GES &gt; 82.5%), the AlphaCopilot locks the "Gold Standard" configuration to prevent API drift.
            </p>
            <div className={`p-3 rounded-lg border ${aiState.hardened ? 'border-green-500/20 bg-green-500/5' : 'border-zinc-800 bg-zinc-900/50'}`}>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-zinc-400 uppercase">Sentinel Status</span>
                <span className={`text-xs font-black ${aiState.hardened ? 'text-green-500' : 'text-zinc-600'}`}>
                  {aiState.hardened ? 'ACTIVE' : 'STANDBY'}
                </span>
              </div>
            </div>
            {!aiState.hardened && (
              <button className="w-full py-2 bg-green-700/20 border border-green-700/30 text-green-500 text-[10px] font-black uppercase rounded hover:bg-green-700/30 transition-all">
                Trigger Manual Hardening
              </button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) => (
  <Card className="bg-zinc-900 border-zinc-800">
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{title}</p>
        {icon}
      </div>
      <p className="text-2xl font-black text-white font-mono tracking-tighter">{value}</p>
    </CardContent>
  </Card>
);

export default AiOptimizer;