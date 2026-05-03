import { runMasterDeploymentReadinessAnalysis } from '../src/services/deploy_gatekeeper.js';
import { sharedEngineState } from '../src/services/engineState.js';
import { db, kpiSnapshotsTable } from '@workspace/db';
import { desc } from 'drizzle-orm';
import { execSync } from 'node:child_process';

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
  white: '\x1b[97m'
};

/**
 * Canonical 36-KPI Matrix (weighted by category)
 * Derived from ui/src/types/kpi.ts THIRTY_SIX_KPIS
 */
const THIRTY_SIX_KPIS = {
  profitability: {
    label: 'PROFITABILITY',
    weight: 0.25,
    kpis: [
      { id: 'nrp', name: 'Net Realized Profit (NRP)', path: 'currentDailyProfit', transform: (v: number) => v, target: 22.5, unit: 'ETH/day', higherIsBetter: true },
      { id: 'avg_profit_per_trade', name: 'Avg Profit per Trade', path: 'avgProfitPerTrade', target: 0.05, unit: 'ETH', higherIsBetter: true },
      { id: 'win_rate', name: 'Execution Success Rate', path: 'winRate', transform: (v) => v * 100, target: 98.8, unit: '%', higherIsBetter: true },
      { id: 'slippage_capture_bps', name: 'Slippage Capture', path: 'slippageCaptureBps', target: 12, unit: 'bps', higherIsBetter: false },
      { id: 'spread_capture_pct', name: 'Spread Capture', path: 'spreadCapturePct', target: 0.25, unit: '%', higherIsBetter: true },
      { id: 'risk_adjusted_return', name: 'Risk-Adjusted Return', path: 'riskAdjustedReturn', target: 2.65, unit: 'ratio', higherIsBetter: true }
    ]
  },
  timing: {
    label: 'TIMING / PERFORMANCE',
    weight: 0.20,
    kpis: [
      { id: 'inclusion_latency_ms', name: 'Inclusion Latency (Total)', path: 'inclusionLatencyMs', target: 65, unit: 'ms', higherIsBetter: false },
      { id: 'solver_latency_ms', name: 'Solver Latency (p99)', path: 'avgLatencyMs', target: 12, unit: 'ms', higherIsBetter: false },
      { id: 'alpha_decay_ms', name: 'Alpha Decay Rate', path: 'alphaDecayAvgMs', target: 90, unit: 'ms', higherIsBetter: false },
      { id: 'execution_latency_ms', name: 'Execution Latency', path: 'executionLatencyMs', target: 80, unit: 'ms', higherIsBetter: false },
      { id: 'rpc_sync_lag_ms', name: 'RPC Sync Lag', path: 'rpcSyncLagMs', target: 1.5, unit: 'ms', higherIsBetter: false },
      { id: 'p99_latency_ms', name: 'p99 Latency', path: 'p99LatencyMs', target: 100, unit: 'ms', higherIsBetter: false },
      { id: 'signal_throughput', name: 'Signal Throughput', path: 'signalThroughputPerSec', target: 1200, unit: 'msg/s', higherIsBetter: true }
    ]
  },
  risk: {
    label: 'RISK',
    weight: 0.15,
    kpis: [
      { id: 'competitive_collision_pct', name: 'Competitive Collision Rate', path: 'competitiveCollisionPct', target: 0.8, unit: '%', higherIsBetter: false },
      { id: 'revert_cost_impact_pct', name: 'Revert Cost Impact', path: 'revertCostImpactPct', target: 0.05, unit: '%', higherIsBetter: false },
      { id: 'mev_deflection_pct', name: 'MEV Deflection Rate', path: 'mevDeflectionPct', target: 99.9, unit: '%', higherIsBetter: true },
      { id: 'daily_drawdown_eth', name: 'Daily Drawdown Limit', path: 'currentDrawdown', target: 0.4, unit: 'ETH', higherIsBetter: false },
      { id: 'pnl_volatility_pct', name: 'P&L Volatility', path: 'pnlVolatilityPct', target: 1.0, unit: '%', higherIsBetter: false }
    ]
  },
  capital: {
    label: 'CAPITAL / EFFICIENCY',
    weight: 0.15,
    kpis: [
      { id: 'capital_turnover_pct', name: 'Capital Turnover Speed', path: 'capitalTurnoverPctPerTrade', target: 25, unit: '%/trade', higherIsBetter: true },
      { id: 'capital_efficiency_pct', name: 'Capital Efficiency', path: 'capitalEfficiencyPct', target: 90, unit: '%', higherIsBetter: true },
      { id: 'liquidity_hit_rate_pct', name: 'Liquidity Hit Rate', path: 'liquidityHitRatePct', target: 97.5, unit: '%', higherIsBetter: true },
      { id: 'gas_efficiency_ratio_pct', name: 'Gas Efficiency Ratio', path: 'gasEfficiencyScore', transform: (v) => v * 100, target: 96.5, unit: '%', higherIsBetter: true },
      { id: 'mev_capture_rate_pct', name: 'MEV Capture Rate', path: 'mevCaptureRatePct', target: 95, unit: '%', higherIsBetter: true }
    ]
  },
  system: {
    label: 'SYSTEM HEALTH',
    weight: 0.10,
    kpis: [
      { id: 'uptime_pct', name: 'Uptime', path: 'uptimePct', target: 99.99, unit: '%', higherIsBetter: true },
      { id: 'rpc_reliability_pct', name: 'RPC Reliability', path: 'rpcReliabilityPct', target: 99.9, unit: '%', higherIsBetter: true },
      { id: 'failed_tx_rate_pct', name: 'Failed TX Rate', path: 'failedTxRatePct', target: 0.5, unit: '%', higherIsBetter: false },
      { id: 'rpc_quota_usage_pct', name: 'RPC Quota Usage', path: 'rpcQuotaUsagePct', target: 15.0, unit: '%', higherIsBetter: false },
      { id: 'bundler_saturation_pct', name: 'Bundler Saturation', path: 'bundlerSaturationPct', target: 8.0, unit: '%', higherIsBetter: false }
    ]
  },
  simulation: {
    label: 'SIMULATION / VALIDATION',
    weight: 0.10,
    kpis: [
      { id: 'sim_parity_delta_bps', name: 'Sim Parity Delta', path: 'simParityDeltaBps', target: 1.0, unit: 'bps', higherIsBetter: false },
      { id: 'cycle_accuracy_pct', name: 'Cycle Accuracy', path: 'cycleAccuracyPct', target: 98, unit: '%', higherIsBetter: true },
      { id: 'sim_success_rate_pct', name: 'Sim Success Rate', path: 'successRate', target: 99, unit: '%', higherIsBetter: true },
      { id: 'risk_gate_rejections', name: 'Risk Gate Rejections', path: 'riskGateRejectionsCount', target: 1, unit: 'count', higherIsBetter: false }
    ]
  },
  autoopt: {
    label: 'AUTOOPT / DASHBOARD',
    weight: 0.05,
    kpis: [
      { id: 'opt_delta_improvement_pct', name: 'Opt Delta Improvement', path: 'optDeltaImprovementPct', target: 25, unit: '%', higherIsBetter: true },
      { id: 'perf_gap_throughput_pct', name: 'Perf Gap Throughput', path: 'perfGapThroughputPct', target: 5, unit: '%', higherIsBetter: false },
      { id: 'wallet_eth_balance', name: 'Wallet ETH Balance', path: 'walletEthBalance', target: 50, unit: 'ETH', higherIsBetter: true },
      { id: 'opportunities_found', name: 'Opportunities Found', path: 'opportunitiesDetected', target: 5000, unit: 'count', higherIsBetter: true }
    ]
  }
} as const;

