/**
 * BrightSky Bribe Engine with AI-Powered Analysis
 * Deterministic, ultra-low latency risk and bribe calculation engine.
 */
export class BrightSkyBribeEngine {
  // BSS-07: Bribe Engine / BSS-20: Self-Heal Loop
  // Config is mutable to allow BSS-20 (Feedback Engine) to optimize parameters 
  // based on block-inclusion success rates and competitive gas auctions.
  private static CONFIG = {
    BRIBE_RATIO: 0.05, // 5% bribe for builder prioritization (baseline)
    MIN_MARGIN_RATIO: 0.15, // 15% minimum net margin gate
  };

  // Auction theory parameters for bribe optimization
  private static AUCTION_PARAMS = {
    // Base inclusion probability at 0 bribe (should be >0 due to mempool dynamics)
    BASE_INCLUSION_PROB: 0.1,
    // How much each 1% bribe increase improves inclusion probability
    BRIBE_ELASTICITY: 0.05,
    // Maximum inclusion probability achievable (even with 100% bribe)
    MAX_INCLUSION_PROB: 0.95,
    // Competitive factor - higher means more competitive auction
    COMPETITIVE_FACTOR: 1.0,
  };

  /**
   * BSS-20 Integration: Allows the autonomous feedback loop to tweak
   * performance parameters 24/7 based on real-world success rates.
   */
  static updateTuning(newParams: Partial<typeof BrightSkyBribeEngine.CONFIG>) {
    this.CONFIG = { ...this.CONFIG, ...newParams };
    console.log("[LEARNING_LOOP] Parameters optimized:", this.CONFIG);
  }

