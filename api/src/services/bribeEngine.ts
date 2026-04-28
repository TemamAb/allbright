/**
 * BrightSky Bribe Engine with AI-Powered Analysis
 * Deterministic, ultra-low latency risk and bribe calculation engine.
 *
 * Single Source of Truth: bribe parameters come from `sharedEngineState`
 * (populated from Rust WatchtowerStats via IPC heartbeat). This eliminates
 * drift between Node.js and Rust tuning.
 */
import { sharedEngineState } from './engineState';

export class BrightSkyBribeEngine {
  // BSS-07: Bribe Engine / BSS-20: Self-Heal Loop
  // Parameters are read from sharedEngineState at runtime — no local CONFIG copy.
  // Defaults: min_margin=10%, bribe_ratio=5% (set in engineState.ts)

  /**
   * BSS-20 Integration: Allows the autonomous feedback loop to tweak
   * performance parameters 24/7 based on real-world success rates.
   * Writes new values to sharedEngineState, which Rust synchronizes via IPC.
   */
  static updateTuning(newParams: { minMarginRatio?: number; bribeRatio?: number }) {
    if (newParams.minMarginRatio !== undefined) {
      sharedEngineState.minMarginRatioBps = Math.round(newParams.minMarginRatio * 10000);
    }
    if (newParams.bribeRatio !== undefined) {
      sharedEngineState.bribeRatioBps = Math.round(newParams.bribeRatio * 10000);
    }
    console.log("[LEARNING_LOOP] Parameters optimized:", {
      minMarginRatio: sharedEngineState.minMarginRatioBps / 10000,
      bribeRatio: sharedEngineState.bribeRatioBps / 10000,
    });
  }

  static getTuning() {
    return {
      MIN_MARGIN_RATIO: sharedEngineState.minMarginRatioBps / 10000,
      BRIBE_RATIO: sharedEngineState.bribeRatioBps / 10000,
    };
  }

  /**
   * Update auction parameters based on market conditions
   * This would be called by BSS-20 (Feedback Engine) or Alpha-Copilot
   */
  static updateAuctionParams(
    baseInclusionProb?: number,
    bribeElasticity?: number,
    maxInclusionProb?: number,
    competitiveFactor?: number
  ) {
    if (baseInclusionProb !== undefined) {
      sharedEngineState.auctionParams.baseInclusionProb = baseInclusionProb;
    }
    if (bribeElasticity !== undefined) {
      sharedEngineState.auctionParams.bribeElasticity = bribeElasticity;
    }
    if (maxInclusionProb !== undefined) {
      sharedEngineState.auctionParams.maxInclusionProb = maxInclusionProb;
    }
    if (competitiveFactor !== undefined) {
      sharedEngineState.auctionParams.competitiveFactor = competitiveFactor;
    }
    console.log("[AUCTION_TUNE] Live parameters updated in SharedState:", sharedEngineState.auctionParams);
  }

  static getAuctionParams() {
    return { ...sharedEngineState.auctionParams };
  }

  /**
   * BSS-09: EV Risk Engine
   * Calculates Expected Value: (Profit * Success%) - (RevertCost * Fail%)
   */
  static calculateExpectedValue(
    grossProfit: number,
    successProbability: number,
    estimatedGasCost: number,
    networkLatencyMs: number = 0,
  ) {
    const latencyDecay = Math.max(0, (networkLatencyMs - 20) / 10) * 0.05;
    const adjustedSuccessProb = Math.max(0, successProbability - latencyDecay);
    const failProbability = 1 - adjustedSuccessProb;
    const revertCost = estimatedGasCost * 0.4;

    const expectedProfit = grossProfit * adjustedSuccessProb;
    const expectedLoss = revertCost * failProbability;

    return expectedProfit - expectedLoss;
  }

  /**
   * Calculates the bribe amount and probabilistic net margin.
   * Uses global tuning from sharedEngineState (synced with Rust).
   */
  static calculateProtectedBribe(
    profit: number,
    successProb: number = 0.95,
    gasCost: number = 0,
    networkLatencyMs: number = 0
  ) {
    // Input validation
    if (!Number.isFinite(profit) || profit <= 0) {
      throw new Error('Invalid profit: must be a positive finite number');
    }
    if (!Number.isFinite(successProb) || successProb < 0 || successProb > 1) {
      throw new Error('Invalid success probability: must be between 0 and 1');
    }
    if (!Number.isFinite(gasCost) || gasCost < 0) {
      throw new Error('Invalid gas cost: must be non-negative finite number');
    }
    if (!Number.isFinite(networkLatencyMs) || networkLatencyMs < 0) {
      throw new Error('Invalid network latency: must be non-negative finite number');
    }

    // Read current tuning from shared state (authoritative)
    const minMarginRatio = sharedEngineState.minMarginRatioBps / 10000; // e.g., 1000 -> 0.10
    let dynamicBribeRatio = sharedEngineState.bribeRatioBps / 10000;   // e.g., 500 -> 0.05

    // Apply auction theory to determine optimal bribe ratio
    const { optimalBribeRatio, inclusionProbability } = this.calculateOptimalBribeRatio(
      profit, 
      successProb, 
      gasCost, 
      networkLatencyMs
    );

    // Use the optimal bribe ratio instead of the static one
    dynamicBribeRatio = optimalBribeRatio;

    if (successProb < 0.6) {
      dynamicBribeRatio *= 1.5;
      dynamicBribeRatio = Math.min(dynamicBribeRatio, 0.3);
      console.log("[BSS-17] Competitive threat detected. Escalating bribe ratio (capped).");
    }

    const ev = this.calculateExpectedValue(profit, successProb, gasCost, networkLatencyMs);
    const bribe = ev * dynamicBribeRatio;
    const netProfit = Math.max(0, ev - bribe);
    const riskPremiumGate = ev > gasCost * 2;

    const margin = ((netProfit + 1e-9) / profit) * 100;
    const proceed =
      margin >= minMarginRatio * 100 - 0.001 &&
      ev > 0 &&
      riskPremiumGate;

    return {
      bribe,
      margin: parseFloat(margin.toFixed(2)),
      proceed,
      netProfit,
      ev,
      inclusionProbability, // Additional diagnostic info
      bribeRatio: optimalBribeRatio
    };
  }