type CategoryId = keyof typeof THIRTY_SIX_KPIS;

function kpiStatus(val: number, target: number, higherIsBetter = true): string {
  if (val === undefined || val === null || isNaN(val)) return 'unknown';
  const ratio = higherIsBetter ? val / target : (target / Math.max(val, 0.0001));
  if (ratio >= 0.95) return 'good';
  if (ratio >= 0.80) return 'warn';
  return 'bad';
}

function statusColor(status: string): string {
  switch (status) {
    case 'good': return colors.green;
    case 'warn': return colors.yellow;
    case 'bad': return colors.red;
    default: return colors.gray;
  }
}

async function checkReadiness() {
  console.log(`${colors.bold}${colors.cyan}=== allbright Master Deployment Readiness Analysis ===${colors.reset}\n`);

  try {
    if (db) {
      let latest = [];
      try {
        latest = await db.select().from(kpiSnapshotsTable).orderBy(desc(kpiSnapshotsTable.timestamp)).limit(1);
      } catch (error) {
        console.log(`${colors.yellow}[DB] Snapshot query failed (using mocks): ${String(error).slice(0,80)}${colors.reset}`);
      }
      if (latest.length > 0) {
        const snap = latest[0];
        sharedEngineState.totalWeightedScore = Number(snap.total_weighted_score) / 10;
        sharedEngineState.currentDailyProfit = Number(snap.domain_score_profit) / 100;
        sharedEngineState.avgLatencyMs = Number(snap.solver_latency_ms);
        sharedEngineState.riskIndex = Number(snap.domain_score_risk) / 1000;
        sharedEngineState.nextOptimizationCycle = (snap.raw_stats as any)?.next_opt_cycle || null;
        console.log(`${colors.cyan}[INFO] Hydrated metrics from latest DB snapshot: ${snap.timestamp.toLocaleString()}${colors.reset}\n`);
      }
    }

    const report = await runMasterDeploymentReadinessAnalysis(true); // Skip runtime in hooks

    const overallStatusColor =
      report.overallStatus === 'READY_FOR_DEPLOYMENT' ? colors.green :
      report.overallStatus === 'BLOCKED' ? colors.red : colors.yellow;

    // ========== PART I: GATE KEEPER STATUS ==========
    console.log(`${colors.bold}${colors.magenta}========== PART I: DEPLOYMENT GATE STATUS ==========${colors.reset}\n`);

    console.log(`${colors.bold}Overall Status: ${overallStatusColor}${report.overallStatus}${colors.reset}`);
    console.log(`Generated At: ${report.generatedAt.toLocaleString()}`);
    console.log(`Authorization Mode: ${colors.bold}${report.authorizationMode}${colors.reset}`);
    console.log(`Deployment Authorized: ${report.deploymentAuthorized ? colors.green + 'YES' : colors.red + 'NO'}${colors.reset}\n`);

    console.log(`${colors.bold}--- Gate Analysis Summary ---${colors.reset}`);
    console.log(`Total Gates: ${report.summary.totalGates}`);
    console.log(`Auto-Approved: ${colors.green}${report.summary.autoApproved}${colors.reset}`);
    console.log(`Approved: ${colors.green}${report.summary.approved}${colors.reset}`);
    console.log(`Pending Approval: ${colors.yellow}${report.summary.pendingHumanApproval}${colors.reset}`);
    console.log(`Failed Checks: ${colors.red}${report.summary.failedAutomatedChecks}${colors.reset}\n`);

    console.log(`${colors.bold}--- Gate Details ---${colors.reset}`);
    report.gates.forEach(gate => {
      const gateColor = gate.status === 'AUTO_APPROVED' || gate.status === 'APPROVED' ? colors.green : colors.red;
      console.log(`  ${gate.gateId.padEnd(25)} [${gateColor}${gate.status.padEnd(25)}${colors.reset}] Risk: ${gate.riskAssessment}`);
      if (gate.status === 'FAILED_AUTOMATED_CHECKS') {
        gate.automatedChecks.filter(c => c.status === 'FAIL').forEach(check => {
          console.log(`    ${colors.red}✖${colors.reset} ${check.checkName}: ${check.details}`);
        });
      }
    });
    console.log('');

    if (report.issues.length > 0) {
      console.log(`${colors.bold}${colors.red}--- Critical Issues ---${colors.reset}`);
      report.issues.forEach(issue => console.log(`${colors.red}•${colors.reset} ${issue}`));
      console.log('');
    }

    if (report.recommendations.length > 0) {
      console.log(`${colors.bold}${colors.blue}--- Recommendations ---${colors.reset}`);
      report.recommendations.forEach(rec => console.log(`${colors.blue}→${colors.reset} ${rec}`));
      console.log('');
    }

    // ========== PART II: 36-KPI MULTI-CYCLE MATRIX ==========
    console.log(`${colors.bold}${colors.cyan}========== PART II: 36-KPI MULTI-CYCLE MATRIX ==========${colors.reset}\n`);

    // GES
    if (report.globalEfficiencyScore !== undefined) {
      const gesColor = report.globalEfficiencyScore >= 0.825 ? colors.green : colors.red;
      console.log(`${colors.bold}Global Efficiency Score (GES): ${gesColor}${(report.globalEfficiencyScore * 100).toFixed(2)}%${colors.reset}  (Target: 82.50%)\n`);
    }

    // Fetch last N cycles from DB
    let kpiHistoryRows = [];
    try {
      kpiHistoryRows = await db.select()
        .from(kpiSnapshotsTable)
        .orderBy(desc(kpiSnapshotsTable.timestamp))
        .limit(10);
    } catch (error) {
      console.log(`${colors.yellow}[DB] History query skipped: ${String(error).slice(0,80)}${colors.reset}`);
    }

    if (kpiHistoryRows.length === 0) {
      console.log(`${colors.yellow}No KPI history available — run multiple cycles to populate table.${colors.reset}\n`);
    } else {
      // Build cycles array (C1 = newest, C2 = previous, ...)
      const cycles = kpiHistoryRows.map((row, idx) => ({
        num: idx + 1,
        row
      }));

      // Helper: extract KPI value from raw_stats or fallback to column
      function getValue(kpi: any, snapshot: any): number {
        const raw = snapshot.raw_stats as Record<string, any> | undefined;
        if (raw && kpi.path in raw) {
          return kpi.transform ? kpi.transform(raw[kpi.path]) : Number(raw[kpi.path] || 0);
        }
        // Fallback to domain_score columns
        switch (kpi.path) {
          case 'currentDailyProfit': return snapshot.domain_score_profit / 100;
          case 'avgLatencyMs': return snapshot.solver_latency_ms;
          case 'domainScoreProfit': return snapshot.domain_score_profit / 100;
          case 'domainScorePerf': return snapshot.domain_score_perf / 100;
          case 'domainScoreRisk': return snapshot.domain_score_risk / 1000;
          case 'domainScoreEff': return snapshot.domain_score_eff / 100;
          case 'domainScoreHealth': return snapshot.domain_score_health / 100;
          case 'gasEfficiencyScore': return (snapshot.gas_efficiency_bps || 9800) / 100;
          case 'totalWeightedScore': return snapshot.total_weighted_score / 10;
          default: return 0;
        }
      }

      // Build row data: 36 rows
      const rows: Array<{
        catId: string;
        catLabel: string;
        kpiName: string;
        unit: string;
        target: number;
        higherIsBetter: boolean;
        values: Array<{ value: number; status: string }>
      }> = [];

      Object.entries(THIRTY_SIX_KPIS).forEach(([catId, catDef]) => {
        catDef.kpis.forEach(kpi => {
          const values = cycles.map(cycle => {
            const val = getValue(kpi, cycle.row);
            const status = kpiStatus(val, kpi.target, kpi.higherIsBetter);
            return { value: val, status };
          });
          rows.push({
            catId,
            catLabel: catDef.label,
            kpiName: kpi.name,
            unit: kpi.unit,
            target: kpi.target,
            higherIsBetter: kpi.higherIsBetter,
            values
          });
        });
      });

      // Render table
      const colPrefix = '  ';
      const domainW = 14;
      const kpiW = 42;
      const cycW = 14;
      const lastW = 20;

      // Header
      const header = `${colPrefix}${'CATEGORY'.padEnd(domainW)} | ${'KPI'.padEnd(kpiW)} | ${cycles.map(c => `─ CYC ${c.num} `.padEnd(cycW)).join('│ ')} | ${'LATEST VALUE / STATUS'.padEnd(lastW)} | DELTA`;
      const sep = `${colPrefix}${'-'.repeat(domainW)}-|-${'-'.repeat(kpiW)}-|-${'-'.repeat(cycW).repeat(cycles.length).replace(/.$/, '-')} | ${'-'.repeat(lastW)}-|-${'-'.repeat(5)}`;
      console.log(header);
      console.log(sep);

      let lastCat = '';
      rows.forEach(row => {
        if (row.catId !== lastCat) {
          lastCat = row.catId;
          console.log(`${colPrefix}${colors.bold}${row.catLabel.padEnd(domainW + kpiW + cycles.length * (cycW + 3) + lastW + 8)}${colors.reset}`);
        }

        const cycleCells = row.values.map(v => {
          const col = statusColor(v.status);
          return `${col}${v.value.toFixed(2).padEnd(cycW)}${colors.reset}`;
        }).join('│ ');

        const latest = row.values[0];
        const latestStr = `${statusColor(latest.status)}${latest.value.toFixed(2).padEnd(10)}${colors.reset} [${latest.status === 'good' ? colors.green : latest.status === 'warn' ? colors.yellow : colors.red}${latest.status.padEnd(6)}${colors.reset}]`;

        const delta = row.values.length > 1 ? (row.values[0].value - row.values[1].value).toFixed(2) : 'N/A';

        console.log(`${colPrefix}${row.catId.padEnd(domainW)} | ${row.kpiName.padEnd(kpiW)} | ${cycleCells} | ${latestStr.padEnd(lastW)} | ${delta}`);
      });

      console.log('');
      console.log(`${colors.bold}COLOR KEY: ${colors.green}✔ good (≥95% of target)  ${colors.yellow}⚠ warn (80–94%)  ${colors.red}✖ bad (<80%)${colors.reset}`);
      console.log(`${colors.bold}WEIGHTS: ${Object.entries(THIRTY_SIX_KPIS).map(([k,v])=>`${v.label}: ${(v.weight*100).toFixed(0)}%`).join('  ')}${colors.reset}\n`);
    }

    // Exit handling
    if (report.overallStatus !== 'READY_FOR_DEPLOYMENT') process.exit(1);
    process.exit(0);

  } catch (error: any) {
    console.error(`${colors.red}FATAL: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

checkReadiness();
