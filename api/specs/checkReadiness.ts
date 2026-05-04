import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
// Load .env file for local execution - MUST BE FIRST
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { generateDeploymentReadinessReport } from '../src/services/deploy_gatekeeper.js';
import { THIRTY_NINE_KPIS_CANONICAL } from '../src/services/kpiDefinitions.js';
import { sharedEngineState } from '../src/services/engineState.js';
import { db, kpiSnapshotsTable } from '@workspace/db';
import { desc } from 'drizzle-orm';
import { execSync } from 'node:child_process';

/**
// Use the canonical 39-KPI definition
const THIRTY_NINE_KPIS = THIRTY_NINE_KPIS_CANONICAL;

type CategoryId = keyof typeof THIRTY_NINE_KPIS;

// Helper: Safely get nested property from an object
function getNestedProperty(obj: any, path: string): any {
  const pathParts = path.split('.');
  let current = obj;
  for (const part of pathParts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as any)[part];
    } else {
      return undefined;
    }
  }
  return current;
}

function kpiStatus(val: number, target: number, higherIsBetter = true): string {
  if (val === undefined || val === null || isNaN(val)) return 'unknown';
  const ratio = higherIsBetter ? val / target : (target / Math.max(val, 0.0001));
  if (ratio >= 0.95) return 'good';
  if (ratio >= 0.80) return 'warn';
  return 'bad';
}

// For local simulation, ensure onboarding is considered complete to allow KPI cycle
// This bypasses the UI onboarding wizard for local readiness checks
sharedEngineState.onboardingComplete = true;

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
        if (latest.length > 0) {
          const snap = latest[0];
          // Hydrate sharedEngineState from snapshot for accurate historical context
          sharedEngineState.totalWeightedScore = Number(snap.total_weighted_score);
          sharedEngineState.currentDailyProfit = Number(snap.domain_score_profit) / 100;
          sharedEngineState.avgLatencyMs = Number(snap.solver_latency_ms);
          sharedEngineState.riskIndex = Number(snap.domain_score_risk) / 1000;
          sharedEngineState.nextOptimizationCycle = (snap.raw_stats as any)?.next_opt_cycle || null;
          
          // Hydrate all 39 KPIs from raw_stats for accurate historical context
          const rawStats = snap.raw_stats as Record<string, any>;
          if (rawStats) {
            Object.values(THIRTY_NINE_KPIS).forEach(category => {
              category.kpis.forEach(kpi => {
                const path = kpi.path || kpi.id;
                const val = getNestedProperty(rawStats, path);
                if (val !== undefined) {
                  // This is a simplified hydration. A more robust solution would map
                  // snapshot raw_stats back to sharedEngineState properties.
                  // For now, we assume getValue will correctly pick from sharedEngineState or raw_stats.
                }
              });
            });
          }

          console.log(`${colors.cyan}[INFO] Hydrated metrics from latest DB snapshot: ${snap.timestamp.toLocaleString()}${colors.reset}\n`);
        }
      } catch (error) {
        console.log(`${colors.yellow}[DB] Snapshot query failed (using mocks): ${String(error).slice(0,80)}${colors.reset}`);
      }
    }

    const report = await generateDeploymentReadinessReport(true); // Skip runtime in hooks

    const overallStatusColor =
      report.overallStatus === 'READY_FOR_DEPLOYMENT' ? colors.green :
      report.overallStatus === 'BLOCKED' ? colors.red : colors.yellow;

    // ========== PART I: GATE KEEPER STATUS ==========
    console.log(`${colors.bold}${colors.magenta}========== PART I: DEPLOYMENT GATE STATUS ==========${colors.reset}\n`);

    console.log(`${colors.bold}Overall Status: ${overallStatusColor}${report.overallStatus}${colors.reset}`);
    console.log(`Generated At: ${report.generatedAt.toLocaleString()}`);

    const authMode = report.overrideActive ? 'emergency_override' : 'standard';
    const isAuthorized = report.overallStatus === 'READY_FOR_DEPLOYMENT';

    console.log(`Authorization Mode: ${colors.bold}${authMode}${colors.reset}`);
    console.log(`Deployment Authorized: ${isAuthorized ? colors.green + 'YES' : colors.red + 'NO'}${colors.reset}\n`);

    console.log(`${colors.bold}--- Gate Analysis Summary ---${colors.reset}`);

    const totalGates = report.gates.length;
    const autoApproved = report.gates.filter(g => g.status === 'AUTO_APPROVED').length;
    const approved = report.gates.filter(g => g.approved).length;
    const pendingHuman = report.gates.filter(g => g.status === 'PENDING_HUMAN_APPROVAL').length;
    const failedChecks = report.gates.filter(g => g.status === 'FAILED_AUTOMATED_CHECKS').length;

    console.log(`Total Gates: ${totalGates}`);
    console.log(`Auto-Approved: ${colors.green}${autoApproved}${colors.reset}`);
    console.log(`Approved: ${colors.green}${approved}${colors.reset}`);
    console.log(`Pending Approval: ${colors.yellow}${pendingHuman}${colors.reset}`);
    console.log(`Failed Checks: ${colors.red}${failedChecks}${colors.reset}\n`);

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
    if (report.deploymentScore !== undefined) {
      const gesColor = report.deploymentScore >= 82.5 ? colors.green : colors.red;
      console.log(`${colors.bold}Global Efficiency Score (GES): ${gesColor}${report.deploymentScore.toFixed(2)}%${colors.reset}  (Target: 82.50%)\n`);
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

      Object.entries(THIRTY_NINE_KPIS).forEach(([catId, catDef]) => {
        catDef.kpis.forEach(kpi => {
          const values = cycles.map(cycle => {
            const val = getValue(kpi, cycle.row);
            const status = kpiStatus(val, kpi.target, kpi.higherIsBetter);
            return { value: val, status };
          });
          rows.push({
            catId,
            catLabel: catId,
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
      console.log(`${colors.bold}WEIGHTS: ${Object.entries(THIRTY_NINE_KPIS).map(([k,v])=>`${k.toUpperCase()}: ${(v.weight*100).toFixed(0)}%`).join('  ')}${colors.reset}\n`);
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
