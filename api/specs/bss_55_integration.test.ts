import { preflightCheck } from "../src/services/preflightCheck";
import { debuggingSystem } from "../src/services/debuggingSystem";
import { sharedEngineState } from "../src/services/engineState";

/**
 * BSS-55 Integration Test Suite
 * Validates the Pre-Flight and Debugging systems against simulated failure modes.
 */
describe("BSS-55: Pre-Flight and Debugging System Integration", () => {
  
  beforeEach(() => {
    // Reset sharedEngineState to a perfect "Golden" state before each test
    Object.assign(sharedEngineState, {
      gasPriceGwei: 20,
      activeRpcCount: 5,
      paymasterBalanceEth: 2.0,
      oracleHeartbeat: Date.now(),
      blockedUntil: 0,
      bundlerOnline: true,
      cloudRateLimitRemaining: 1000,
      privateMempoolActive: true,
      nextNonce: 10,
      chainNonce: 10,
      lastRepaymentStatus: true,
      allowanceLeakDetected: false,
      lastSimSuccess: true,
      paymasterLogicVerified: true,
      dryRunSuccessRate: 1.0,
      lastSlippagePredicted: 0.0001,
      lastSlippageActual: 0.0001,
      bundleSequenceValid: true,
      signerAvailable: true,
      kmsEnabled: true,
      drLogNominal: true,
      lastUserOpSimulationSuccess: true,
      paymasterStaked: true,
      replayProtectionActive: true,
      bundlerFailoverReady: true,
      currentSharpeRatio: 3.0,
      solverLatencyP99Ms: 100,
      winRateEMA: 0.99,
      inclusionRateEMA: 0.99,
      multiRegionActive: true,
      secretsLastRotated: Date.now(),
      scalingCapacityReached: false,
      cloudBudgetUsagePercent: 10,
      lastRunbookDrill: Date.now(),
    });
  });

  describe("Pre-Flight Gate (P1-P10)", () => {
    it("passes when environment is healthy", async () => {
      const result = await preflightCheck.runChecks();
      expect(result.passed).toBe(true);
    });

    it("blocks execution on excessive gas (P1)", async () => {
      sharedEngineState.gasPriceGwei = 600;
      const result = await preflightCheck.runChecks();
      expect(result.passed).toBe(false);
      expect(result.failedChecks).toContain("P1: GAS_PRICE_EXCESSIVE");
    });

    it("blocks execution on oracle staleness (P4)", async () => {
      sharedEngineState.oracleHeartbeat = Date.now() - 30000;
      const result = await preflightCheck.runChecks();
      expect(result.passed).toBe(false);
      expect(result.failedChecks).toContain("P4: ORACLE_STALE");
    });

    it("blocks execution on nonce desync (P10)", async () => {
      sharedEngineState.nextNonce = 5;
      sharedEngineState.chainNonce = 10;
      const result = await preflightCheck.runChecks();
      expect(result.passed).toBe(false);
      expect(result.failedChecks).toContain("P10: NONCE_DESYNC");
    });
  });

  describe("Debugging Diagnostic (D1-D29)", () => {
    it("reports 100% score for nominal state", async () => {
      const report = await debuggingSystem.runFullDiagnostic();
      expect(report.overallScore).toBe(100);
      expect(report.results.every(r => r.status === 'PASS')).toBe(true);
    });

    it("identifies Strategy root cause on slippage failure (D8)", async () => {
      sharedEngineState.lastSlippagePredicted = 0.0001;
      sharedEngineState.lastSlippageActual = 0.05; // Significant variance
      const report = await debuggingSystem.runFullDiagnostic();
      expect(report.results.find(r => r.itemId === "D8")?.status).toBe('FAIL');
      expect(report.rootCauseSummary).toContain("Strategy domain");
    });

    it("identifies Infrastructure root cause on low paymaster balance (D13)", async () => {
      sharedEngineState.paymasterBalanceEth = 0.05;
      const report = await debuggingSystem.runFullDiagnostic();
      expect(report.results.find(r => r.itemId === "D13")?.status).toBe('FAIL');
      expect(report.rootCauseSummary).toContain("Infrastructure domain");
    });
  });
});