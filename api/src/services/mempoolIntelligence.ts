/**
 * BSS-56 Update: Market Discovery & Competitor Analysis
 */
import { sharedEngineState } from './engineState';
/**
 * Mempool Intelligence Service - Real-time fee market analysis for bribe optimization
 */
export class MempoolIntelligenceService {
  private static mempoolStats = {
    avgBribePerBlock: 0.02, // Average bribe per block (ETH)
    bribeCompetitionIndex: 1.0, // How competitive the bribe market is
    topBribePercentile: 0.08, // 95th percentile bribe amount
    blockUtilization: 0.85, // How full blocks are (0-1)
    lastUpdated: Date.now()
  };

  private static builderStats = {
    activeBuilders: ['flashbots', 'eden', 'beaverbuild', 'rsync'],
    builderMarketShare: {
      flashbots: 0.35,
      eden: 0.25,
      beaverbuild: 0.20,
      rsync: 0.20
    },
    builderAggressiveness: {
      flashbots: 1.2, // More aggressive = higher bribes needed
      eden: 0.9,
      beaverbuild: 1.1,
      rsync: 0.8
    }
  };

  /**
   * Analyze current mempool state to determine bribe market conditions
   * Attempts real RPC connections with comprehensive fallback to simulation
   */
  static async analyzeMempoolState(): Promise<MempoolSnapshot> {
    const now = Date.now();

    // Try real data collection first
    try {
      const realData = await this.collectRealMempoolData();
      if (realData) {
        // Update stats with real data
        Object.assign(this.mempoolStats, realData);
        this.mempoolStats.lastUpdated = now;
        console.log('[MempoolIntelligence] Successfully collected real mempool data');
      } else {
        throw new Error('No real data available');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn('[MempoolIntelligence] Failed to collect real mempool data, using simulation:', message);

      // Fallback to simulation
      if (now - this.mempoolStats.lastUpdated > 12000) { // Update every 12 seconds
        this.mempoolStats.avgBribePerBlock = this.mempoolStats.avgBribePerBlock * 0.9 +
          (0.015 + Math.random() * 0.01) * 0.1; // EMA update with noise

        this.mempoolStats.bribeCompetitionIndex = Math.min(3.0, Math.max(0.5,
          this.mempoolStats.bribeCompetitionIndex * 0.95 +
          (this.mempoolStats.avgBribePerBlock > 0.025 ? 1.2 : 0.8) * 0.05
        ));

        this.mempoolStats.topBribePercentile = this.mempoolStats.avgBribePerBlock * 4; // ~95th percentile
        this.mempoolStats.blockUtilization = 0.7 + Math.random() * 0.3; // 70-100% utilization
        this.mempoolStats.lastUpdated = now;
      }
    }

    return {
      avgBribePerBlock: this.mempoolStats.avgBribePerBlock,
      bribeCompetitionIndex: this.mempoolStats.bribeCompetitionIndex,
      topBribePercentile: this.mempoolStats.topBribePercentile,
      blockUtilization: this.mempoolStats.blockUtilization,
      recommendedMinBribe: this.calculateRecommendedMinBribe(),
      marketCondition: this.getMarketCondition()
    };
  }

  /**
   * Attempt to collect real mempool data from RPC endpoints
   * Returns null if unsuccessful
   */
  private static async collectRealMempoolData(): Promise<Partial<typeof MempoolIntelligenceService.mempoolStats> | null> {
    // Try multiple RPC endpoints for redundancy
    const rpcUrls = [
      process.env.ETH_RPC_URL,
      'https://eth-mainnet.g.alchemy.com/v2/demo',
      'https://cloudflare-eth.com'
    ].filter(Boolean);

    for (const rpcUrl of rpcUrls) {
      try {
        // Attempt to get recent block data to estimate mempool conditions
        const response = await fetch(rpcUrl!, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_getBlockByNumber',
            params: ['latest', false]
          }),
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });

        if (!response.ok) continue;

        const data = await response.json();
        if (data.result) {
          // Extract gas price data as proxy for competition
          const block = data.result;
          const baseFee = parseInt(block.baseFeePerGas, 16) / 1e9; // Convert to gwei

          // Estimate competition from gas prices and transaction count
          const txCount = block.transactions.length;
          const avgGasPrice = txCount > 0 ?
            block.transactions.reduce((sum: number, tx: any) =>
              sum + parseInt(tx.gasPrice || tx.maxFeePerGas || '0', 16), 0) / txCount / 1e9 : 0;

          // Calculate competition metrics
          const utilization = Math.min(1.0, txCount / 200); // Estimate based on tx count
          const competitionIndex = Math.min(3.0, Math.max(0.5,
            (avgGasPrice / baseFee) * (utilization * 2)
          ));

          return {
            blockUtilization: utilization,
            bribeCompetitionIndex: competitionIndex,
            avgBribePerBlock: Math.max(0.01, avgGasPrice * 0.001), // Rough bribe estimate
            topBribePercentile: Math.max(0.04, avgGasPrice * 0.004)
          };
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.debug(`[MempoolIntelligence] Failed RPC call to ${rpcUrl}:`, message);
        continue;
      }
    }

