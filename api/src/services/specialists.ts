import { sharedEngineState } from './engineState';
import { MempoolIntelligenceService } from './mempoolIntelligence';
import { validateConfiguration } from './engineState';

export interface Specialist {
  name: string;
  category: string;
  tuneKpis(data: any): Promise<Record<string, any>>;
  status(): Promise<{ status: string; specialist: string }>;
}

export interface GateTriggerResult {
  shouldTriggerGate: boolean;
  gateId?: string;
  triggerReason?: string;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendedActions?: string[];
}

export function logAnomaly(tag: string, message: string): void {
  console.log(`[${tag}] ${message}`);
}

// Mock specialist orchestrator for deployment readiness
export const specialists: Specialist[] = [
  {
    name: 'ProfitabilitySpecialist',
    category: 'Profitability',
    tuneKpis: async (data: any) => ({
      nrp_target: sharedEngineState.currentDailyProfit,
      win_rate: sharedEngineState.winRate * 100
    }),
    status: async () => ({ status: 'ready', specialist: 'ProfitabilitySpecialist' })
  },
  {
    name: 'PerformanceSpecialist',
    category: 'Performance',
    tuneKpis: async (data: any) => ({
      latency: sharedEngineState.avgLatencyMs,
      throughput: sharedEngineState.msgThroughputCount
    }),
    status: async () => ({ status: 'ready', specialist: 'PerformanceSpecialist' })
  },
  {
    name: 'RustSpecialist',
    category: 'RustCompile',
    tuneKpis: async (data: any) => ({ compile: 'pass' }),
    status: async () => ({ status: 'ready', specialist: 'RustSpecialist' })
  },
  {
    name: 'RiskSpecialist',
    category: 'Risk',
    tuneKpis: async (data: any) => ({
      risk_index: sharedEngineState.riskIndex,
      drawdown: sharedEngineState.currentDrawdown
    }),
    status: async () => ({ status: 'ready', specialist: 'RiskSpecialist' })
  },
  {
    name: 'SystemHealthSpecialist',
    category: 'System Health',
    tuneKpis: async (data: any) => ({
      uptime: sharedEngineState.startedAt ? (Date.now() - sharedEngineState.startedAt.getTime()) / 1000 : 0,
      ipc_connected: sharedEngineState.ipcConnected
    }),
    status: async () => ({ status: 'ready', specialist: 'SystemHealthSpecialist' })
  },
  {
    name: 'AutoOptimizationSpecialist',
    category: 'Auto-Optimization',
    tuneKpis: async (data: any) => ({
      current_ges: sharedEngineState.totalWeightedScore,
      anomaly_count: sharedEngineState.anomalyLog.length
    }),
    status: async () => ({ status: 'ready', specialist: 'AutoOptimizationSpecialist' })
  },
  {
    name: 'BribeOptimizationSpecialist',
    category: 'Bribe-Optimization',
    tuneKpis: async () => {
      const sigma = sharedEngineState.auctionParams?.bribeElasticityUncertainty || 0.02;
      const mempool = await MempoolIntelligenceService.analyzeMempoolState();
      
      return {
        tuned: true,
        bayesian_sigma: sigma,
        exploration_active: sigma > 0.03,
        market_intensity: mempool.bribeCompetitionIndex,
        market_condition: mempool.marketCondition,
        recommended_min_bribe: mempool.recommendedMinBribe,
        gas_utilization: mempool.blockUtilization,
        auctionParams: sharedEngineState.auctionParams
      };
    },
    status: async () => ({ status: 'ready', specialist: 'BribeOptimizationSpecialist' })
  },
  {
    name: 'CloudHealthSpecialist',
    category: 'Cloud-Health',
    tuneKpis: async () => {
      const configValidation = validateConfiguration();
      const lastSyncAgeMin = sharedEngineState.lastCloudSync ? (Date.now() - sharedEngineState.lastCloudSync.getTime()) / 60000 : Infinity;

      return {
        tuned: true,
        is_configuration_hardened: sharedEngineState.isConfigurationHardened,
        config_drift_detected: configValidation.driftDetected,
        last_cloud_sync_age_min: lastSyncAgeMin,
        cloud_deployment_id: sharedEngineState.cloudDeploymentId,
        cloud_sync_status: sharedEngineState.lastCloudSync ? 'synced' : 'not_synced'
      };
    },
    status: async () => ({ status: 'ready', specialist: 'CloudHealthSpecialist' })
  },
];

export const kpiToSpecialistMapping = {
  nrp: 'Profitability',
  latency: 'Performance',
  risk: 'Risk',
  uptime: 'System Health',
  optimization: 'Auto-Optimization',
  bribe_sigma: 'Bribe-Optimization',
  cloud_health: 'Cloud-Health',
};

export const specialistByCategory = {
  Profitability: { name: 'ProfitabilitySpecialist' },
  Performance: { name: 'PerformanceSpecialist' },
  RustCompile: { name: 'RustSpecialist' },
  'System Health': { name: 'SystemHealthSpecialist' },
  'Auto-Optimization': { name: 'AutoOptimizationSpecialist' },
  'Bribe-Optimization': { name: 'BribeOptimizationSpecialist' },
  'Cloud-Health': { name: 'CloudHealthSpecialist' },
};
