import type { KPI, KPICategory } from '@/types/kpi';

/**
 * 36 KPIs organized by category for GES monitoring
 */
export const THIRTY_SIX_KPIS: KPICategory[] = [
  {
    id: 'efficiency',
    label: 'Efficiency',
    weight: 0.25,
    kpis: [
      { id: 'gas-efficiency', name: 'Gas Efficiency', value: 0, unit: 'gas/tx', designTarget: 21000, comparison: 'lt', status: 'good' },
      { id: 'execution-speed', name: 'Execution Speed', value: 0, unit: 'ms', designTarget: 500, comparison: 'lt', status: 'good' },
      { id: 'slippage-optimization', name: 'Slippage Optimization', value: 0, unit: 'bps', designTarget: 5, comparison: 'lt', status: 'good' },
      { id: 'retry-efficiency', name: 'Retry Efficiency', value: 0, unit: '%', designTarget: 1, comparison: 'lt', status: 'good' },
      { id: 'mev-protection-effectiveness', name: 'MEV Protection', value: 0, unit: '%', designTarget: 99, comparison: 'gt', status: 'good' },
      { id: 'liquidity-utilization', name: 'Liquidity Utilization', value: 0, unit: '%', designTarget: 80, comparison: 'gt', status: 'good' },
    ],
  },
  {
    id: 'performance',
    label: 'Performance',
    weight: 0.30,
    kpis: [
      { id: 'blocks-scanned', name: 'Blocks Scanned', value: 0, unit: 'blocks', designTarget: 1000000, comparison: 'gt', status: 'good' },
      { id: 'opportunities-detected', name: 'Opportunities Detected', value: 0, unit: 'count', designTarget: 1000, comparison: 'gt', status: 'good' },
      { id: 'opportunities-executed', name: 'Opportunities Executed', value: 0, unit: 'count', designTarget: 100, comparison: 'gt', status: 'good' },
      { id: 'profit-generated', name: 'Profit Generated', value: 0, unit: 'USD', designTarget: 10000, comparison: 'gt', status: 'good' },
      { id: 'success-rate', name: 'Success Rate', value: 0, unit: '%', designTarget: 95, comparison: 'gt', status: 'good' },
      { id: 'uptime', name: 'Uptime', value: 0, unit: '%', designTarget: 99.9, comparison: 'gt', status: 'good' },
    ],
  },
  {
    id: 'health',
    label: 'Health',
    weight: 0.25,
    kpis: [
      { id: 'error-rate', name: 'Error Rate', value: 0, unit: '%', designTarget: 1, comparison: 'lt', status: 'good' },
      { id: 'health-checks-passed', name: 'Health Checks Passed', value: 0, unit: 'count', designTarget: 10, comparison: 'gt', status: 'good' },
      { id: 'memory-usage', name: 'Memory Usage', value: 0, unit: 'MB', designTarget: 512, comparison: 'lt', status: 'good' },
      { id: 'cpu-usage', name: 'CPU Usage', value: 0, unit: '%', designTarget: 70, comparison: 'lt', status: 'good' },
      { id: 'disk-usage', name: 'Disk Usage', value: 0, unit: 'GB', designTarget: 10, comparison: 'lt', status: 'good' },
      { id: 'network-latency', name: 'Network Latency', value: 0, unit: 'ms', designTarget: 100, comparison: 'lt', status: 'good' },
    ],
  },
  {
    id: 'auto-optimization',
    label: 'Auto-Optimization',
    weight: 0.20,
    kpis: [
      { id: 'auto-optimizations-applied', name: 'Auto-Optimizations Applied', value: 0, unit: 'count', designTarget: 50, comparison: 'gt', status: 'good' },
      { id: 'optimization-impact', name: 'Optimization Impact', value: 0, unit: '%', designTarget: 20, comparison: 'gt', status: 'good' },
      { id: 'parameter-adjustments', name: 'Parameter Adjustments', value: 0, unit: 'count', designTarget: 100, comparison: 'gt', status: 'good' },
      { id: 'model-improvement', name: 'Model Improvement', value: 0, unit: '%', designTarget: 10, comparison: 'positive_trajectory', status: 'good' },
      { id: 'adaptation-speed', name: 'Adaptation Speed', value: 0, unit: 'iterations', designTarget: 5, comparison: 'lt', status: 'good' },
      { id: 'convergence-rate', name: 'Convergence Rate', value: 0, unit: '%', designTarget: 95, comparison: 'gt', status: 'good' },
    ],
  },
];
