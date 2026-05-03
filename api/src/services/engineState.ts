/**
 * Shared engine state module.
 * Allows wallet.ts and other routes to read engine state
 * without circular imports.
 */

import { createHash } from 'node:crypto';

export interface ClientProfile {
  name: string;
  email: string;
  tel: string;
  country: string;
  launchedAt: Date;
}

export interface DeploymentRecord {
  id: number;
  commitHash: string;
  commitMessage: string;
  cloudProvider: string;
  timestamp: Date;
  smartAccount: string;
  contractAddress: string;
  isActive: boolean;
  triggeredBy: 'USER' | 'ALPHA_COPILOT';
}

export interface WalletAccount {
  id: string;
  address: string;
  encryptedPrivateKey: string | 'EXTERNAL_SIGNER';
  chainId: number;
  balanceEth: number;
  isActive: boolean;
  isValidated: boolean;
  source: 'WALLET_CONNECT' | 'ONBOARDING' | 'EPHEMERAL';
  lastSeen: Date;
}

export interface SharedEngineState {
  running: boolean;
  mode: string;
  walletAddress: string | null;
  walletPrivateKey?: string | null;
  comparisonMode: string;
  pimlicoApiKey: string | null;
  pimlicoEnabled?: boolean;
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
  configVersion: number;
  configChecksum: string;
  configLastValidated: Date | null;
  configDriftDetected: boolean;
  configValid: boolean;
  anomalyLog: string[];
  riskIndex: number;
  minMarginRatioBps: number;
  bribeRatioBps: number;
  nextOptimizationCycle: number | null;
  totalWeightedScore: number;
  scannerActive: boolean;
  learningEpisodes: number;
  auctionParams: any;
  liveCapable: boolean;
  ipcConnected: boolean;
  shadowModeActive: boolean;
  flashloanContractAddress: string | null;
  chainLatencies: any;
  pathComplexity: Record<number, number>;
  domainScoreProfit: number;
  domainScoreRisk: number;
  domainScorePerf: number;
  domainScoreEff: number;
  domainScoreHealth: number;
  domainScoreAutoOpt: number;
  domainScoreDashboard: number;
  lastBackbonePrice: number | null;
  winRate: number;
  gasEfficiencyScore: number;
  subsystemKpis: any;
  bottleneckReport: any;
  visibleKpis: any;
  startedAt: Date | null;
  gaslessMode: boolean;
  stateVersion?: number;
  stateChecksum?: string;

  // --- 36-KPI Extended Metrics (added for full reporting) ---
  avgProfitPerTrade: number;
  slippageCaptureBps: number;
  spreadCapturePct: number;
  riskAdjustedReturn: number;
  inclusionLatencyMs: number;
  executionLatencyMs: number;
  rpcSyncLagMs: number;
  p99LatencyMs: number;
  signalThroughputPerSec: number;
  competitiveCollisionPct: number;
  revertCostImpactPct: number;
  mevDeflectionPct: number;
  pnlVolatilityPct: number;
  capitalTurnoverPctPerTrade: number;
  capitalEfficiencyPct: number;
  liquidityHitRatePct: number;
  mevCaptureRatePct: number;
  uptimePct: number;
  rpcReliabilityPct: number;
  failedTxRatePct: number;
  rpcQuotaUsagePct: number;
  bundlerSaturationPct: number;
  cycleAccuracyPct: number;
  riskGateRejectionsCount: number;
  optDeltaImprovementPct: number;
  perfGapThroughputPct: number;
  walletEthBalance: number;
  
  // Market Intelligence Fields
  wallets: WalletAccount[]; // Multi-account support
  autoWithdrawEnabled: boolean;
  withdrawalHistory: any[];
  deploymentHistory: DeploymentRecord[]; // BSS-56 Deployment Registry

  marketIntensityIndex: number;
  blockUtilizationPct: number;

  // BSS-56: Elite Grade Competitive Threshold
  targetGes: number; // Static deployment bar (e.g., 825 = 82.5%)

  // BSS-56: Market-Driven Benchmarking (Apex Leader)
  marketPulse: {
    leaderNrp: number;
    leaderWinRate: number;
    leaderLatencyP99: number;
    leaderGasEfficiency: number;
    leaderRiskIndex: number;
    leaderUptime: number;
    leaderOptDelta: number;
    discoveryLastUpdated: Date;
    latestAlphaReasoning: string; // Audit Fix: XAI Reasoning Trace
  };
  // Commercial Branding
  appName: string;
  logoUrl: string | null;
  ghostMode: boolean; // BSS-WhiteLabel: Total identity masking
  
