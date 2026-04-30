export interface CategoryKPIs {
  profit: number;
  timing: number;
  risk: number;
  capital: number;
  gas: number;
  scalability: number;
  compliance: number;
}

export interface GESState {
  categories: CategoryKPIs;
  ges: number;
  timestamp: Date;
}

export const CATEGORIES = [
  { id: 'profit', weight: 0.25, label: 'Profit' },
  { id: 'timing', weight: 0.20, label: 'Timing' },
  { id: 'risk', weight: 0.15, label: 'Risk' },
  { id: 'capital', weight: 0.15, label: 'Capital' },
  { id: 'gas', weight: 0.10, label: 'Gas' },
  { id: 'scalability', weight: 0.10, label: 'Scalability' },
  { id: 'compliance', weight: 0.05, label: 'Compliance' },
] as const;

export interface KPI {
  name: string;
  value: number | string;
  target: number | string;
  unit: string;
  status: 'good' | 'warn' | 'bad';
}

export interface FullKPIState {
  categories: Partial<Record<string, KPI[]>>;
  ges: number;
  timestamp: Date;
}

export const THIRTY_SIX_KPIS = [
  {
    id: 'profitability',
    label: 'Profitability',
    weight: 0.25,
    kpis: [
      { name: 'Net Realized Profit (NRP)', value: 14.77, target: 22.5, unit: 'ETH/day', status: 'warn' },
      { name: 'Avg Profit per Trade', value: 0.02, target: 0.05, unit: 'ETH', status: 'warn' },
      { name: 'Execution Success Rate', value: 95.0, target: 98.8, unit: '%', status: 'good' },
      { name: 'Slippage Capture', value: 50, target: 12, unit: 'bps', status: 'bad' },
      { name: 'Spread Capture', value: 0.15, target: 0.25, unit: '%', status: 'warn' },
      { name: 'Risk-Adjusted Return', value: 1.45, target: 2.65, unit: 'ratio', status: 'warn' },
    ]
  },
  {
    id: 'timing',
    label: 'Timing/Performance',
    weight: 0.20,
    kpis: [
      { name: 'Inclusion Latency (Total)', value: 142.0, target: 65.0, unit: 'ms', status: 'bad' },
      { name: 'Solver Latency (p99)', value: 38.5, target: 12.0, unit: 'ms', status: 'bad' },
      { name: 'Alpha Decay Rate', value: 85.2, target: 90, unit: 'ms', status: 'good' },
      { name: 'Execution Latency', value: 120, target: 80, unit: 'ms', status: 'warn' },
      { name: 'RPC Sync Lag', value: 12.5, target: 1.5, unit: 'ms', status: 'bad' },
      { name: 'p99 Latency', value: 150, target: 100, unit: 'ms', status: 'bad' },
      { name: 'Signal Throughput', value: 500, target: 1200, unit: 'msg/s', status: 'warn' },
    ]
  },
  {
    id: 'risk',
    label: 'Risk',
    weight: 0.15,
    kpis: [
      { name: 'Competitive Collision Rate', value: 4.0, target: 0.8, unit: '%', status: 'bad' },
      { name: 'Revert Cost Impact', value: 0.7, target: 0.05, unit: '%', status: 'bad' },
      { name: 'MEV Deflection Rate', value: 99.2, target: 99.9, unit: '%', status: 'good' },
      { name: 'Daily Drawdown Limit', value: 1.0, target: 0.4, unit: 'ETH', status: 'warn' },
      { name: 'P&L Volatility', value: 2.5, target: 1.0, unit: '%', status: 'bad' },
    ]
  },
  {
    id: 'capital',
    label: 'Capital/Efficiency',
    weight: 0.15,
    kpis: [
      { name: 'Capital Turnover Speed', value: 10, target: 25, unit: '%/trade', status: 'warn' },
      { name: 'Capital Efficiency', value: 75, target: 90, unit: '%', status: 'warn' },
      { name: 'Liquidity Hit Rate', value: 88.0, target: 97.5, unit: '%', status: 'good' },
      { name: 'Gas Efficiency Ratio', value: 88.0, target: 96.5, unit: '%', status: 'good' },
      { name: 'MEV Capture Rate', value: 85, target: 95, unit: '%', status: 'warn' },
    ]
  },
  {
    id: 'system',
    label: 'System Health',
    weight: 0.10,
    kpis: [
      { name: 'Uptime', value: 99.5, target: 99.99, unit: '%', status: 'good' },
      { name: 'RPC Reliability', value: 98, target: 99.9, unit: '%', status: 'good' },
      { name: 'Failed TX Rate', value: 2.0, target: 0.5, unit: '%', status: 'warn' },
      { name: 'RPC Quota Usage', value: 42.0, target: 15.0, unit: '%', status: 'bad' },
      { name: 'Bundler Saturation', value: 15.0, target: 8.0, unit: '%', status: 'warn' },
    ]
  },
  {
    id: 'simulation',
    label: 'Simulation/Validation',
    weight: 0.10,
    kpis: [
      { name: 'Sim Parity Delta', value: 2.5, target: 1.0, unit: 'bps', status: 'warn' },
      { name: 'Cycle Accuracy', value: 92, target: 98, unit: '%', status: 'good' },
      { name: 'Sim Success Rate', value: 94, target: 99, unit: '%', status: 'warn' },
      { name: 'Risk Gate Rejections', value: 5, target: 1, unit: 'count', status: 'bad' },
    ]
  },
  {
    id: 'autoopt',
    label: 'AutoOpt/Dashboard',
    weight: 0.05,
    kpis: [
      { name: 'Opt Delta Improvement', value: 12, target: 25, unit: '%', status: 'warn' },
      { name: 'Perf Gap Throughput', value: 20, target: 5, unit: '%', status: 'bad' },
      { name: 'Wallet ETH Balance', value: 10.5, target: 50, unit: 'ETH', status: 'warn' },
      { name: 'Opportunities Found', value: 2500, target: 5000, unit: 'count', status: 'warn' },
    ]
  }
];

