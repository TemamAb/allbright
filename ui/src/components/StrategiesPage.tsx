import { useStrategies } from "@/context/StrategiesContext";
import {
  Globe, Brain, Zap, Shield, Flag, Cpu, ShieldAlert, BarChart3, Radio
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STRATEGIES = [
  {
    id: 'bss-05' as const,
    title: 'Multi-Chain Arbitrage',
    icon: <Globe size={20} />,
    description: 'Monitors 8 blockchain networks simultaneously via WebSocket. Detects price differences for same token pairs across chains. Executes cross-chain atomic arbitrage when discrepancy exceeds gas costs.',
    metrics: [
      { label: 'Chains', value: '8' },
      { label: 'Latency', value: '<100ms' },
      { label: 'Mempool', value: 'Real-time' },
    ],
  },
  {
    id: 'bss-13' as const,
    title: 'Graph Solver (SPFA-SLF)',
    icon: <Brain size={20} />,
    description: 'Constructs token liquidity graph (nodes=tokens, edges=pools). Uses SPFA algorithm to find negative-sum cycles (profitable arbitrage paths). Parallelized via Rayon for high throughput.',
    metrics: [
      { label: 'Throughput', value: '500 msg/sec' },
      { label: 'Max hops', value: '3' },
      { label: 'Success rate', value: '>95%' },
    ],
  },
  {
    id: 'bss-43' as const,
    title: 'Pre-Execution Simulation',
    icon: <Zap size={20} />,
    description: 'Simulates each arbitrage path with eth_call before execution. Estimates gas, computes net profit after slippage. Rejects unprofitable cycles preemptively to avoid failed transactions.',
    metrics: [
      { label: 'Sim latency', value: '<50ms' },
      { label: 'Gas estimator', value: 'Real RPC' },
      { label: 'Pass rate', value: '92%' },
    ],
  },
  {
    id: 'bss-45' as const,
    title: 'Risk Engine',
    icon: <Shield size={20} />,
    description: 'Enforces profit gates and anti-hijack safety limits. Simulates profit vs real RPC; delta >20% rejects trade. Monitors liquidation risk, flash loan defaults, and adversarial MEV.',
    metrics: [
      { label: 'Protection', value: '20% delta' },
      { label: 'Anti-Hijack', value: 'Active' },
      { label: 'Circuit Breaker', value: 'BSS-31' },
    ],
  },
  {
    id: 'bss-42' as const,
    title: 'MEV Guard',
    icon: <Flag size={20} />,
    description: 'Protects against front-running and sandwich attacks. Monitors mempool for suspicious patterns, adjusts gas premiums dynamically, uses private RPC relays.',
    metrics: [
      { label: 'Detection', value: 'Real-time' },
      { label: 'Relay', value: 'Flashbots' },
      { label: 'Success', value: '99.2%' },
    ],
  },
];

export default function StrategiesPage() {
  const { strategies, toggleStrategy, isActive } = useStrategies();

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">Strategy Configurator</h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] mt-3">Specialist (BSS) Vector Control</p>
        </div>
        
        <div className="bg-ash-black border border-ash-border px-6 py-4 rounded-2xl flex items-center gap-4 shadow-xl">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-accent animate-pulse" />
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">5 Specialists Online</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {STRATEGIES.map((strategy) => {
          const active = isActive(strategy.id);
          return (
            <div
              key={strategy.id}
              className={`bg-ash-black border rounded-2xl p-6 transition-all duration-500 shadow-xl flex flex-col relative overflow-hidden group ${
                active
                  ? "border-emerald-accent/30 shadow-emerald-accent/5"
                  : "border-ash-border opacity-60 hover:opacity-100"
              }`}
            >
              {/* Background Accent */}
              {active && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-accent/5 blur-3xl -mr-16 -mt-16" />
              )}
              
              <div className="flex items-start justify-between mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-500 ${
                  active ? "bg-emerald-accent/10 border-emerald-accent/20 text-emerald-accent shadow-[0_0_15px_rgba(16,185,129,0.1)]" : "bg-ash-dark border-ash-border text-zinc-600"
                }`}>
                  {strategy.icon}
                </div>
                <Badge className={`${
                  active ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-zinc-800 text-zinc-500 border-zinc-700"
                } text-[8px] font-black uppercase px-2 py-0.5 rounded tracking-[0.2em]`}>
                  {strategy.id}
                </Badge>
              </div>

              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-3">{strategy.title}</h3>
              <p className="text-[10px] text-zinc-500 leading-relaxed font-medium mb-6 flex-grow">
                {strategy.description}
              </p>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 mb-8">
                {strategy.metrics.map((m, i) => (
                  <div key={i} className="bg-black border border-ash-border/30 rounded-lg p-2">
                    <p className="text-[7px] text-zinc-600 uppercase font-black tracking-widest mb-1">{m.label}</p>
                    <p className="text-[10px] font-black text-zinc-300 uppercase truncate">{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Action */}
              <div className="flex items-center justify-between pt-6 border-t border-ash-border/50">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-accent animate-pulse' : 'bg-zinc-800'}`} />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">
                    {active ? "Operational" : "Standby"}
                  </span>
                </div>
                <Button
                  variant={active ? "destructive" : "default"}
                  size="sm"
                  onClick={() => toggleStrategy(strategy.id, !active)}
                  className={`h-9 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                    active 
                      ? "bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white" 
                      : "bg-emerald-accent text-black hover:bg-emerald-accent/80"
                  }`}
                >
                  {active ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
