import { alphaCopilot } from './alphaCopilot';
import { gateKeeper } from './gateKeeper';

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

    if (rustResult.status.active && results.every((r: any) => r.tuned)) {
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
 * Comprehensive deployment readiness check
 * Integrates all orchestrators: Alpha Copilot, Gate Keeper, and Specialists
 */
export async function comprehensiveDeploymentCheck(): Promise<{
  ready: boolean;
  orchestratorsStatus: {
    alphaCopilot: boolean;
    gateKeeper: boolean;
    specialists: boolean;
  };
  issues: string[];
  recommendations: string[];
}> {
  const issues: string[] = [];
  const recommendations: string[] = [];

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
    specialistsReady = rustResult.status.active && kpiResults.every((r: any) => r.tuned);
    if (!specialistsReady) {
      issues.push('Specialist orchestration incomplete');
    }
  } catch (error) {
    issues.push('Specialist orchestration failed');
  }

  const ready = alphaCopilotReady && gateKeeperReady && specialistsReady;

  if (ready) {
    recommendations.push('All orchestrators ready - proceed with deployment');
    recommendations.push('Monitor system closely post-deployment');
  } else {
    recommendations.push('Address identified issues before deployment');
    recommendations.push('Consider phased rollout approach');
  }

  return {
    ready,
    orchestratorsStatus: {
      alphaCopilot: alphaCopilotReady,
      gateKeeper: gateKeeperReady,
      specialists: specialistsReady
    },
    issues,
    recommendations
  };
}

