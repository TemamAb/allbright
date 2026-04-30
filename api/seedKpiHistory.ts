import { db, kpiSnapshotsTable } from '@workspace/db';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max));
}

async function seedKpiHistory() {
  if (!db) {
    console.error('DB not connected');
    process.exit(1);
  }

  const now = Date.now();
  const cycles = 5;

  for (let i = 0; i < cycles; i++) {
    const timestamp = new Date(now - (cycles - i) * 24 * 60 * 60 * 1000);

    // Domain scores (healthy)
    const profit = clamp(920 + randInt(-15, 25), 0, 1000);
    const risk = clamp(945 + randInt(-15, 20), 0, 1000);
    const perf = clamp(930 + randInt(-20, 25), 0, 1000);
    const eff = clamp(940 + randInt(-15, 20), 0, 1000);
    const health = clamp(960 + randInt(-10, 15), 0, 1000);
    const autoopt = clamp(930 + randInt(-15, 25), 0, 1000);

    const totalWeighted = Math.round(
      profit * 0.25 + risk * 0.15 + perf * 0.20 + eff * 0.15 + health * 0.10 + autoopt * 0.05
    );

    // 36-KPI raw_stats — all tuned to meet or exceed targets
    const raw_stats = {
      currentDailyProfit: clamp(22 + randInt(-2, 4), 0, 100),
      avgProfitPerTrade: clamp(0.052 + randInt(-5, 10) / 1000, 0, 1),
      winRate: clamp(0.989 + randInt(-10, 10) / 1000, 0, 1),
      slippageCaptureBps: clamp(8 + randInt(-2, 4), 0, 100),
      spreadCapturePct: clamp(0.26 + randInt(-3, 6) / 100, 0, 1),
      riskAdjustedReturn: clamp(2.7 + randInt(-10, 20) / 100, 0, 10),

      inclusionLatencyMs: clamp(52 + randInt(-3, 6), 0, 500),
      avgLatencyMs: clamp(10 + randInt(-2, 3), 0, 100),
      alphaDecayAvgMs: clamp(82 + randInt(-3, 6), 0, 200),
      executionLatencyMs: clamp(68 + randInt(-3, 6), 0, 200),
      rpcSyncLagMs: clamp(0.8 + randInt(-1, 2) / 10, 0, 10),
      p99LatencyMs: clamp(88 + randInt(-4, 8), 0, 200),
      signalThroughputPerSec: clamp(1250 + randInt(-50, 150), 0, 5000),

      competitiveCollisionPct: clamp(0.5 + randInt(-2, 3) / 10, 0, 100),
      revertCostImpactPct: clamp(0.02 + randInt(-1, 2) / 100, 0, 1),
      mevDeflectionPct: clamp(0.997 + randInt(-1, 2) / 1000, 0, 1),
      currentDrawdown: clamp(0.15 + randInt(-5, 8) / 100, 0, 10),
      pnlVolatilityPct: clamp(0.9 + randInt(-3, 6) / 10, 0, 100),

      capitalTurnoverPctPerTrade: clamp(26 + randInt(-2, 4), 0, 100),
      capitalEfficiencyPct: clamp(92 + randInt(-3, 5), 0, 100),
      liquidityHitRatePct: clamp(97 + randInt(-2, 3), 0, 100),
      gasEfficiencyScore: clamp(0.97 + randInt(-3, 5) / 100, 0, 1),
      mevCaptureRatePct: clamp(96 + randInt(-2, 3), 0, 100),

      uptimePct: clamp(99.97 + randInt(-2, 2) / 100, 0, 100),
      rpcReliabilityPct: clamp(99.95 + randInt(-2, 3) / 10, 0, 100),
      failedTxRatePct: clamp(0.001 + randInt(0, 2) / 1000, 0, 1),
      rpcQuotaUsagePct: clamp(10 + randInt(-3, 5), 0, 100),
      bundlerSaturationPct: clamp(5 + randInt(-1, 2), 0, 100),

      simParityDeltaBps: clamp(0.7 + randInt(-1, 2) / 10, 0, 100),
      cycleAccuracyPct: clamp(99.2 + randInt(-2, 2) / 10, 0, 100),
      successRate: clamp(99.2 + randInt(-2, 3) / 10, 0, 100),
      riskGateRejectionsCount: 0,

      optDeltaImprovementPct: clamp(27 + randInt(-2, 4), 0, 100),
      perfGapThroughputPct: clamp(2 + randInt(-1, 2), 0, 100),
      walletEthBalance: clamp(52 + randInt(-3, 6), 0, 1000),
      opportunitiesDetected: clamp(5200 + randInt(-200, 400), 0, 20000)
    };

    await db.insert(kpiSnapshotsTable).values({
      timestamp,
      domain_score_profit: profit,
      domain_score_risk: risk,
      domain_score_perf: perf,
      domain_score_eff: eff,
      domain_score_health: health,
      domain_score_auto_opt: autoopt,
      total_weighted_score: totalWeighted,
      solver_latency_ms: Math.round(raw_stats.avgLatencyMs),
      gas_efficiency_bps: Math.round(raw_stats.gasEfficiencyScore * 10000),
      uptime_10x: Math.round(raw_stats.uptimePct * 10),
      raw_stats: raw_stats,
    });

    console.log(`[SEED] Cycle ${i + 1} — GES: ${(totalWeighted/10).toFixed(1)}% — ${timestamp.toISOString().slice(0,10)}`);
  }

  console.log('[SEED] All cycles inserted successfully');
  process.exit(0);
}

seedKpiHistory().catch(err => {
  console.error('[SEED] Error:', err);
  process.exit(1);
});
