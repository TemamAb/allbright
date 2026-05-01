import { AlphaCopilot } from './alphaCopilot.js';
import { gateKeeper, getDeploymentCriticalFiles, DEPLOYMENT_MODULE_ROOTS } from './gateKeeper.js';
import { sharedEngineState } from './engineState.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const alphaCopilot = new AlphaCopilot();
const MASTER_DEPLOYMENT_GATES = ['CODE_QUALITY', 'INFRASTRUCTURE', 'SECURITY', 'PERFORMANCE', 'BUSINESS'] as const;

type MasterGateId = typeof MASTER_DEPLOYMENT_GATES[number];

export interface MasterGateAnalysis {
  gateId: MasterGateId;
  gateName: string;
  status: 'APPROVED' | 'PENDING_HUMAN_APPROVAL' | 'FAILED_AUTOMATED_CHECKS' | 'AUTO_APPROVED';
  approved: boolean;
  requiresHumanApproval: boolean;
  riskAssessment: string;
  automatedChecks: Array<{
    checkId: string;
    checkName: string;
    status: 'PASS' | 'FAIL' | 'WARN';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    details: string;
  }>;
  nextAction: string;
}

export interface MasterDeploymentReadinessReport {
  generatedAt: Date;
  overallStatus: 'READY_FOR_DEPLOYMENT' | 'PENDING_APPROVALS' | 'BLOCKED';
  deploymentAuthorized: boolean;
  authorizationMode: 'standard' | 'emergency_override' | 'blocked';
  summary: {
    totalGates: number;
    autoApproved: number;
    approved: number;
    pendingHumanApproval: number;
    failedAutomatedChecks: number;
  };
  gates: MasterGateAnalysis[];
  passedAutomatically: string[];
  blockedByFailedChecks: string[];
  pendingHumanApproval: string[];
  missingApprovals: string[];
  orchestratorsStatus: {
    alphaCopilot: boolean;
    gateKeeper: boolean;
    specialists: boolean;
    sourceFiles: boolean;
  };
  fileVerification: {
    allFilesPresent: boolean;
    missingFiles: string[];
    fileErrors: string[];
  };
  issues: string[];
  recommendations: string[];
  coverageByModuleRoot: Record<string, number>;
  globalEfficiencyScore?: number; // Added to reflect AlphaCopilot's calculation
  kpiBreakdown?: {
    domain: string;
    score: number;
    status: 'OPTIMAL' | 'DEGRADED' | 'CRITICAL';
    metrics: Record<string, any>;
  }[];
}

/**
 * Legacy deployment gate - now integrates with comprehensive gate keeper system
 * @deprecated Use gateKeeper.isDeploymentAuthorized() instead
 */
export async function deployGate() {
  console.warn('[DEPRECATED] deployGate() called - use gateKeeper.isDeploymentAuthorized() instead');

  // Request comprehensive gate approval
  const gateApproval = await alphaCopilot.requestGateApproval('BUSINESS', {
    source: 'legacy_deploy_gate',
    reason: 'Legacy deployment gate check'
  });

  if (gateApproval.approved) {
    // Also run the original checks for backward compatibility
    const results = await alphaCopilot.fullKpiTuneCycle({});
    const rustResult = await alphaCopilot.orchestrateSpecialists('RustCompile', {});

    if (results.every((r: any) => r.tuned)) {
      return { approved: true, gates: ['BUSINESS', 'CODE_QUALITY'] };
    }
  }

  return {
    approved: false,
    block: gateApproval.approved ? 'SpecialistOrchestration' : 'GateApproval',
    missingGates: gateApproval.recommendations
  };
}

/**
 * Verify specified source files exist and are readable
 */