  /**
   * Calculate optimal bribe ratio using auction theory
   * Models the builder auction as a probabilistic inclusion game
   */
  private static calculateOptimalBribeRatio(
    profit: number,
    baseSuccessProb: number,
    gasCost: number,
    networkLatencyMs: number
  ): { optimalBribeRatio: number; inclusionProbability: number } {
    // Input validation (already done at caller level, but defensive programming)
    if (!Number.isFinite(profit) || !Number.isFinite(baseSuccessProb) ||
        !Number.isFinite(gasCost) || !Number.isFinite(networkLatencyMs)) {
      throw new Error('Invalid inputs to bribe ratio calculation');
    }

    // Apply latency penalty to base success probability
    const latencyDecay = Math.max(0, (networkLatencyMs - 20) / 10) * 0.05;
    const adjustedBaseSuccess = Math.max(0, Math.min(1, baseSuccessProb - latencyDecay));

    // If no profit or gas cost is zero, return minimal bribe
    if (profit <= 0 || gasCost <= 0) {
      const defaultBribeRatio = sharedEngineState.bribeRatioBps / 10000;
      return { optimalBribeRatio: defaultBribeRatio, inclusionProbability: adjustedBaseSuccess };
    }

    // Calculate expected value without bribe
    const evNoBribe = this.calculateExpectedValue(profit, adjustedBaseSuccess, gasCost, networkLatencyMs);
    
    // If EV is negative or too low, we might not want to bribe at all
    if (evNoBribe <= 0) {
      return { optimalBribeRatio: 0, inclusionProbability: 0 };
    }

    // Auction theory optimization: find bribe ratio that maximizes expected profit
    // Expected profit = (Inclusion Probability) * (Profit - Bribe Amount)
    // Where Inclusion Probability = f(bribe ratio) and Bribe Amount = EV * bribe ratio
    
    let maxExpectedProfit = -Infinity;
    let optimalBribeRatio = 0;
    let optimalInclusionProb = 0;
    
    // Test bribe ratios from 0% to 50% in small increments
    // In practice, we'd use calculus or binary search, but this is clear and sufficient
    const steps = 50; // Test 0%, 1%, 2%, ..., 50%
    for (let i = 0; i <= steps; i++) {
      const bribeRatio = i / steps * 0.5; // 0 to 0.5 (0% to 50%)
      
      // Calculate inclusion probability based on auction theory
      // P(inclusion) = BASE + ELASTICITY * bribe_ratio * COMPETITIVE_FACTOR
      // Capped at MAX_INCLUSION_PROB
      const params = sharedEngineState.auctionParams;
      const inclusionProb = Math.min(
        params.maxInclusionProb,
        params.baseInclusionProb + 
          (params.bribeElasticity * bribeRatio * 100) * // Convert to percentage
          params.competitiveFactor *
          adjustedBaseSuccess // Base success affects bribe effectiveness
      );
      
      // Calculate expected profit at this bribe level
      const bribeAmount = evNoBribe * bribeRatio;
      const expectedProfitAtThisBribe = inclusionProb * (evNoBribe - bribeAmount);
      
      // Update if this is better
      if (expectedProfitAtThisBribe > maxExpectedProfit) {
        maxExpectedProfit = expectedProfitAtThisBribe;
        optimalBribeRatio = bribeRatio;
        optimalInclusionProb = inclusionProb;
      }
    }
    
    // Apply adversarial bidding escalation (BSS-17) if needed
    // If base success probability is low, we might need to increase bribe to compete
    let finalBribeRatio = optimalBribeRatio;
    if (adjustedBaseSuccess < 0.6) {
      // Competitive threat detected - increase bribe but cap it
      finalBribeRatio = Math.min(optimalBribeRatio * 1.5, 0.3); // Cap at 30%
      console.log("[BSS-17] Competitive threat detected. Escalating bribe ratio.");
    }
    
    // Ensure we don't go below minimum viable bribe for very low profit scenarios
    // but also don't exceed reasonable bounds
    finalBribeRatio = Math.max(finalBribeRatio, 0.01); // Minimum 1% bribe
    finalBribeRatio = Math.min(finalBribeRatio, 0.5);   // Maximum 50% bribe
    
    // Recalculate inclusion probability with final ratio
    const params = sharedEngineState.auctionParams;
    const finalInclusionProb = Math.min(
      params.maxInclusionProb,
      params.baseInclusionProb + 
        (params.bribeElasticity * finalBribeRatio * 100) *
        params.competitiveFactor *
        adjustedBaseSuccess
    );
    
    return { optimalBribeRatio: finalBribeRatio, inclusionProbability: finalInclusionProb };
  }
}
