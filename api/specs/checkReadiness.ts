import { runMasterDeploymentReadinessAnalysis } from '../src/services/deploy_gatekeeper';
import { sharedEngineState } from '../src/services/engineState';
import { db, kpiSnapshotsTable } from '@workspace/db';
import { desc } from 'drizzle-orm';
import { execSync } from 'node:child_process';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

/**
 * CLI Tool to run the Master Deployment Readiness Analysis
 * and output a formatted report for terminal use.
 */
async function checkReadiness() {
  const isHook = process.argv.includes('--hook');

  console.log(`${colors.bold}${colors.cyan}=== BrightSky Master Deployment Readiness Analysis ===${colors.reset}\n`);

  try {
    // BSS-43: STANDALONE HYDRATION
    // If this tool is running in a separate process from the main engine, sharedEngineState
    // will be initialized with defaults. We pull the latest KPI snapshot from the DB
    // to ensure the readiness report uses real-time metrics.
    if (db) {
      const latest = await db.select().from(kpiSnapshotsTable).orderBy(desc(kpiSnapshotsTable.timestamp)).limit(1);
      if (latest.length > 0) {
        const snap = latest[0];
        sharedEngineState.totalWeightedScore = Number(snap.total_weighted_score) / 10;
        sharedEngineState.currentDailyProfit = Number(snap.domain_score_profit);
        sharedEngineState.avgLatencyMs = Number(snap.solver_latency_ms);
        sharedEngineState.riskIndex = Number(snap.domain_score_risk) / 1000;
        sharedEngineState.nextOptimizationCycle = (snap.raw_stats as any)?.next_opt_cycle || null;
        console.log(`${colors.cyan}[INFO] Hydrated metrics from latest DB snapshot: ${snap.timestamp.toLocaleString()}${colors.reset}\n`);
      }
    }

    // This service call already logs the coverage breakdown by module root
    const report = await runMasterDeploymentReadinessAnalysis();

    const statusColor = 
      report.overallStatus === 'READY_FOR_DEPLOYMENT' ? colors.green :
      report.overallStatus === 'BLOCKED' ? colors.red : colors.yellow;

    console.log(`${colors.bold}Overall Status: ${statusColor}${report.overallStatus}${colors.reset}`);
    console.log(`Generated At: ${report.generatedAt.toLocaleString()}`);
    console.log(`Authorization Mode: ${colors.bold}${report.authorizationMode}${colors.reset}`);
    console.log(`Deployment Authorized: ${report.deploymentAuthorized ? colors.green + 'YES' : colors.red + 'NO'}${colors.reset}\n`);

    // Display Global Efficiency Score (GES) based on 36-KPI Matrix if available
    if (report.globalEfficiencyScore !== undefined) {
      const gesColor = report.globalEfficiencyScore >= 0.825 ? colors.green : colors.red;
      console.log(`${colors.bold}Global Efficiency Score (GES): ${gesColor}${(report.globalEfficiencyScore * 100).toFixed(2)}%${colors.reset} (Threshold: 82.50%)\n`);
    }

    console.log(`${colors.bold}--- Gate Analysis Summary ---${colors.reset}`);
    console.log(`Total Gates: ${report.summary.totalGates}`);
    console.log(`Auto-Approved: ${colors.green}${report.summary.autoApproved}${colors.reset}`);
    console.log(`Approved: ${colors.green}${report.summary.approved}${colors.reset}`);
    console.log(`Pending Approval: ${colors.yellow}${report.summary.pendingHumanApproval}${colors.reset}`);
    console.log(`Failed Checks: ${colors.red}${report.summary.failedAutomatedChecks}${colors.reset}\n`);

// Tabular KPI History (Cycle Comparison)
    if (report.kpiHistory && report.kpiHistory.length > 0) {
      console.log(`${colors.bold}--- KPI History Table (Cycle Comparison) ---${colors.reset}`);
      const domains = [...new Set(report.kpiHistory[0].kpiBreakdown.map((d: any) => d.domain))];
      const cycles = report.kpiHistory.map(h => h.cycle);
      console.log('Domain'.padEnd(15) + ' | ' + cycles.map(c => `Cycle ${c}`.padEnd(10)).join(' | ') + ' | Latest | Delta');
      console.log('-'.repeat(120));
      domains.forEach(domain => {
        const latestScore = report.kpiBreakdown.find((d: any) => d.domain === domain)?.score * 100 || 0;
        const row = domain.padEnd(15) + ' | ';
        const cycleScores = cycles.map(c => {
          const hist = report.kpiHistory.find((h: any) => h.cycle === c);
          const score = hist?.kpiBreakdown.find((d: any) => d.domain === domain)?.score * 100 || 0;
          return score.toFixed(1).padEnd(10);
        });
        const delta = cycleScores.length > 1 ? (latestScore - parseFloat(cycleScores[cycleScores.length - 2])).toFixed(1) : 'N/A';
        console.log(row + cycleScores.join(' | ') + ' | ' + latestScore.toFixed(1).padEnd(6) + ' | ' + delta);
      });
      console.log('');
    }
    // Legacy domain breakdown
    if (report.kpiBreakdown && report.kpiBreakdown.length > 0) {
      console.log(`${colors.bold}--- Current Cycle Breakdown ---${colors.reset}`);
      report.kpiBreakdown.forEach(domain => {
        const scoreColor = 
          domain.status === 'OPTIMAL' ? colors.green :
          domain.status === 'DEGRADED' ? colors.yellow : colors.red;
        
        console.log(`${colors.bold}${domain.domain.padEnd(20)}${colors.reset} Score: ${scoreColor}${(domain.score * 100).toFixed(1)}%${colors.reset} Status: [${scoreColor}${domain.status}${colors.reset}]`);
      });
      console.log('');
    }

    console.log(`${colors.bold}--- Gate Details ---${colors.reset}`);
    report.gates.forEach(gate => {
      const gateStatusColor = 
        gate.status === 'AUTO_APPROVED' || gate.status === 'APPROVED' ? colors.green :
        gate.status === 'FAILED_AUTOMATED_CHECKS' ? colors.red : colors.yellow;
      
      console.log(`${colors.bold}${gate.gateId.padEnd(20)}${colors.reset} [${gateStatusColor}${gate.status.padEnd(25)}${colors.reset}] Risk: ${gate.riskAssessment}`);
      
      // List failed automated checks for this specific gate
      if (gate.status === 'FAILED_AUTOMATED_CHECKS') {
        gate.automatedChecks.filter(c => c.status === 'FAIL').forEach(check => {
          console.log(`  ${colors.red}✖${colors.reset} ${check.checkName}: ${check.details}`);
        });
      }
    });

    if (report.issues.length > 0) {
      console.log(`\n${colors.bold}${colors.red}--- Critical Issues ---${colors.reset}`);
      report.issues.forEach(issue => console.log(`${colors.red}•${colors.reset} ${issue}`));
    }

    if (report.recommendations.length > 0) {
      console.log(`\n${colors.bold}${colors.blue}--- Recommendations ---${colors.reset}`);
      report.recommendations.forEach(rec => console.log(`${colors.blue}→${colors.reset} ${rec}`));
    }

    console.log(`\n${colors.bold}${colors.cyan}======================================================${colors.reset}`);

    // Implementation of the "ALLOW" command for Git Push (Skipped in hook mode to avoid recursion)
    if (!isHook && report.overallStatus === 'READY_FOR_DEPLOYMENT') {
      const rl = readline.createInterface({ input, output });
      const answer = await rl.question(`\n${colors.bold}${colors.yellow}ACTION REQUIRED: Type "ALLOW" to trigger Git Push or any other key to cancel: ${colors.reset}`);
      
      if (answer.trim().toUpperCase() === 'ALLOW') {
        try {
          console.log(`\n${colors.cyan}Triggering Git Push...${colors.reset}`);
          execSync('git push --no-verify', { stdio: 'inherit' });
          console.log(`\n${colors.green}${colors.bold}✔ Push successful. Deployment initiated.${colors.reset}`);
        } catch (pushError: any) {
          console.error(`\n${colors.red}${colors.bold}✖ Git push failed:${colors.reset} ${pushError.message}`);
          rl.close();
          process.exit(1);
        }
      }
      rl.close();
    }

    // Exit with non-zero if not ready for deployment
    if (report.overallStatus !== 'READY_FOR_DEPLOYMENT') {
      process.exit(1);
    }
    process.exit(0);
  } catch (error: any) {
    console.error(`\n${colors.red}${colors.bold}FATAL ERROR during analysis:${colors.reset}`, error.message);
    process.exit(1);
  }
}

checkReadiness();