/**
 * Shared engine state module.
 * Allows wallet.ts and other routes to read engine state
 * without circular imports.
 */

export interface SharedEngineState {
  running: boolean;
  mode: "SHADOW" | "LIVE" | "STOPPED";
  walletAddress: string | null;
  comparisonMode: "NONE" | "SIM_VS_LIVE" | "SIM_VS_BENCHMARK" | "ALL";
  visibleKpis: string[]; // IDs of KPIs to monitor (e.g. '1.1', '2.4')
  liveCapable: boolean;
  pimlicoEnabled: boolean;
  gaslessMode: boolean;
  startedAt: Date | null;
  chainLatencies: Record<number, number>;
  pathComplexity: Record<number, number>;
  lastBackbonePrice: number | null;
  ipcConnected: boolean;
  flashloanContractAddress: string | null;
  shadowModeActive: boolean;
  // Advanced KPI Analytics for Phase 2
  winRate: number;
  riskIndex: number;
  gasEfficiencyScore: number;
  anomalyLog: string[];
  auctionParams: {
    baseInclusionProb: number;
    bribeElasticity: number;
    competitiveFactor: number;
    maxInclusionProb: number;
  };
  subsystemKpis: any[];
  bottleneckReport: any;
  minMarginRatioBps: number;
  bribeRatioBps: number;
  totalWeightedScore: number;
  // Runtime fields
  scannerActive: boolean;
  pimlicoApiKey: string | null;
  rpcEndpoint: string | null;
  opportunitiesDetected: number;
  opportunitiesExecuted: number;
  scanInFlight: boolean;
  skippedScanCycles: number;
  lastScanStartedAt: Date | null;
  lastScanCompletedAt: Date | null;
  circuitBreaker: any;
  alphaDecayAvgMs: number;
  simParityDeltaBps: number;
  successRate: number;
  msgThroughputCount: number;
  currentDailyProfit: number;
  avgLatencyMs: number;
  currentDrawdown: number;
  circuitBreakerOpen: boolean;
  chainId: number;
  // Configuration integrity fields
  configVersion: number;
  configChecksum: string;
  configLastValidated: Date | null;
  configDriftDetected: boolean;
}

// Configuration validation helper
function computeConfigChecksum(config: Partial<SharedEngineState>): string {
  const crypto = require('crypto');
  const configStr = JSON.stringify({
    pimlicoApiKey: config.pimlicoApiKey,
    rpcEndpoint: config.rpcEndpoint,
    chainId: config.chainId,
    minMarginRatioBps: config.minMarginRatioBps,
    bribeRatioBps: config.bribeRatioBps,
  });
  return crypto.createHash('sha256').update(configStr).digest('hex');
}

// Validate configuration against environment variables
function validateConfiguration(): { isValid: boolean; driftDetected: boolean } {
  const envConfig = {
    pimlicoApiKey: process.env.PIMLICO_API_KEY,
    rpcEndpoint: process.env.RPC_ENDPOINT,
    chainId: parseInt(process.env.CHAIN_ID || '1'),
    minMarginRatioBps: parseInt(process.env.MIN_MARGIN_RATIO_BPS || '1000'),
    bribeRatioBps: parseInt(process.env.BRIBE_RATIO_BPS || '500'),
  };

  const currentChecksum = computeConfigChecksum(sharedEngineState);
  const envChecksum = computeConfigChecksum(envConfig);

  const driftDetected = currentChecksum !== envChecksum && sharedEngineState.configChecksum !== '';

  return {
    isValid: envConfig.pimlicoApiKey && envConfig.rpcEndpoint,
    driftDetected
  };
}

export const sharedEngineState: SharedEngineState = {
  running: false,
  mode: "STOPPED",
  walletAddress: null,
  comparisonMode: "ALL",
  visibleKpis: [
    '1.1', '1.2', '1.3', '1.4', '1.5', '1.6',
    '2.1', '2.2', '2.3', '2.4', '2.5', '2.6',
    '3.1', '3.2', '3.3', '3.4', '3.5', '3.6',
    '4.1', '4.2', '4.3', '4.4', '4.5', '4.6',
    '5.1', '5.2', '5.3', '5.4', '5.5', '5.6',
    '6.1', '6.2', '6.3',
    '7.1', '7.2', '7.3'
  ],
  liveCapable: false,
  pimlicoEnabled: false,
  gaslessMode: true,
  startedAt: null,
  chainLatencies: {},
  pathComplexity: { 2: 0, 3: 0, 4: 0, 5: 0 },
  lastBackbonePrice: null,
  ipcConnected: false,
  flashloanContractAddress: null,
  shadowModeActive: false,
  winRate: 0.94,
  riskIndex: 0.02,
  gasEfficiencyScore: 0.98,
  anomalyLog: [],
  auctionParams: {
    baseInclusionProb: 0.1,
    bribeElasticity: 0.05,
    competitiveFactor: 1.0,
    maxInclusionProb: 0.95,
  },
  subsystemKpis: [],
  bottleneckReport: null,
  minMarginRatioBps: 1000,
  bribeRatioBps: 500,
  totalWeightedScore: 0,
  scannerActive: false,
  // Configuration integrity initialization
  pimlicoApiKey: process.env.PIMLICO_API_KEY || null,
  rpcEndpoint: process.env.RPC_ENDPOINT || null,
  opportunitiesDetected: 0,
  opportunitiesExecuted: 0,
  scanInFlight: false,
  skippedScanCycles: 0,
  lastScanStartedAt: null,
  lastScanCompletedAt: null,
  circuitBreaker: null,
  alphaDecayAvgMs: 0,
  simParityDeltaBps: 0,
  successRate: 0,
  msgThroughputCount: 0,
  currentDailyProfit: 0,
  avgLatencyMs: 0,
  currentDrawdown: 0,
  circuitBreakerOpen: false,
  chainId: parseInt(process.env.CHAIN_ID || '1'),
  configVersion: 1,
  configChecksum: '',
  configLastValidated: null,
  configDriftDetected: false,
};

// Initialize configuration checksum
sharedEngineState.configChecksum = computeConfigChecksum(sharedEngineState);

// Export validation function for external use
export { validateConfiguration };
  pimlicoApiKey: null,
  rpcEndpoint: null,
  opportunitiesDetected: 0,
  opportunitiesExecuted: 0,
  scanInFlight: false,
  skippedScanCycles: 0,
  lastScanStartedAt: null,
  lastScanCompletedAt: null,
  circuitBreaker: undefined,
  alphaDecayAvgMs: 0,
  simParityDeltaBps: 0,
  successRate: 0.95,
  msgThroughputCount: 0,
  currentDailyProfit: 0,
  avgLatencyMs: 0,
  currentDrawdown: 0,
  circuitBreakerOpen: false,
  chainId: 8453,
};
