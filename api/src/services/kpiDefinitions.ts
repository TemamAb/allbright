/**
 * Canonical 36-KPI Matrix Definitions
 * Aligns with ui/src/types/kpi.ts THIRTY_SIX_KPIS
 */
export const THIRTY_SIX_KPIS_CANONICAL = {
  profitability: {
    weight: 0.25,
    kpis: [
      { id: 'nrp', name: 'Net Realized Profit (NRP)', target: 22.5, unit: 'ETH/day', higherIsBetter: true },
      { id: 'avg_profit_per_trade', name: 'Avg Profit per Trade', target: 0.05, unit: 'ETH', higherIsBetter: true },
      { id: 'execution_success_rate', name: 'Execution Success Rate', target: 98.8, unit: '%', higherIsBetter: true },
      { id: 'slippage_capture_bps', name: 'Slippage Capture', target: 12, unit: 'bps', higherIsBetter: false },
      { id: 'spread_capture_pct', name: 'Spread Capture', target: 0.25, unit: '%', higherIsBetter: true },
      { id: 'risk_adjusted_return', name: 'Risk-Adjusted Return', target: 2.65, unit: 'ratio', higherIsBetter: true }
    ]
  },
  timing: {
    weight: 0.20,
    kpis: [
      { id: 'inclusion_latency_ms', name: 'Inclusion Latency (Total)', target: 65, unit: 'ms', higherIsBetter: false },
      { id: 'solver_latency_ms', name: 'Solver Latency (p99)', target: 12, unit: 'ms', higherIsBetter: false },
      { id: 'alpha_decay_ms', name: 'Alpha Decay Rate', target: 90, unit: 'ms', higherIsBetter: false },
      { id: 'execution_latency_ms', name: 'Execution Latency', target: 80, unit: 'ms', higherIsBetter: false },
      { id: 'rpc_sync_lag_ms', name: 'RPC Sync Lag', target: 1.5, unit: 'ms', higherIsBetter: false },
      { id: 'p99_latency_ms', name: 'p99 Latency', target: 100, unit: 'ms', higherIsBetter: false },
      { id: 'signal_throughput', name: 'Signal Throughput', target: 1200, unit: 'msg/s', higherIsBetter: true }
    ]
  },
  risk: {
    weight: 0.15,
    kpis: [
      { id: 'competitive_collision_pct', name: 'Competitive Collision Rate', target: 0.8, unit: '%', higherIsBetter: false },
      { id: 'revert_cost_impact_pct', name: 'Revert Cost Impact', target: 0.05, unit: '%', higherIsBetter: false },
      { id: 'mev_deflection_pct', name: 'MEV Deflection Rate', target: 99.9, unit: '%', higherIsBetter: true },
      { id: 'daily_drawdown_eth', name: 'Daily Drawdown Limit', target: 0.4, unit: 'ETH', higherIsBetter: false },
      { id: 'pnl_volatility_pct', name: 'P&L Volatility', target: 1.0, unit: '%', higherIsBetter: false }
    ]
  },
  capital: {
    weight: 0.15,
    kpis: [
      { id: 'capital_turnover_pct', name: 'Capital Turnover Speed', target: 25, unit: '%/trade', higherIsBetter: true },
      { id: 'capital_efficiency_pct', name: 'Capital Efficiency', target: 90, unit: '%', higherIsBetter: true },
      { id: 'liquidity_hit_rate_pct', name: 'Liquidity Hit Rate', target: 97.5, unit: '%', higherIsBetter: true },
      { id: 'gas_efficiency_ratio_pct', name: 'Gas Efficiency Ratio', target: 96.5, unit: '%', higherIsBetter: true },
      { id: 'mev_capture_rate_pct', name: 'MEV Capture Rate', target: 95, unit: '%', higherIsBetter: true }
    ]
  },
  system: {
    weight: 0.10,
    kpis: [
      { id: 'uptime_pct', name: 'Uptime', target: 99.99, unit: '%', higherIsBetter: true },
      { id: 'rpc_reliability_pct', name: 'RPC Reliability', target: 99.9, unit: '%', higherIsBetter: true },
      { id: 'failed_tx_rate_pct', name: 'Failed TX Rate', target: 0.5, unit: '%', higherIsBetter: false },
      { id: 'rpc_quota_usage_pct', name: 'RPC Quota Usage', target: 15.0, unit: '%', higherIsBetter: false },
      { id: 'bundler_saturation_pct', name: 'Bundler Saturation', target: 8.0, unit: '%', higherIsBetter: false }
    ]
  },
  simulation: {
    weight: 0.10,
    kpis: [
      { id: 'sim_parity_delta_bps', name: 'Sim Parity Delta', target: 1.0, unit: 'bps', higherIsBetter: false },
      { id: 'cycle_accuracy_pct', name: 'Cycle Accuracy', target: 98, unit: '%', higherIsBetter: true },
      { id: 'sim_success_rate_pct', name: 'Sim Success Rate', target: 99, unit: '%', higherIsBetter: true },
      { id: 'risk_gate_rejections', name: 'Risk Gate Rejections', target: 1, unit: 'count', higherIsBetter: false }
    ]
  },
  autoopt: {
    weight: 0.05,
    kpis: [
      { id: 'opt_delta_improvement_pct', name: 'Opt Delta Improvement', target: 25, unit: '%', higherIsBetter: true },
      { id: 'perf_gap_throughput_pct', name: 'Perf Gap Throughput', target: 5, unit: '%', higherIsBetter: false },
      { id: 'wallet_eth_balance', name: 'Wallet ETH Balance', target: 50, unit: 'ETH', higherIsBetter: true },
      { id: 'opportunities_found', name: 'Opportunities Found', target: 5000, unit: 'count', higherIsBetter: true }
    ]
  }
} as const;

export type CategoryId = keyof typeof THIRTY_SIX_KPIS_CANONICAL;
export type KpiId = string;
