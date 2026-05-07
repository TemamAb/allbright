import { logger } from "./logger";
import { sharedEngineState } from "./engineState";

export interface DebugResult {
  itemId: string;
  name: string;
  category: 'Smart Contract' | 'Strategy' | 'Infrastructure' | 'Paymaster' | 'KPI' | 'Cloud';
  status: 'PASS' | 'FAIL' | 'INCONCLUSIVE';
  message: string;
  details?: any;
  suggestedFix?: string;
  autoFixAvailable?: boolean;
}

export interface DiagnosticReport {
  timestamp: number;
  overallScore: number;
  results: DebugResult[];
  rootCauseSummary: string;
}

/**
 * BSS-55: Advanced Debugging System (D1-D29+)
 * Provides structured diagnostics for the arbitrage engine.
 * Maps to root cause taxonomy for fast issue resolution.
 */
export class DebuggingSystem {
  async runFullDiagnostic(): Promise<DiagnosticReport> {
    const results: DebugResult[] = [];
    
    // A. Smart Contract & Core Logic (D1-D5)
    results.push(this.checkD1_RepaymentInvariant());
    results.push(this.checkD2_TraceAnalysis());
    results.push(this.checkD3_AllowanceLeak());
    results.push(this.checkD4_SimulationParity());
    results.push(this.checkD5_PaymasterLogic());

    // B. Off-chain Strategy Engine (D6-D10)
    results.push(this.checkD6_DryRunReplay());
    results.push(this.checkD7_OracleFreshness());
    results.push(this.checkD8_SlippageModel());
    results.push(this.checkD9_BundleSequencing());
    results.push(this.checkD10_CircuitBreakerState());

    // C. Infrastructure & Secrets (D11-D15)
    results.push(this.checkD11_RpcConnectivity());
    results.push(this.checkD12_PrivateKeyHealth());
    results.push(this.checkD13_PaymasterBalance());
    results.push(this.checkD14_KmsVaultStatus());
    results.push(this.checkD15_DisasterRecoveryLog());

    // D. Paymaster (ERC-4337) (D16-D20)
    results.push(this.checkD16_UserOpSimulation());
    results.push(this.checkD17_EntryPointStake());
    results.push(this.checkD18_ReplayProtection());
    results.push(this.checkD19_BundlerFailover());
    results.push(this.checkD20_RateLimits());

    // E. KPI Anomaly (D21-D24)
    results.push(this.checkD21_SharpeDrift());
    results.push(this.checkD22_LatencySpikes());
    results.push(this.checkD23_WinRateDegradation());
    results.push(this.checkD24_InclusionRateAnomalies());

    // F. Cloud & Deployment (D25-D29)
    results.push(this.checkD25_MultiRegionHealth());
    results.push(this.checkD26_SecretRotationAge());
    results.push(this.checkD27_ScalingCapacity());
    results.push(this.checkD28_CloudBudget());
    results.push(this.checkD29_IncidentRunbookStatus());

    const fails = results.filter(r => r.status === 'FAIL').length;
    const overallScore = Math.max(0, 100 - (fails * 10));

    const report: DiagnosticReport = {
      timestamp: Date.now(),
      overallScore,
      results,
      rootCauseSummary: this.identifyRootCause(results)
    };

    if (fails > 0) {
      logger.error({ fails, summary: report.rootCauseSummary }, "[DEBUG-SYSTEM] Diagnostic failures detected");
    } else {
      logger.info("[DEBUG-SYSTEM] Diagnostic passed. System nominal.");
    }

    return report;
  }

  private checkD1_RepaymentInvariant(): DebugResult {
    const passed = sharedEngineState.lastRepaymentStatus !== false;
    return {
      itemId: "D1",
      name: "Verify repayment invariant",
      category: "Smart Contract",
      status: passed ? 'PASS' : 'FAIL',
      message: passed ? "Repayment confirmed for last arbitrage" : "Contract logic bug: Profit not realized in vault",
      suggestedFix: "Patch contract invariant logic and re-audit token transfer flow",
      autoFixAvailable: false
    };
  }