function verifySourceFilesExist(): { passed: boolean; missing: string[]; errors: string[] } {
  const workspaceRoot = path.resolve(__dirname, '..', '..', '..');
  const missing: string[] = [];
  const errors: string[] = [];

  for (const relPath of getDeploymentCriticalFiles()) {
    const fullPath = path.join(workspaceRoot, relPath);
    try {
      if (!fs.existsSync(fullPath)) {
        missing.push(relPath);
      } else {
        // Verify file is readable
        const stats = fs.statSync(fullPath);
        if (stats.size === 0) {
          errors.push(`File is empty: ${relPath}`);
        }
      }
    } catch (err: any) {
      errors.push(`Cannot access ${relPath}: ${err.message}`);
    }
  }

  return {
    passed: missing.length === 0 && errors.length === 0,
    missing,
    errors
  };
}

function buildMasterGateContext(gateId: MasterGateId): Record<string, unknown> {
  return {
    source: 'master_deployment_readiness_analysis',
    gateId,
    requestedAt: new Date().toISOString(),
    loadTestPassed: false,
    stressTestPassed: false,
    engineSnapshot: {
      running: sharedEngineState.running,
      avgLatencyMs: sharedEngineState.avgLatencyMs,
      currentDailyProfit: sharedEngineState.currentDailyProfit,
      riskIndex: sharedEngineState.riskIndex,
      skippedScanCycles: sharedEngineState.skippedScanCycles
    }
  };
}

function mapGateAnalysis(result: any, gateId: MasterGateId): MasterGateAnalysis {
  const approval = result.approvalDetails;
  const automatedChecks = approval?.automatedChecks || [];
  const hasFailedChecks = automatedChecks.some((check: any) => check.status === 'FAIL');
  const pendingHumanApproval = !result.approved && approval?.requiresHumanApproval;
  const autoApproved = result.approved && approval?.approvedBy === 'AUTOMATED_SYSTEM';

  let status: MasterGateAnalysis['status'] = 'FAILED_AUTOMATED_CHECKS';
  if (autoApproved) {
    status = 'AUTO_APPROVED';
  } else if (result.approved) {
    status = 'APPROVED';
  } else if (pendingHumanApproval) {
    status = 'PENDING_HUMAN_APPROVAL';
  } else if (!hasFailedChecks) {
    status = 'PENDING_HUMAN_APPROVAL';
  }

  const nextAction =
    status === 'AUTO_APPROVED'
      ? 'No action required'
      : status === 'APPROVED'
        ? 'Gate has manual approval recorded'
        : status === 'PENDING_HUMAN_APPROVAL'
          ? `Manual approval required for ${approval?.gateName || result.gateId}`
          : 'Resolve failed automated checks and rerun readiness analysis';

  return {
    gateId,
    gateName: approval?.gateName || gateId,
    status,
    approved: !!result.approved,
    requiresHumanApproval: !!approval.requiresHumanApproval,
    riskAssessment: approval.riskAssessment,
    automatedChecks,
    nextAction
  };
}