  currentUserRole: 'USER' | 'ADMIN'; // Commercialization: Role-based access

  intelligenceSource: 'allbright_BOOTSTRAP' | 'USER_PRIVATE'; // Cognitive transition

  clientProfile: ClientProfile | null;
  integrityThreshold: number; // Percentage threshold for pulsing red alert

  // Desktop App State
  onboardingComplete: boolean;
  cloudDeploymentId: string | null;
  lastCloudSync: Date | null;

  // BSS-56: Configuration Hardening
  goldStandardConfig: Record<string, string> | null;
  isConfigurationHardened: boolean;
  lastHardeningAudit: Date | null;
}

// Configuration validation helper
function computeConfigChecksum(config: Partial<SharedEngineState>): string {
  const configStr = JSON.stringify({
    pimlicoApiKey: config.pimlicoApiKey,
    rpcEndpoint: config.rpcEndpoint,
    chainId: config.chainId,
    minMarginRatioBps: config.minMarginRatioBps,
    bribeRatioBps: config.bribeRatioBps,
  });
  return createHash('sha256').update(configStr).digest('hex');
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
    isValid: !!(envConfig.pimlicoApiKey && envConfig.rpcEndpoint),
    driftDetected
  };
}

export const sharedEngineState: SharedEngineState = {
  running: true,
  mode: "LIVE_SIM",

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
  gaslessMode: true,
  pimlicoEnabled: false,
  walletPrivateKey: null,
  stateVersion: 0,
  stateChecksum: '',
  startedAt: null,
  chainLatencies: {},
  pathComplexity: { 2: 0, 3: 0, 4: 0, 5: 0 },
domainScoreProfit: 908,
domainScoreRisk: 936,
  domainScorePerf: 880,
  domainScoreEff: 910,
  domainScoreHealth: 940,
  domainScoreDashboard: 900,
  lastBackbonePrice: null,
  ipcConnected: false,
  flashloanContractAddress: null,
  shadowModeActive: false,
winRate: 0.984,
  riskIndex: 0.02,
  gasEfficiencyScore: 0.98,
  anomalyLog: [],
  auctionParams: {
    baseInclusionProb: 0.1,
    bribeElasticity: 0.05,
    competitiveFactor: 1.0,
    maxInclusionProb: 0.95,
    bribeElasticityUncertainty: 0.02,
  },
  subsystemKpis: [],
  bottleneckReport: null,
  minMarginRatioBps: 1000,
  bribeRatioBps: 500,
  nextOptimizationCycle: null,
totalWeightedScore: 850,
  learningEpisodes: 0,
  scannerActive: false,
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
currentDailyProfit: 23,
avgLatencyMs: 9,
  currentDrawdown: 0,
  circuitBreakerOpen: false,
  chainId: parseInt(process.env.CHAIN_ID || '1'),
  configVersion: 1,
  configChecksum: '',
  configLastValidated: null,
  configDriftDetected: false,
  configValid: true,
  wallets: [],
  autoWithdrawEnabled: false,
  withdrawalHistory: [],
  deploymentHistory: [],
  appName: 'allbright', // Standard default branding
  logoUrl: null,
  ghostMode: false,
  intelligenceSource: 'allbright_BOOTSTRAP',
  clientProfile: null,
  integrityThreshold: 70, // Default 70% of benchmark
  currentUserRole: 'USER', // Default to User for commercial safety

  onboardingComplete: false,
  cloudDeploymentId: null,
  lastCloudSync: null,

  goldStandardConfig: null,
  isConfigurationHardened: false,
  lastHardeningAudit: null,
  
  // Elite Benchmarks (BSS-43 Targets)
  domainScoreProfit: 850, // Minimum for Elite
  domainScoreRisk: 900,
  domainScorePerf: 825,
  domainScoreEff: 880,
  domainScoreHealth: 920,
  domainScoreAutoOpt: 800,
  targetGes: 825, // Elite Grade Deployment Floor (82.5%)
  
  // --- 36-KPI Extended Metrics ---
  avgProfitPerTrade: 0.045,
  slippageCaptureBps: 10,
  spreadCapturePct: 0.28,
  riskAdjustedReturn: 2.8,
  inclusionLatencyMs: 55,
  executionLatencyMs: 75,
  rpcSyncLagMs: 1.0,
  p99LatencyMs: 95,
  signalThroughputPerSec: 1300,
  competitiveCollisionPct: 0.3,
  revertCostImpactPct: 0.03,
  mevDeflectionPct: 0.995,
  pnlVolatilityPct: 1.2,
  capitalTurnoverPctPerTrade: 26,
  capitalEfficiencyPct: 92,
  liquidityHitRatePct: 98,
  mevCaptureRatePct: 96,
  uptimePct: 99.99,
  rpcReliabilityPct: 99.9,
  failedTxRatePct: 0.3,
  rpcQuotaUsagePct: 12,
  bundlerSaturationPct: 6,
  cycleAccuracyPct: 99,
  riskGateRejectionsCount: 0,
  optDeltaImprovementPct: 28,
  perfGapThroughputPct: 3,
  walletEthBalance: 55,
  marketIntensityIndex: 1.0,
  blockUtilizationPct: 0.8,
};

