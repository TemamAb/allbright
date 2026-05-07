import { SubsystemSpecialist } from '../specialists';
import { sharedEngineState } from '../engineState';
import { preflightCheck } from '../preflightCheck';
import { debuggingSystem } from '../debuggingSystem';

/**
 * BSS-60: DiagnosticSpecialist
 * Orchestrates the P1-P10 (Pre-flight) and D1-D29 (Debugging) systems.
 * Provides Cognitive Guardrails and Latent Root Cause Analysis.
 */
export class DiagnosticSpecialist implements SubsystemSpecialist {
  name(): string { return "DiagnosticSpecialist"; }
  category(): string { return "Diagnostic-Reliability"; }

  async tuneKpis(kpiData: any): Promise<any> {
    // 1. Execute AI-Augmented Pre-flight audit
    const preflight = await preflightCheck.runChecks();
    
    // 2. Execute Proactive Diagnostic Sweep
    const diagnostic = await debuggingSystem.runFullDiagnostic();

    // 3. Cognitive Assessment: Identify if failures are systemic or environmental
    const iseReadyScore = diagnostic.overallScore;
    const reliabilityIndex = preflight.passed ? 1.0 : 0.5;

    // This specialist "tunes" the system's sensitivity to failure
    const tunedKpis = {
      reliabilityIndex,
      systemicStability: iseReadyScore / 100,
      preflightPassRate: preflight.passed ? 100 : 0,
      diagnosticHealth: iseReadyScore,
      latentRiskDiscovery: diagnostic.results.filter(r => r.status === 'FAIL').length
    };

    return {
      ...tunedKpis,
      lastAction: preflight.passed ? "Nominal stability verified" : "Reliability gate triggered",
      impact: preflight.passed ? "STABLE" : `BLOCKED: ${preflight.failedChecks[0]}`,
      optimizationCycles: sharedEngineState.optimizationCycles || 0,
      confidence: iseReadyScore / 100,
      recommendations: diagnostic.rootCauseSummary.split('.'),
      nextAction: preflight.passed ? "Maintain current observation" : "Execute remediation"
    };
  }

  status(): any {
    return { status: "active", engine: "allbright-reliability-v1" };
  }
}