  private checkD2_TraceAnalysis(): DebugResult {
    const traceNominal = sharedEngineState.lastRevertTraceAnalysis !== 'CRITICAL';
    return {
      itemId: "D2",
      name: "Local trace analysis",
      category: "Smart Contract",
      status: traceNominal ? 'PASS' : 'FAIL',
      message: traceNominal ? "No recursive revert patterns detected" : "Recursive revert detected in contract stack",
      suggestedFix: "Run `cast run --debug` on last tx and inspect OOG or Revert offsets",
      autoFixAvailable: false
    };
  }

  private checkD3_AllowanceLeak(): DebugResult {
    const leak = sharedEngineState.allowanceLeakDetected === true;
    return {
      itemId: "D3",
      name: "Check flash loan allowance revocation",
      category: "Smart Contract",
      status: leak ? 'FAIL' : 'PASS',
      message: leak ? "Residual allowance found post-execution" : "All allowances properly revoked",
      suggestedFix: "Enforce exact-allowance pattern in executor contract using safeApprove(0)",
      autoFixAvailable: false
    };
  }

  private checkD4_SimulationParity(): DebugResult {
    const simSuccess = sharedEngineState.lastSimSuccess === true;
    return {
      itemId: "D4",
      name: "Off-chain simulation parity",
      category: "Smart Contract",
      status: simSuccess ? 'PASS' : 'FAIL',
      message: simSuccess ? "Simulation matches chain state" : "State divergence detected between solver and chain",
      suggestedFix: "Refresh pool state cache and re-simulate with current block basefee",
      autoFixAvailable: true
    };
  }

  private checkD5_PaymasterLogic(): DebugResult {
    const logicValid = sharedEngineState.paymasterLogicVerified === true;
    return {
      itemId: "D5",
      name: "Paymaster logic validation",
      category: "Smart Contract",
      status: logicValid ? 'PASS' : 'FAIL',
      message: logicValid ? "Validation results nominal" : "Paymaster validation logic error",
      suggestedFix: "Verify signature aggregation and validUntil logic in Paymaster.sol",
      autoFixAvailable: false
    };
  }

  private checkD6_DryRunReplay(): DebugResult {
    const successRate = sharedEngineState.dryRunSuccessRate || 0;
    const passed = successRate >= 0.98;
    return {
      itemId: "D6",
      name: "Dry-run simulation replay",
      category: "Strategy",
      status: passed ? 'PASS' : 'FAIL',
      message: `Last 100 dry-runs: ${(successRate * 100).toFixed(1)}% success`,
      suggestedFix: "Check logs/simulator.log for high-latency path rejections",
      autoFixAvailable: false
    };
  }

  private checkD7_OracleFreshness(): DebugResult {
    const lag = Date.now() - (sharedEngineState.oracleHeartbeat || 0);
    const passed = lag < 12000; // 1 block threshold
    return {
      itemId: "D7",
      name: "Oracle price freshness",
      category: "Strategy",
      status: passed ? 'PASS' : 'FAIL',
      message: `Oracle heartbeat lag: ${lag}ms`,
      details: { lag },
      suggestedFix: "Check oracle node health or increase heartbeat frequency",
      autoFixAvailable: true
    };
  }

  private checkD8_SlippageModel(): DebugResult {
    const variance = Math.abs(sharedEngineState.lastSlippagePredicted - sharedEngineState.lastSlippageActual);
    const passed = variance < 0.0002; // 2 bps threshold
    return {
      itemId: "D8",
      name: "Slippage model calibration",
      category: "Strategy",
      status: passed ? 'PASS' : 'FAIL',
      message: `Prediction variance: ${(variance * 10000).toFixed(2)} bps`,
      suggestedFix: "Retrain slippage model using recent pool volatility data",
      autoFixAvailable: true
    };
  }

