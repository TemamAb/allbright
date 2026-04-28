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
