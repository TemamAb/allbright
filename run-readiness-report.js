#!/usr/bin/env node
/**
 * SINGLE Unified Deployment Readiness Report Command
 * ALL AI agents/workflows use ONLY this command/report
 * Generates/appends to DEPLOYMENT-READINESS-REPORT.md master table
 */

import { generateDeploymentReadinessReport } from './api/src/services/deploy_gatekeeper.js';

async function main() {
  const report = await generateDeploymentReadinessReport();
  
  const tableRow = `| ${Date.now()} | ${new Date().toISOString()} | ${report.overallStatus} | ${report.deploymentScore.toFixed(1)} | ${Object.values(report.executionStages).every(s => s.status === 'PASS') ? 'ALL✓' : 'FAIL'} | ${report.kpiBreakdown.map(d => d.status).join('/')} | ${Object.values(report.services).map(s => s.health[0]).join('')} | ${report.gates.length} gates | ${report.issues.length} | ${report.recommendations.slice(0,2).join('; ')} |`;
  
  console.log(tableRow);
  
  // Append to master report
  const fs = await import('fs');
  const masterReport = 'DEPLOYMENT-READINESS-REPORT.md';
  fs.appendFileSync(masterReport, `\n${tableRow}`);
  console.log(`\n✅ Appended to ${masterReport} | Report #${report.executionTimeline.length}`);
}

main().catch(console.error);