  private checkD9_BundleSequencing(): DebugResult {
    const sequenceValid = sharedEngineState.bundleSequenceValid !== false;
    return {
      itemId: "D9",
      name: "Bundle construction sequence",
      category: "Strategy",
      status: sequenceValid ? 'PASS' : 'FAIL',
      message: sequenceValid ? "Operation sequence borrow -> swap -> repay verified" : "Invalid bundle sequence detected",
      suggestedFix: "Review bundler composition logic in transaction builder",
      autoFixAvailable: false
    };
  }

  private checkD10_CircuitBreakerState(): DebugResult {
    const paused = sharedEngineState.blockedUntil && sharedEngineState.blockedUntil > Date.now();
    return {
      itemId: "D10",
      name: "Circuit breaker status",
      category: "Strategy",
      status: paused ? 'FAIL' : 'PASS',
      message: paused ? `System paused until ${new Date(sharedEngineState.blockedUntil!).toISOString()}` : "Operational",
      suggestedFix: "Analyze trigger source (drawdown/gas/loss) and manually reset if safe",
      autoFixAvailable: false
    };
  }

  private checkD11_RpcConnectivity(): DebugResult {
    const active = sharedEngineState.activeRpcCount || 0;
    return {
      itemId: "D11",
      name: "RPC connectivity check",
      category: "Infrastructure",
      status: active > 0 ? 'PASS' : 'FAIL',
      message: `${active} active providers connected`,
      suggestedFix: "Verify RPC endpoints and credentials in environment config",
      autoFixAvailable: false
    };
  }

  private checkD12_PrivateKeyHealth(): DebugResult {
    const signerAvailable = sharedEngineState.signerAvailable === true;
    return {
      itemId: "D12",
      name: "Signer health and access",
      category: "Infrastructure",
      status: signerAvailable ? 'PASS' : 'FAIL',
      message: signerAvailable ? "Signer ready for UserOp signing" : "Key access failed",
      suggestedFix: "Check environment variables and secure enclave connectivity",
      autoFixAvailable: false
    };
  }

  private checkD13_PaymasterBalance(): DebugResult {
    const bal = sharedEngineState.paymasterBalanceEth || 0;
    const passed = bal >= 0.15;
    return {
      itemId: "D13",
      name: "Paymaster deposit balance",
      category: "Infrastructure",
      status: passed ? 'PASS' : 'FAIL',
      message: `EntryPoint balance: ${bal} ETH`,
      suggestedFix: "Execute top-up of paymaster deposit via EntryPoint controller",
      autoFixAvailable: true
    };
  }

  private checkD14_KmsVaultStatus(): DebugResult {
    const kmsNominal = sharedEngineState.kmsEnabled !== false;
    return {
      itemId: "D14",
      name: "Vault / KMS health check",
      category: "Infrastructure",
      status: kmsNominal ? 'PASS' : 'FAIL',
      message: kmsNominal ? "KMS key state: ENABLED" : "KMS endpoint unreachable or key disabled",
      suggestedFix: "Verify cloud provider IAM permissions for KMS decrypt operations",
      autoFixAvailable: false
    };
  }

  private checkD15_DisasterRecoveryLog(): DebugResult {
    const drNominal = sharedEngineState.drLogNominal !== false;
    return {
      itemId: "D15",
      name: "Disaster recovery log audit",
      category: "Infrastructure",
      status: drNominal ? 'PASS' : 'FAIL',
      message: drNominal ? "No unauthorized pause attempts detected" : "Suspicious pause activity found in logs",
      suggestedFix: "Review logs/disaster_recovery.log and verify admin multi-sig activity",
      autoFixAvailable: false
    };
  }