  static getTuning() {
    return { ...this.CONFIG };
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
      this.AUCTION_PARAMS.BASE_INCLUSION_PROB = Math.max(0, Math.min(1, baseInclusionProb));
    }
    if (bribeElasticity !== undefined) {
      this.AUCTION_PARAMS.BRIBE_ELASTICITY = Math.max(0, bribeElasticity);
    }
    if (maxInclusionProb !== undefined) {
      this.AUCTION_PARAMS.MAX_INCLUSION_PROB = Math.max(0, Math.min(1, maxInclusionProb));
    }
    if (competitiveFactor !== undefined) {
      this.AUCTION_PARAMS.COMPETITIVE_FACTOR = Math.max(0.1, competitiveFactor);
    }
    console.log("[AUCTION_TUNE] Auction parameters updated:", this.AUCTION_PARAMS);
  }

  static getAuctionParams() {
    return { ...this.AUCTION_PARAMS };
  }

  /**
   * Calculates the bribe amount and probabilistic net margin.
   * Uses global tuning from sharedEngineState (synced with Rust).
   * Integrates real-time mempool intelligence for optimal bribe calculation.
   */
  static async calculateProtectedBribe(
    profit: number,
    successProb: number = 0.95,
    gasCost: number = 0,
    networkLatencyMs: number = 0
  ) {
    if (profit <= 0) {
      return { bribe: 0, margin: 0, proceed: false, netProfit: 0, ev: 0 };
    }

    // Read current tuning from shared state (authoritative)
    const minMarginRatio = sharedEngineState.minMarginRatioBps / 10000; // e.g., 1000 -> 0.10
    let dynamicBribeRatio = sharedEngineState.bribeRatioBps / 10000;   // e.g., 500 -> 0.05

    // Integrate real-time mempool intelligence
    const { MempoolIntelligenceService } = await import('./mempoolIntelligence');
    const mempoolData = await MempoolIntelligenceService.analyzeMempoolState();

    // Adjust base success probability based on mempool conditions
    const adjustedSuccessProb = Math.min(successProb, mempoolData.blockUtilization * 0.95);

    // Apply auction theory to determine optimal bribe ratio
    const { optimalBribeRatio, inclusionProbability } = this.calculateOptimalBribeRatio(
      profit,
      adjustedSuccessProb,
      gasCost,
      networkLatencyMs,
      mempoolData
    );

    // Use the optimal bribe ratio instead of the static one
    dynamicBribeRatio = optimalBribeRatio;

    // Apply competitive escalation based on mempool conditions
    if (successProb < 0.6 || mempoolData.marketCondition === 'intense') {
      dynamicBribeRatio *= 1.5;
      dynamicBribeRatio = Math.min(dynamicBribeRatio, 0.3);
      console.log("[BSS-17] Competitive threat detected. Escalating bribe ratio (capped).");
    }

    const ev = this.calculateExpectedValue(profit, adjustedSuccessProb, gasCost, networkLatencyMs);
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
      bribeRatio: optimalBribeRatio,
      mempoolData: {
        marketCondition: mempoolData.marketCondition,
        competitionIndex: mempoolData.bribeCompetitionIndex,
        recommendedMinBribe: mempoolData.recommendedMinBribe
      }
    };
  }

  /**
   * Auction Theory-Based Optimal Bribe Calculator
   * Uses auction theory to determine the bribe amount that maximizes expected profit
   * 
   * @param profit The gross profit in USD or target asset
   * @param successProb Base success probability without bribe enhancement
   * @param gasCost The estimated gas cost of the transaction
   * @param networkLatencyMs Network latency in milliseconds
   * @returns An object containing the bribe, net margin percentage, and execution clearance
   */
  static calculateProtectedBribe(
    profit: number, 
    successProb: number = 0.95, 
    gasCost: number = 0,
    networkLatencyMs: number = 0
  ) {
    if (profit <= 0) {
      return { bribe: 0, margin: 0, proceed: false, netProfit: 0, ev: 0 };
    }

    // Apply auction theory to determine optimal bribe ratio
    const { optimalBribeRatio, inclusionProbability } = this.calculateOptimalBribeRatio(
      profit, 
      successProb, 
      gasCost, 
      networkLatencyMs
    );

    // Apply BSS-09: EV Risk Engine Filter
    const ev = this.calculateExpectedValue(profit, successProb, gasCost, networkLatencyMs);
    
    // Calculate bribe based on optimal ratio
    const bribe = ev * optimalBribeRatio;
    const netProfit = Math.max(0, ev - bribe);
    
    // AlphaMax Standard: Strict EV Rejection
    // If EV is less than 2x the gas cost, the risk of a revert makes the trade non-viable
    // regardless of the nominal spread.
    const riskPremiumGate = ev > (gasCost * 2);
    
    // Calculate margin and check if proceed
    const margin = ((netProfit + 1e-9) / profit) * 100;
    const proceed = 
      margin >= (this.CONFIG.MIN_MARGIN_RATIO * 100) - 0.001 && 
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
   * Incorporates real-time mempool intelligence for optimal bidding
   */
  private static calculateOptimalBribeRatio(
    profit: number,
    baseSuccessProb: number,
    gasCost: number,
    networkLatencyMs: number,
    mempoolData?: any
  ): { optimalBribeRatio: number; inclusionProbability: number } {
    // Apply latency penalty to base success probability
    const latencyDecay = Math.max(0, (networkLatencyMs - 20) / 10) * 0.05;
    const adjustedBaseSuccess = Math.max(0, baseSuccessProb - latencyDecay);
    
    // If no profit or gas cost is zero, return minimal bribe
    if (profit <= 0 || gasCost <= 0) {
      return { optimalBribeRatio: this.CONFIG.BRIBE_RATIO, inclusionProbability: adjustedBaseSuccess };
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

    // Adjust auction parameters based on mempool data if available
    let effectiveBaseInclusionProb = this.AUCTION_PARAMS.BASE_INCLUSION_PROB;
    let effectiveElasticity = this.AUCTION_PARAMS.BRIBE_ELASTICITY;
    let effectiveCompetitiveFactor = this.AUCTION_PARAMS.COMPETITIVE_FACTOR;

    if (mempoolData) {
      // Use real-time mempool intelligence to adjust auction parameters
      effectiveBaseInclusionProb = Math.max(0.02, Math.min(0.2, mempoolData.recommendedMinBribe / profit));
      effectiveElasticity = Math.max(0.01, Math.min(0.1, 0.05 * mempoolData.bribeCompetitionIndex));
      effectiveCompetitiveFactor = Math.max(0.5, Math.min(3.0, mempoolData.bribeCompetitionIndex));
    }

    // Test bribe ratios from 0% to 50% in small increments
    // In practice, we'd use calculus or binary search, but this is clear and sufficient
    const steps = 50; // Test 0%, 1%, 2%, ..., 50%
    for (let i = 0; i <= steps; i++) {
      const bribeRatio = i / steps * 0.5; // 0 to 0.5 (0% to 50%)

      // Calculate inclusion probability based on auction theory with mempool-adjusted parameters
      // P(inclusion) = BASE + ELASTICITY * bribe_ratio * COMPETITIVE_FACTOR
      // Capped at MAX_INCLUSION_PROB
      const inclusionProb = Math.min(
        this.AUCTION_PARAMS.MAX_INCLUSION_PROB,
        effectiveBaseInclusionProb +
          (effectiveElasticity * bribeRatio * 100) * // Convert to percentage
          effectiveCompetitiveFactor *
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
    const finalInclusionProb = Math.min(
      this.AUCTION_PARAMS.MAX_INCLUSION_PROB,
      this.AUCTION_PARAMS.BASE_INCLUSION_PROB + 
        (this.AUCTION_PARAMS.BRIBE_ELASTICITY * finalBribeRatio * 100) *
        this.AUCTION_PARAMS.COMPETITIVE_FACTOR *
        adjustedBaseSuccess
    );
    
    return { optimalBribeRatio: finalBribeRatio, inclusionProbability: finalInclusionProb };
  }
}
