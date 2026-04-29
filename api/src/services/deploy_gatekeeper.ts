import { AlphaCopilot } from './alphaCopilot';
import { gateKeeper } from './gateKeeper';
import { sharedEngineState } from './engineState';
import * as fs from 'fs';
import * as path from 'path';

const alphaCopilot = new AlphaCopilot();

// Files to verify for deployment readiness
const RUST_FILES_TO_CHECK = [
  'solver/src/lib.rs',
  'solver/src/main.rs',
  'solver/src/benchmarks.rs',
  'solver/src/timing/mod.rs',
  'solver/src/timing/sub_block_timing.rs',
];

const TYPESCRIPT_FILES_TO_CHECK = [
  'api/src/services/bribeEngine.ts',
  'api/src/services/useLiveTelemetry.ts',
  'ui/src/components/AnomalyTicker.tsx',
  'api/src/services/MarketSentiment.tsx',
  'api/src/services/mockRustBridge.ts',
  'api/src/services/websocketStream.ts',
  'api/src/services/specialists.ts',
  'api/src/services/alphaCopilot.ts',
  'api/src/controllers/telemetry.ts',
  'api/src/controllers/engine.ts',
];

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

  for (const relPath of [...RUST_FILES_TO_CHECK, ...TYPESCRIPT_FILES_TO_CHECK]) {
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
    missingApprovals: ready ? [] : [...issues],
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

