import { sharedEngineState } from './engineState';

// Mock specialist orchestrator for deployment readiness
export const specialists = [
  { 
    name: 'ProfitabilitySpecialist', 
    category: 'Profitability', 
    tuneKpis: async (data) => ({ 
      nrp_target: sharedEngineState.currentDailyProfit,
      win_rate: sharedEngineState.winRate * 100
    }) 
  },
  { 
    name: 'PerformanceSpecialist', 
    category: 'Performance', 
    tuneKpis: async (data) => ({ 
      latency: sharedEngineState.avgLatencyMs,
      throughput: sharedEngineState.msgThroughputCount 
    }) 
  },
  { name: 'RustSpecialist', category: 'RustCompile', tuneKpis: async (data) => ({ compile: 'pass' }) },
  { 
    name: 'RiskSpecialist', 
    category: 'Risk', 
    tuneKpis: async (data) => ({ 
      risk_index: sharedEngineState.riskIndex,
      drawdown: sharedEngineState.currentDrawdown 
    }) 
  },
  { 
    name: 'SystemHealthSpecialist', 
    category: 'System Health', 
    tuneKpis: async (data) => ({ 
      uptime: sharedEngineState.startedAt ? (Date.now() - sharedEngineState.startedAt.getTime()) / 1000 : 0, 
      ipc_connected: sharedEngineState.ipcConnected 
    }) 
  },
  { 
    name: 'AutoOptimizationSpecialist', 
    category: 'Auto-Optimization', 
    tuneKpis: async (data) => ({ 
      current_ges: sharedEngineState.totalWeightedScore,
      anomaly_count: sharedEngineState.anomalyLog.length
    }) 
  },
];

export const kpiToSpecialistMapping = {
  nrp: 'Profitability',
  latency: 'Performance',
  risk: 'Risk',
  uptime: 'System Health',
  optimization: 'Auto-Optimization',
};

export const specialistByCategory = {
  Profitability: { name: 'ProfitabilitySpecialist' },
  Performance: { name: 'PerformanceSpecialist' },
  RustCompile: { name: 'RustSpecialist' },
  'System Health': { name: 'SystemHealthSpecialist' },
  'Auto-Optimization': { name: 'AutoOptimizationSpecialist' },
};

specialists.forEach(s => {
  s.status = async () => ({ status: 'ready', specialist: s.name });
});