export async function runMasterDeploymentReadinessAnalysis(): Promise<MasterDeploymentReadinessReport> {
  // Step 1: Run Live KPI Tune Cycle to capture real-time data from specialists
  const kpiResults = await alphaCopilot.fullKpiTuneCycle({});

  const gateResults = await Promise.all(
    MASTER_DEPLOYMENT_GATES.map(async gateId => {
      const result = await gateKeeper.requestGateApproval(gateId, 'SYSTEM_INTERNAL', buildMasterGateContext(gateId));
      return mapGateAnalysis(result, gateId);
    })
  );

  const baseCheck = await comprehensiveDeploymentCheck();
  const deploymentAuth = gateKeeper.isDeploymentAuthorized();

  // Get all checked files
  const allCheckedFiles: string[] = getDeploymentCriticalFiles();
  
  // Group by module root
  const coverageByModuleRoot: Record<string, number> = {};
  for (const root of DEPLOYMENT_MODULE_ROOTS) {
    coverageByModuleRoot[root] = allCheckedFiles.filter(f => f.startsWith(root + '/')).length;
  }
  coverageByModuleRoot['TOTAL'] = allCheckedFiles.length;

  // --- Visual Report for Operators ---
  console.log('\n--- DEPLOYMENT READINESS COVERAGE REPORT ---');
  Object.entries(coverageByModuleRoot).forEach(([root, count]) => {
    console.log(`${root.padEnd(35)} : ${count} files verified`);
  });
  console.log('--------------------------------------------\n');

  const passedAutomatically = gateResults
    .filter(gate => gate.status === 'AUTO_APPROVED')
    .map(gate => gate.gateId);
  const blockedByFailedChecks = gateResults
    .filter(gate => gate.status === 'FAILED_AUTOMATED_CHECKS')
    .map(gate => gate.gateId);
  const pendingHumanApproval = gateResults
    .filter(gate => gate.status === 'PENDING_HUMAN_APPROVAL')
    .map(gate => gate.gateId);

   const isFullyReady = deploymentAuth.authorized && baseCheck.ready;
   const overallStatus: MasterDeploymentReadinessReport['overallStatus'] =
     isFullyReady
       ? 'READY_FOR_DEPLOYMENT'
       : blockedByFailedChecks.length > 0
         ? 'BLOCKED'
         : 'PENDING_APPROVALS';

   // 36-KPI breakdown from specialist results
   const kpiBreakdownRaw: Array<{ domain: string; score: number; status: 'OPTIMAL' | 'DEGRADED' | 'CRITICAL'; metrics: Record<string, any> }> = kpiResults.map(res => ({
     domain: res.category,
     score: res.confidence,
     status: res.confidence >= 0.85 ? 'OPTIMAL' : res.confidence >= 0.7 ? 'DEGRADED' : 'CRITICAL',
     metrics: res.tunedKpis
   }));
   const kpiBreakdown = kpiBreakdownRaw;

   // KPI History persistence (file-based for now)
   const historyFile = path.join(__dirname, '..', '..', '..', 'api', '.kpi-history.json');
   let history: Array<{ cycle: number; timestamp: string; kpiBreakdown: typeof kpiBreakdownRaw }> = [];
   if (fs.existsSync(historyFile)) {
     try {
       history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
     } catch {
       history = [];
     }
   }
   const currentCycle = history.length + 1;
   const currentEntry = { cycle: currentCycle, timestamp: new Date().toISOString(), kpiBreakdown: kpiBreakdownRaw };
   history.push(currentEntry);
   fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));

   const recommendations = [
     ...baseCheck.recommendations,
     ...blockedByFailedChecks.map(gateId => `Fix automated check failures for ${gateId}`),
     ...pendingHumanApproval.map(gateId => `Obtain human approval for ${gateId}`),
   ].filter((value, index, array) => array.indexOf(value) === index);

   if (overallStatus === 'READY_FOR_DEPLOYMENT') {
     recommendations.push('ACTION REQUIRED: Human operator must "ALLOW" deployment to trigger Git Push.');
   } else {
     recommendations.push('ACTION REQUIRED: Deployment "REJECTED" or "BLOCKED". Review critical issues.');
   }

   const issues = [
     ...baseCheck.issues,
     ...blockedByFailedChecks.map(gateId => `${gateId} has failing automated checks`),
     ...pendingHumanApproval.map(gateId => `${gateId} is waiting for human approval`)
   ].filter((value, index, array) => array.indexOf(value) === index);

   // Build report object (declare early)
    const report: MasterDeploymentReadinessReport = {
      generatedAt: new Date(),
      overallStatus,
      deploymentAuthorized: deploymentAuth.authorized,
      authorizationMode: deploymentAuth.authorizationMode,
      summary: {
        totalGates: gateResults.length,
        autoApproved: passedAutomatically.length,
        approved: gateResults.filter(gate => gate.approved).length,
        pendingHumanApproval: pendingHumanApproval.length,
        failedAutomatedChecks: blockedByFailedChecks.length
      },
      gates: gateResults,
      passedAutomatically,
      blockedByFailedChecks,
      pendingHumanApproval,
      missingApprovals: deploymentAuth.missingApprovals,
      orchestratorsStatus: baseCheck.orchestratorsStatus,
      fileVerification: {
        allFilesPresent: baseCheck.fileVerification?.allFilesPresent ?? false,
        missingFiles: baseCheck.fileVerification?.missingFiles ?? [],
        fileErrors: baseCheck.fileVerification?.fileErrors ?? []
      },
      coverageByModuleRoot,
      issues,
      recommendations,
      globalEfficiencyScore: sharedEngineState.totalWeightedScore / 100,
      kpiBreakdown
    };

    return report;
  }