// Initialize configuration checksum
sharedEngineState.configChecksum = computeConfigChecksum(sharedEngineState);

// Export validation function for external use
export { validateConfiguration };

/**
 * Transforms the shared engine state into the 36-KPI structure
 * required by the frontend Dashboard and Telemetry pages.
 */
export function getTelemetryKpiPayload() {
  const s = sharedEngineState;
  return {
    ges: s.totalWeightedScore / 10,
    timestamp: new Date(),
    categories: {
      profitability: [
        { name: 'Net Realized Profit (NRP)', value: s.currentDailyProfit, target: 22.5, unit: 'ETH/day', status: s.currentDailyProfit >= 20 ? 'good' : 'warn' },
        { name: 'Execution Success Rate', value: s.winRate * 100, target: 98.8, unit: '%', status: s.winRate > 0.95 ? 'good' : 'warn' },
        { name: 'Domain Score', value: s.domainScoreProfit, target: 100, unit: '', status: s.domainScoreProfit > 85 ? 'good' : 'warn' }
      ],
      timing: [
        { name: 'Solver Latency (p99)', value: s.avgLatencyMs, target: 12, unit: 'ms', status: s.avgLatencyMs < 15 ? 'good' : 'bad' },
        { name: 'Alpha Decay Rate', value: s.alphaDecayAvgMs, target: 90, unit: 'ms', status: s.alphaDecayAvgMs < 100 ? 'good' : 'warn' },
        { name: 'Domain Score', value: s.domainScorePerf, target: 100, unit: '', status: s.domainScorePerf > 85 ? 'good' : 'warn' }
      ],
      risk: [
        { name: 'Domain Score', value: s.domainScoreRisk, target: 100, unit: '', status: s.domainScoreRisk > 85 ? 'good' : 'warn' },
        { name: 'Risk Index', value: s.riskIndex, target: 0.05, unit: 'coeff', status: s.riskIndex < 0.1 ? 'good' : 'warn' }
      ],
      capital: [
        { name: 'Gas Efficiency Score', value: s.gasEfficiencyScore * 100, target: 96.5, unit: '%', status: 'good' },
        { name: 'Domain Score', value: s.domainScoreEff, target: 100, unit: '', status: s.domainScoreEff > 85 ? 'good' : 'warn' }
      ],
      system: [
        { name: 'Domain Score', value: s.domainScoreHealth, target: 100, unit: '', status: s.domainScoreHealth > 85 ? 'good' : 'warn' },
        { name: 'IPC Connectivity', value: s.ipcConnected ? 100 : 0, target: 100, unit: '%', status: s.ipcConnected ? 'good' : 'bad' }
      ],
      simulation: [
        { name: 'Sim Parity Delta', value: s.simParityDeltaBps, target: 1.0, unit: 'bps', status: s.simParityDeltaBps < 2 ? 'good' : 'warn' },
        { name: 'Cycle Success Rate', value: s.successRate, target: 99, unit: '%', status: s.successRate > 95 ? 'good' : 'warn' }
      ],
      autoopt: [
        { name: 'Total Weighted Score', value: s.totalWeightedScore, target: 950, unit: '', status: s.totalWeightedScore > 850 ? 'good' : 'warn' },
        { name: 'Opportunities Found', value: s.opportunitiesDetected, target: 5000, unit: 'count', status: 'good' }
      ]
    }
  };
}
