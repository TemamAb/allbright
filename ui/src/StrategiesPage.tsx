import { useStrategies } from "@/context/StrategiesContext";
import {
  Globe, Brain, Zap, Shield, Flag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <div className="space-y-6">
       <div className="flex items-center gap-2">
         <Zap size={20} className="text-primary" />
        <h1 className="text-electric text-2xl font-bold uppercase tracking-widest">
          Strategy Configurator
        </h1>
      </div>

      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
        Toggle allbright Specialists (BSS) on/off. Disabling a strategy removes it from active consideration.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {STRATEGIES.map((strategy) => {
          const active = isActive(strategy.id);
          return (
            <Card
              key={strategy.id}
              className={`glass-panel border transition-all ${
                active
                  ? "border-primary/40 bg-primary/5"
                  : "border-border/50 bg-transparent opacity-70"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded ${active ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground"}`}>
                      {strategy.icon}
                    </div>
                    <CardTitle className="text-[13px] uppercase tracking-widest text-foreground">
                      {strategy.title}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  {strategy.description}
                </p>

                {/* Metrics */}
                <div className="flex gap-2 flex-wrap">
                  {strategy.metrics.map((m, i) => (
                    <div
                      key={i}
                      className="px-2 py-1 rounded bg-white/5 border border-white/5"
                    >
                      <div className="text-[8px] text-muted-foreground uppercase tracking-wider">
                        {m.label}
                      </div>
                      <div className="text-[11px] font-bold text-foreground">
                        {m.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-border/30">
                  <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
                    {active ? "Active" : "Disabled"}
                  </span>
                  <Button
                    size="sm"
                    variant={active ? "default" : "outline"}
                    onClick={() => toggleStrategy(strategy.id, !active)}
                    className="text-[9px] uppercase tracking-widest h-7 px-3"
                  >
                    {active ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
