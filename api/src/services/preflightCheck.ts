import { logger } from "./logger";
import { sharedEngineState } from "./engineState";
import { allbrightBribeEngine } from "../bribe-engine";

export interface PreflightResult {
  passed: boolean;
  failedChecks: string[];
  details: Record<string, any>;
  timestamp: number;
}

/**
 * BSS-55: Pre-Flight Guard (P1-P10)
 * Hardened execution gate for institutional arbitrage.
 * Provides immediate safety confirmation before 44-KPI execution.
 */
export class PreflightCheckService {
  async runChecks(): Promise<PreflightResult> {
    const failedChecks: string[] = [];
    const details: Record<string, any> = {};
    const now = Date.now();

    // P1: Gas price sanity check (Avoid high-gas regimes)
    const currentGasPrice = sharedEngineState.gasPriceGwei || 0;
    if (currentGasPrice > 500) {
      failedChecks.push("P1: GAS_PRICE_EXCESSIVE");
      details.gasPrice = currentGasPrice;
    }

    // P2: RPC endpoint health check
    if (sharedEngineState.activeRpcCount < 1) {
      failedChecks.push("P2: NO_HEALTHY_RPC");
    }

    // P3: Paymaster deposit balance check (Institutional Gasless)
    const paymasterBalance = sharedEngineState.paymasterBalanceEth || 0;
    if (paymasterBalance < 0.1) { // Threshold for elite-grade operation
      failedChecks.push("P3: PAYMASTER_DEPOSIT_LOW");
      details.paymasterBalance = paymasterBalance;
    }

    // P4: Oracle freshness check
    const oracleLastUpdate = sharedEngineState.oracleHeartbeat || 0;
    if (now - oracleLastUpdate > 12000) { // 12s threshold (approx 1 block)
      failedChecks.push("P4: ORACLE_STALE");
      details.oracleLagMs = now - oracleLastUpdate;
    }

    // P5: Slippage simulation error check
    // Re-verify the margin against current bribe ratio
    const bribeParams = allbrightBribeEngine.getAuctionParams();
    if (bribeParams.BRIBE_ELASTICITY < 0.01) {
      failedChecks.push("P5: SLIPPAGE_MODEL_DEGRADED");
    }

    // P6: Circuit breaker state check
    if (sharedEngineState.blockedUntil && sharedEngineState.blockedUntil > now) {
      failedChecks.push("P6: CIRCUIT_BREAKER_ACTIVE");
      details.blockedUntil = sharedEngineState.blockedUntil;
    }

    // P7: Bundler availability check (ERC-4337)
    if (!sharedEngineState.bundlerOnline) {
      failedChecks.push("P7: BUNDLER_OFFLINE");
    }

    // P8: Rate limit status check (Render/Infura/Alchemy)
    if (sharedEngineState.cloudRateLimitRemaining < 100) {
      failedChecks.push("P8: RATE_LIMIT_WARNING");
      details.apiRemaining = sharedEngineState.cloudRateLimitRemaining;
    }

    // P9: Private mempool access check (Flashbots/bloXroute)
    if (!sharedEngineState.privateMempoolActive) {
      failedChecks.push("P9: PRIVATE_RELAY_DISCONNECTED");
    }

    // P10: Local state consistency check (Nonce synchronization)
    const nextNonce = sharedEngineState.nextNonce || 0;
    const chainNonce = sharedEngineState.chainNonce || 0;
    if (nextNonce < chainNonce) {
      failedChecks.push("P10: NONCE_DESYNC");
      details.nonceDiff = chainNonce - nextNonce;
    }

    const passed = failedChecks.length === 0;

    if (!passed) {
      logger.warn({ failedChecks, details }, "[PRE-FLIGHT] Execution blocked by safety gate");
    } else {
      logger.info("[PRE-FLIGHT] Safety checks passed. Execution authorized.");
    }

    return {
      passed,
      failedChecks,
      details,
      timestamp: now
    };
  }
}

export const preflightCheck = new PreflightCheckService();