import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Settings, Server, Key, Sliders, Save } from 'lucide-react';

const SystemSettings: React.FC = () => {
  const [config, setConfig] = useState({
    mode: 'LIVE_SIM',
    rpcEndpoint: 'https://eth-mainnet.g.alchemy.com/v2/...',
    pimlicoKey: 'pim_...',
    minMarginBps: 1000,
    bribeRatioBps: 500
  });

  return (
    <div className="p-8 space-y-8 max-w-4xl">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight italic uppercase">System Settings</h2>
          <p className="text-zinc-500 font-medium mt-1">Engine configuration and high-authority parameters.</p>
        </div>
        <button className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-bold text-sm transition-all shadow-lg shadow-green-900/20">
          <Save className="h-4 w-4" /> Save All Changes
        </button>
      </div>

      <div className="grid gap-6">
        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader className="border-b border-zinc-900">
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2 uppercase">
              <Server className="h-4 w-4 text-blue-500" /> Infrastructure
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase">Execution Mode</label>
              <div className="flex gap-2">
                {['SHADOW', 'LIVE_SIM', 'LIVE'].map(m => (
                  <button 
                    key={m}
                    onClick={() => setConfig(prev => ({ ...prev, mode: m }))}
                    className={`flex-1 py-2 text-xs font-bold rounded border transition-all ${config.mode === m ? 'bg-zinc-100 text-black border-white' : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase flex items-center gap-1">
                  <RefreshCcw className="h-3 w-3" /> RPC Backbone URL
                </label>
                <input 
                  type="password" 
                  value={config.rpcEndpoint}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-blue-500" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase flex items-center gap-1">
                  <Key className="h-3 w-3" /> Pimlico API Key
                </label>
                <input 
                  type="password" 
                  value={config.pimlicoKey}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-blue-500" 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader className="border-b border-zinc-900">
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2 uppercase">
              <Sliders className="h-4 w-4 text-green-500" /> Threshold Tuning
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-zinc-500 uppercase">Min Margin Ratio (BPS): {config.minMarginBps}</label>
              <input type="range" min="100" max="5000" step="50" value={config.minMarginBps} onChange={(e) => setConfig(prev => ({ ...prev, minMarginBps: parseInt(e.target.value) }))} className="w-full accent-green-500" />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-zinc-500 uppercase">Bribe Ratio (BPS): {config.bribeRatioBps}</label>
              <input type="range" min="100" max="2500" step="10" value={config.bribeRatioBps} onChange={(e) => setConfig(prev => ({ ...prev, bribeRatioBps: parseInt(e.target.value) }))} className="w-full accent-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemSettings;
import { RefreshCcw } from 'lucide-react';