  private checkD16_UserOpSimulation(): DebugResult {
    const success = sharedEngineState.lastUserOpSimulationSuccess !== false;
    return {
      itemId: "D16",
      name: "UserOperation simulation check",
      category: "Paymaster",
      status: success ? 'PASS' : 'FAIL',
      message: success ? "Last simulation successful" : "Simulation revert detected",
      suggestedFix: "Review validation logic in paymaster or smart account signature",
      autoFixAvailable: false
    };
  }

  private checkD17_EntryPointStake(): DebugResult {
    const staked = sharedEngineState.paymasterStaked === true;
    return {
      itemId: "D17",
      name: "EntryPoint stake verification",
      category: "Paymaster",
      status: staked ? 'PASS' : 'FAIL',
      message: staked ? "Paymaster properly staked" : "Unstaked - reputation risk",
      suggestedFix: "Stake ETH in EntryPoint to avoid bundler throttling",
      autoFixAvailable: false
    };
  }

  private checkD18_ReplayProtection(): DebugResult {
    const replaySafe = sharedEngineState.replayProtectionActive !== false;
    return {
      itemId: "D18",
      name: "Signature replay protection",
      category: "Paymaster",
      status: replaySafe ? 'PASS' : 'FAIL',
      message: replaySafe ? "Nonce and chainId validation active" : "Potential replay vulnerability detected",
      suggestedFix: "Ensure chainId is correctly included in the EIP-712 UserOp hash",
      autoFixAvailable: false
    };
  }

  private checkD19_BundlerFailover(): DebugResult {
    const failoverReady = sharedEngineState.bundlerFailoverReady === true;
    return {
      itemId: "D19",
      name: "Bundler failover status",
      category: "Paymaster",
      status: failoverReady ? 'PASS' : 'FAIL',
      message: failoverReady ? "Secondary bundler reachable" : "Failover bundler offline",
      suggestedFix: "Check fallback bundler endpoint URL and rate limits",
      autoFixAvailable: false
    };
  }

  private checkD20_RateLimits(): DebugResult {
    const remaining = sharedEngineState.cloudRateLimitRemaining || 0;
    const passed = remaining > 100;
    return {
      itemId: "D20",
      name: "Infrastructure rate limits",
      category: "Paymaster",
      status: passed ? 'PASS' : 'FAIL',
      message: `API credits remaining: ${remaining}`,
      suggestedFix: "Scale provider tier or optimize RPC request frequency",
      autoFixAvailable: false
    };
  }

  private checkD21_SharpeDrift(): DebugResult {
     const sharpe = sharedEngineState.currentSharpeRatio || 0;
     const passed = sharpe > 1.0;
     return {
       itemId: "D21",
       name: "KPI Anomaly: Sharpe Ratio",
       category: "KPI",
       status: passed ? 'PASS' : 'FAIL',
       message: `Current Sharpe: ${sharpe.toFixed(2)}`,
       suggestedFix: "Audit strategy parameters for high-volatility loss correlation",
       autoFixAvailable: false
     };
  }

  private checkD22_LatencySpikes(): DebugResult {
    const p99 = sharedEngineState.solverLatencyP99Ms || 0;
    const passed = p99 < 1500;
    return {
      itemId: "D22",
      name: "KPI Anomaly: p99 Latency",
      category: "KPI",
      status: passed ? 'PASS' : 'FAIL',
      message: `p99 Solver Latency: ${p99}ms`,
      suggestedFix: "Check RPC provider congestion or bundler endpoint proximity",
      autoFixAvailable: false
    };
  }

  private checkD23_WinRateDegradation(): DebugResult {
    const winRate = sharedEngineState.winRateEMA || 0;
    const passed = winRate >= 0.95;
    return {
      itemId: "D23",
      name: "KPI Anomaly: Win Rate",
      category: "KPI",
      status: passed ? 'PASS' : 'FAIL',
      message: `Win Rate EMA: ${(winRate * 100).toFixed(1)}%`,
      suggestedFix: "Re-evaluate strategy parameters; oracle might be lagging behind DEX spot",
      autoFixAvailable: false
    };
  }

