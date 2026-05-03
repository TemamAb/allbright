import { useGetAutoOptimizerStatus } from "@workspace/api-client-react";

export default function AutoOptimizerPage() {
  const { data: status } = useGetAutoOptimizerStatus({
    query: { refetchInterval: 5000, queryKey: ["auto-optimizer-status"] }
  });

  if (!status) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4">Loading Auto-Optimizer Status...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-primary mb-6">Auto-Optimizer Dashboard</h1>
      <p className="text-muted-foreground mb-8">Monitoring 27 KPI optimization with BSS-36 Auto-Optimization Subsystem</p>
      
      <div className="glass-panel border border-border rounded p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Optimization Status</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Status:</span>
            <span className={`font-semibold text-${status.isActive ? 'emerald-400' : 'red-400'}`}>
              {status.isActive ? 'ACTIVE' : 'INACTIVE'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Last Optimization:</span>
            <span className="font-mono">{status.lastOptimization || 'Never'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Next Optimization:</span>
            <span className="font-mono">{status.nextOptimization || 'Scheduled'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Cycles/Hour:</span>
            <span className="font-mono">{status.optimizationCyclesPerHour}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Improvement Delta (bps):</span>
            <span className={`font-semibold text-${status.improvementDeltaBps >= 0 ? 'emerald-400' : 'red-400'}`}>
              {status.improvementDeltaBps >= 0 ? `+${status.improvementDeltaBps}` : status.improvementDeltaBps}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Profitability Metrics */}
        <div className="glass-panel border border-border rounded p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-400" /> Profitability
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Daily Profit:</span>
              <span className="font-mono">{status.dailyProfitEth.toFixed(2)} ETH</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Avg Profit/Trade:</span>
              <span className="font-mono">{status.avgProfitPerTradeEth.toFixed(4)} ETH</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Arb Executions/Day:</span>
              <span className="font-mono">{status.arbExecutionCount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="glass-panel border border-border rounded p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Zap size={16} className="text-primary" /> Performance
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Solver Latency:</span>
              <span className="font-mono">{status.solverLatencyP99Ms}ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Throughput:</span>
              <span className="font-mono">{status.throughputMsgS.toLocaleString()} msg/s</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Success Rate:</span>
              <span className="font-mono">{status.successRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Risk Metrics */}
        <div className="glass-panel border border-border rounded p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Shield size={16} className="text-primary" /> Risk Management
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Loss Rate:</span>
              <span className="font-mono">{status.lossRate.toFixed(2)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Drawdown Limit:</span>
              <span className="font-mono">{status.drawdownLimitEth.toFixed(2)} ETH</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Competitive Collisions:</span>
              <span className="font-mono">{status.competitiveCollisionRate.toFixed(2)}%</span>
            </div>
          </div>
        </div>

        {/* Efficiency Metrics */}
        <div className="glass-panel border border-border rounded p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Activity size={16} className="text-primary" /> Efficiency
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Gas Efficiency:</span>
              <span className="font-mono">{status.gasEfficiency.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Liquidity Hit Rate:</span>
              <span className="font-mono">{status.liquidityHitRate.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Slippage Capture:</span>
              <span className="font-mono">{status.slippageCaptureBps} bps</span>
            </div>
          </div>
        </div>

        {/* System Health Metrics */}
        <div className="glass-panel border border-border rounded p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Globe size={16} className="text-primary" /> System Health
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Uptime:</span>
              <span className="font-mono">{status.uptimePercent.toFixed(2)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Cycle Accuracy:</span>
              <span className="font-mono">{status.cycleAccuracyPercent.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>P&L Volatility:</span>
              <span className="font-mono">{status.pnlVolatilityEth.toFixed(4)} ETH</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Import required icons
import { TrendingUp, Zap, Shield, Activity, Globe } from "lucide-react";