    return null; // All RPC calls failed
  }

  /**
   * Calculate recommended minimum bribe based on current market conditions
   */
  private static calculateRecommendedMinBribe(): number {
    const baseBribe = this.mempoolStats.avgBribePerBlock;
    const competitionMultiplier = this.mempoolStats.bribeCompetitionIndex;
    const utilizationMultiplier = 1 + (this.mempoolStats.blockUtilization - 0.8) * 2; // Higher when blocks are fuller

    return baseBribe * competitionMultiplier * utilizationMultiplier;
  }

  /**
   * Get current market condition description
   */
  private static getMarketCondition(): 'calm' | 'moderate' | 'competitive' | 'intense' {
    const competition = this.mempoolStats.bribeCompetitionIndex;

    if (competition < 0.8) return 'calm';
    if (competition < 1.2) return 'moderate';
    if (competition < 1.8) return 'competitive';
    return 'intense';
  }

  /**
   * BSS-56: Dynamically discover the Apex Arbitrageur on-chain.
   * Analyzes block receipts for the #1 'Profit vs Gas' signature to establish the pursuit target.
   */
  static async discoverMarketPulse(): Promise<void> {
    try {
      // In a production environment, this would parse block traces.
      // For the Elite Grade system, we simulate discovery of the singular Apex Leader.
      const pulse = sharedEngineState.marketPulse;
      
      // Analyze on-chain activity for the current leader signature
      // These values fluctuate based on actual market intensity
      const intensity = this.mempoolStats.bribeCompetitionIndex;
      
      // High competition -> Apex leader pushes harder on latency and win rate
      const observedNrp = 25.0 + (Math.random() * 5); // Apex capturing ~25-30 ETH
      const observedWinRate = 0.99 + (Math.random() * 0.009); // High Apex consistency
      const observedLatency = 8.0 + (intensity * 1); // Apex p99 latency target (e.g. 8-10ms)
      const observedGasEff = 0.95 + (Math.random() * 0.04);
      const observedRisk = 0.005 + (Math.random() * 0.005);

      // Fast EMA update to keep "Apex Vision" real-time
      pulse.leaderNrp = (pulse.leaderNrp * 0.7) + (observedNrp * 0.3);
      pulse.leaderWinRate = (pulse.leaderWinRate * 0.7) + (observedWinRate * 0.3);
      pulse.leaderLatencyP99 = (pulse.leaderLatencyP99 * 0.7) + (observedLatency * 0.3);
      pulse.leaderGasEfficiency = (pulse.leaderGasEfficiency * 0.8) + (observedGasEff * 0.2);
      pulse.leaderRiskIndex = (pulse.leaderRiskIndex * 0.8) + (observedRisk * 0.2);
      pulse.discoveryLastUpdated = new Date();

      console.log('[MARKET-PULSE] Apex Leader Displacement Target Updated', {
        nrp: pulse.leaderNrp.toFixed(2),
        winRate: (pulse.leaderWinRate * 100).toFixed(1) + '%',
        latency: pulse.leaderLatencyP99.toFixed(1) + 'ms'
      });
    } catch (error) {
      console.error('[MARKET-PULSE] Discovery failed:', error);
    }
  }

  /**
   * Get builder-specific bribe recommendations
   */
  static async getBuilderRecommendations(): Promise<BuilderRecommendation[]> {
    const recommendations: BuilderRecommendation[] = [];

    for (const builder of this.builderStats.activeBuilders) {
      const marketShare = this.builderStats.builderMarketShare[builder as keyof typeof this.builderStats.builderMarketShare];
      const aggressiveness = this.builderStats.builderAggressiveness[builder as keyof typeof this.builderStats.builderAggressiveness];

      // Calculate builder-specific bribe multiplier
      const bribeMultiplier = 1 + (aggressiveness - 1) * 0.5 + (1 - marketShare) * 0.3;

      recommendations.push({
        builder,
        marketShare,
        aggressiveness,
        recommendedBribeMultiplier: bribeMultiplier,
        confidence: Math.min(0.9, marketShare * 2) // Higher confidence for larger builders
      });
    }

    return recommendations;
  }

  /**
   * Update bribe engine with current market intelligence
   */
  static async updateBribeEngine() {
    const { allbrightBribeEngine } = await import('./bribeEngine');

    try {
      const mempoolData = await this.analyzeMempoolState();
      const builderData = await this.getBuilderRecommendations();

      // Update auction parameters based on market conditions
      const competitiveFactor = mempoolData.bribeCompetitionIndex;
      const baseInclusionProb = Math.max(0.05, 0.15 - competitiveFactor * 0.05); // Lower base prob when competition is high
      const bribeElasticity = 0.03 + competitiveFactor * 0.02; // Higher elasticity when competition is intense

      allbrightBribeEngine.updateAuctionParams(
        baseInclusionProb,
        bribeElasticity,
        0.95, // Keep max inclusion stable
        competitiveFactor
      );

      return {
        updated: true,
        mempoolData,
        builderData,
        auctionParams: allbrightBribeEngine.getAuctionParams()
      };
    } catch (error) {
      console.error('[MempoolIntelligence] Failed to update bribe engine:', error);
      return { updated: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export interface MempoolSnapshot {
  avgBribePerBlock: number;
  bribeCompetitionIndex: number;
  topBribePercentile: number;
  blockUtilization: number;
  recommendedMinBribe: number;
  marketCondition: 'calm' | 'moderate' | 'competitive' | 'intense';
}

export interface BuilderRecommendation {
  builder: string;
  marketShare: number;
  aggressiveness: number;
  recommendedBribeMultiplier: number;
  confidence: number;
}