  private checkD24_InclusionRateAnomalies(): DebugResult {
    const inclusion = sharedEngineState.inclusionRateEMA || 0;
    const passed = inclusion >= 0.95;
    return {
      itemId: "D24",
      name: "KPI Anomaly: Inclusion Rate",
      category: "KPI",
      status: passed ? 'PASS' : 'FAIL',
      message: `Inclusion Rate: ${(inclusion * 100).toFixed(1)}%`,
      suggestedFix: "Increase priority fee or check for mempool congestion in specific regions",
      autoFixAvailable: false
    };
  }

  private checkD25_MultiRegionHealth(): DebugResult {
    const multiRegion = sharedEngineState.multiRegionActive === true;
    return {
      itemId: "D25",
      name: "Multi-region failover verification",
      category: "Cloud",
      status: multiRegion ? 'PASS' : 'FAIL',
      message: multiRegion ? "Active-Active regions synced" : "Region synchronization lag detected",
      suggestedFix: "Verify database replication latency between primary and secondary regions",
      autoFixAvailable: false
    };
  }

  private checkD26_SecretRotationAge(): DebugResult {
    const lastRotation = sharedEngineState.secretsLastRotated || 0;
    const ageDays = (Date.now() - lastRotation) / (1000 * 60 * 60 * 24);
    const passed = ageDays < 90;
    return {
      itemId: "D26",
      name: "Secrets rotation audit",
      category: "Cloud",
      status: passed ? 'PASS' : 'FAIL',
      message: passed ? `Rotation age: ${ageDays.toFixed(0)} days` : `Secrets expired: ${ageDays.toFixed(0)} days old`,
      suggestedFix: "Trigger automated secrets rotation in AWS/Google Cloud console",
      autoFixAvailable: false
    };
  }

  private checkD27_ScalingCapacity(): DebugResult {
    const capacity = sharedEngineState.scalingCapacityReached === false;
    return {
      itemId: "D27",
      name: "Horizontal scaling capacity",
      category: "Cloud",
      status: capacity ? 'PASS' : 'FAIL',
      message: capacity ? "System has available pod headroom" : "Scaling limit reached - performance may bottleneck",
      suggestedFix: "Increase max replicas in K8s deployment or upgrade instance tiers",
      autoFixAvailable: false
    };
  }

  private checkD28_CloudBudget(): DebugResult {
    const usage = sharedEngineState.cloudBudgetUsagePercent || 0;
    const passed = usage < 80;
    return {
      itemId: "D28",
      name: "Cloud budget compliance",
      category: "Cloud",
      status: passed ? 'PASS' : 'FAIL',
      message: `Budget usage: ${usage}%`,
      suggestedFix: "Reduce non-critical infra overhead or increase billing cap",
      autoFixAvailable: false
    };
  }

  private checkD29_IncidentRunbookStatus(): DebugResult {
    const lastDrill = sharedEngineState.lastRunbookDrill || 0;
    const ageDays = (Date.now() - lastDrill) / (1000 * 60 * 60 * 24);
    const passed = ageDays < 90;
    return {
      itemId: "D29",
      name: "Incident runbook drill review",
      category: "Cloud",
      status: passed ? 'PASS' : 'FAIL',
      message: passed ? `Last drill: ${ageDays.toFixed(0)} days ago` : "Runbook drill overdue (>90 days)",
      suggestedFix: "Schedule a simulated failure drill to verify automated failover logic",
      autoFixAvailable: false
    };
  }

  private identifyRootCause(results: DebugResult[]): string {
    const fails = results.filter(r => r.status === 'FAIL');
    if (fails.length === 0) return "System nominal - no active root causes.";

    const categories = fails.map(f => f.category);
    const mostFrequent = categories.reduce((a, b, i, arr) =>
      arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
    );

    return `Primary root cause in ${mostFrequent} domain. Fix: ${fails[0].suggestedFix}`;
  }
}

export const debuggingSystem = new DebuggingSystem();