/**
 * Comprehensive deployment readiness check
 * Integrates all orchestrators: Alpha Copilot, Gate Keeper, and Specialists
 * Plus file-level verification for critical source files
 */
export async function comprehensiveDeploymentCheck(): Promise<{
  ready: boolean;
  missingApprovals: string[];
  orchestratorsStatus: {
    alphaCopilot: boolean;
    gateKeeper: boolean;
    specialists: boolean;
    sourceFiles: boolean;
  };
  issues: string[];
  recommendations: string[];
  fileVerification?: {
    allFilesPresent: boolean;
    missingFiles: string[];
    fileErrors: string[];
  };
}> {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // NEW: Verify critical source files exist
  const fileVerification = verifySourceFilesExist();
  if (!fileVerification.passed) {
    if (fileVerification.missing.length > 0) {
      issues.push(`Missing source files: ${fileVerification.missing.join(', ')}`);
      recommendations.push(...fileVerification.missing.map(f => `Restore missing file: ${f}`));
    }
    if (fileVerification.errors.length > 0) {
      issues.push(...fileVerification.errors);
    }
  }

  // Check Alpha Copilot readiness
  let alphaCopilotReady = false;
  try {
    const analysis = await alphaCopilot.analyzeIssueTenLayers('Deployment readiness', {});
    alphaCopilotReady = !analysis.some((r: any) => r.riskAssessment === 'CRITICAL');
    if (!alphaCopilotReady) {
      issues.push('Alpha Copilot detected critical system issues');
    }
  } catch (error) {
    issues.push('Alpha Copilot analysis failed');
  }

  // Check Gate Keeper authorization
  let gateKeeperReady = false;
  try {
    const deploymentAuth = gateKeeper.isDeploymentAuthorized();
    gateKeeperReady = deploymentAuth.authorized;
    if (!gateKeeperReady) {
      issues.push(`Missing gate approvals: ${deploymentAuth.missingApprovals.join(', ')}`);
      recommendations.push(...deploymentAuth.missingApprovals.map(gate => `Complete ${gate} gate approval`));
    }
  } catch (error) {
    issues.push('Gate Keeper authorization check failed');
  }

  // Check Specialist orchestration
  let specialistsReady = false;
  try {
    const kpiResults = await alphaCopilot.fullKpiTuneCycle({});
    const rustResult = await alphaCopilot.orchestrateSpecialists('RustCompile', {});
    // If we got here without throwing, both orchestrations succeeded
    specialistsReady = kpiResults.every((r: any) => r.tuned);
    if (!specialistsReady) {
      issues.push('Specialist orchestration incomplete');
    }
  } catch (error) {
    issues.push('Specialist orchestration failed');
  }

  const sourceFilesReady = fileVerification.passed;
  const ready = alphaCopilotReady && gateKeeperReady && specialistsReady && sourceFilesReady;

  return {
    ready,
    missingApprovals: gateKeeperReady ? [] : gateKeeper.isDeploymentAuthorized().missingApprovals,
    orchestratorsStatus: {
      alphaCopilot: alphaCopilotReady,
      gateKeeper: gateKeeperReady,
      specialists: specialistsReady,
      sourceFiles: sourceFilesReady
    },
    fileVerification: {
      allFilesPresent: fileVerification.passed,
      missingFiles: fileVerification.missing,
      fileErrors: fileVerification.errors
    },
    issues,
    recommendations: ready ? [
      'All orchestrators ready - proceed with deployment',
      'Monitor system closely post-deployment',
      ...recommendations
    ] : [
      'Address identified issues before deployment',
      'Consider phased rollout approach',
      ...recommendations
    ]
  };
}
