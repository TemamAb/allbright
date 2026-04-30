import { runMasterDeploymentReadinessAnalysis, comprehensiveDeploymentCheck, deployGate } from '../src/services/deploy_gatekeeper';
import { gateKeeper, getDeploymentCriticalFiles } from '../src/services/gateKeeper';
import { AlphaCopilot } from '../src/services/alphaCopilot';
import * as fs from 'fs';

jest.mock('../src/services/gateKeeper', () => ({
  gateKeeper: {
    requestGateApproval: jest.fn(),
    isDeploymentAuthorized: jest.fn(),
    approveGate: jest.fn(),
  },
  getDeploymentCriticalFiles: jest.fn(),
  DEPLOYMENT_MODULE_ROOTS: ['api/src', 'solver/src', 'ui/src']
}));

jest.mock('../src/services/alphaCopilot', () => ({
  AlphaCopilot: jest.fn().mockImplementation(() => ({
    analyzeIssueTenLayers: jest.fn(),
    fullKpiTuneCycle: jest.fn(),
    orchestrateSpecialists: jest.fn(),
    requestGateApproval: jest.fn(),
  }))
}));

jest.mock('fs');

describe('Master Deployment Readiness', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getDeploymentCriticalFiles as jest.Mock).mockReturnValue(['api/src/services/deploy_gatekeeper.ts']);
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.statSync as jest.Mock).mockReturnValue({ size: 1024 });
  });

  it('should return READY_FOR_DEPLOYMENT when all gates and checks pass', async () => {
    // Mock GateKeeper approvals
    (gateKeeper.requestGateApproval as jest.Mock).mockResolvedValue({
      approved: true,
      approvalDetails: {
        gateId: 'CODE_QUALITY',
        gateName: 'Code Quality',
        approvedBy: 'AUTOMATED_SYSTEM',
        riskAssessment: 'LOW',
        automatedChecks: [{ status: 'PASS' }]
      }
    });

    (gateKeeper.isDeploymentAuthorized as jest.Mock).mockReturnValue({
      authorized: true,
      authorizationMode: 'standard',
      missingApprovals: []
    });

    // Mock AlphaCopilot and Specialists
    const mockAlpha = new AlphaCopilot() as any;
    mockAlpha.analyzeIssueTenLayers.mockResolvedValue([]);
    mockAlpha.fullKpiTuneCycle.mockResolvedValue([{ tuned: true }]);
    mockAlpha.orchestrateSpecialists.mockResolvedValue({ success: true });

    const report = await runMasterDeploymentReadinessAnalysis();
    
    expect(report.overallStatus).toBe('READY_FOR_DEPLOYMENT');
    expect(report.deploymentAuthorized).toBe(true);
    expect(report.summary.autoApproved).toBe(report.summary.totalGates);
    expect(report).toHaveProperty('coverageByModuleRoot');
  }, 30000);

  it('should return BLOCKED when automated checks fail for any gate', async () => {
    (gateKeeper.requestGateApproval as jest.Mock).mockResolvedValue({
      approved: false,
      approvalDetails: {
        gateId: 'SECURITY',
        gateName: 'Security Scan',
        automatedChecks: [{ status: 'FAIL', severity: 'HIGH', details: 'Vulnerabilities detected' }]
      }
    });

    (gateKeeper.isDeploymentAuthorized as jest.Mock).mockReturnValue({
      authorized: false,
      authorizationMode: 'blocked',
      missingApprovals: ['SECURITY']
    });

    const report = await runMasterDeploymentReadinessAnalysis();
    
    expect(report.overallStatus).toBe('BLOCKED');
    expect(report.blockedByFailedChecks).toContain('SECURITY');
    expect(report.issues).toContain('SECURITY has failing automated checks');
  }, 120000);

  it('should reflect missing source files in the check', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);

    const check = await comprehensiveDeploymentCheck();
    
    expect(check.ready).toBe(false);
    expect(check.fileVerification?.allFilesPresent).toBe(false);
    expect(check.issues.some(i => i.startsWith('Missing source files'))).toBe(true);
  });

  it('should group coverage correctly by module root', async () => {
    (getDeploymentCriticalFiles as jest.Mock).mockReturnValue([
      'api/src/app.ts',
      'solver/src/main.rs',
      'ui/src/index.tsx'
    ]);

    const report = await runMasterDeploymentReadinessAnalysis();
    
    expect(report.coverageByModuleRoot['api/src']).toBe(1);
    expect(report.coverageByModuleRoot['solver/src']).toBe(1);
    expect(report.coverageByModuleRoot['TOTAL']).toBe(3);
  });

  describe('GateKeeper State Transitions', () => {
    it('should allow deployment when EMERGENCY_OVERRIDE is active even with missing gates', async () => {
      (gateKeeper.isDeploymentAuthorized as jest.Mock).mockReturnValue({
        authorized: true,
        authorizationMode: 'emergency_override',
        missingApprovals: ['SECURITY', 'BUSINESS'],
        emergencyOverride: { active: true, activatedBy: 'CTO', reason: 'Critical patch' }
      });

      const report = await runMasterDeploymentReadinessAnalysis();
      
      expect(report.deploymentAuthorized).toBe(true);
      expect(report.authorizationMode).toBe('emergency_override');
      expect(report.overallStatus).toBe('READY_FOR_DEPLOYMENT');
    });

    it('should return BLOCKED if a gate is explicitly REJECTED', async () => {
      (gateKeeper.requestGateApproval as jest.Mock).mockResolvedValue({
        approved: false,
        gateStatus: 'REJECTED',
        approvalDetails: {
          gateId: 'BUSINESS',
          status: 'REJECTED',
          automatedChecks: []
        }
      });

      (gateKeeper.isDeploymentAuthorized as jest.Mock).mockReturnValue({
        authorized: false,
        authorizationMode: 'blocked',
        missingApprovals: ['BUSINESS']
      });

      const report = await runMasterDeploymentReadinessAnalysis();
      
      expect(report.overallStatus).toBe('BLOCKED');
      expect(report.missingApprovals).toContain('BUSINESS');
    });
  });

  it('should include recommendations for pending human approvals', async () => {
    const report = await runMasterDeploymentReadinessAnalysis();
    const pendingGates = report.gates.filter(g => g.status === 'PENDING_HUMAN_APPROVAL');
    
    pendingGates.forEach(gate => {
      expect(report.recommendations).toContain(`Obtain human approval for ${gate.gateId}`);
    });
  });

  it('should correctly map gate statuses (AUTO_APPROVED vs APPROVED)', async () => {
    (gateKeeper.requestGateApproval as jest.Mock)
      .mockResolvedValueOnce({
        approved: true,
        approvalDetails: {
          gateId: 'CODE_QUALITY',
          gateName: 'Code Quality',
          approvedBy: 'AUTOMATED_SYSTEM',
          automatedChecks: [{ status: 'PASS' }]
        }
      })
      .mockResolvedValueOnce({
        approved: true,
        approvalDetails: {
          gateId: 'INFRASTRUCTURE',
          gateName: 'Infrastructure Readiness',
          approvedBy: 'SYSTEM_ADMIN',
          automatedChecks: [{ status: 'PASS' }]
        }
      })
      .mockResolvedValue({
        approved: false,
        approvalDetails: {
          gateId: 'SECURITY',
          requiresHumanApproval: true,
          automatedChecks: [{ status: 'PASS' }]
        }
      });

    (gateKeeper.isDeploymentAuthorized as jest.Mock).mockReturnValue({
      authorized: false,
      authorizationMode: 'blocked',
      missingApprovals: ['SECURITY', 'PERFORMANCE', 'BUSINESS']
    });

    const report = await runMasterDeploymentReadinessAnalysis();
    
    expect(report.summary.autoApproved).toBe(1);
    expect(report.summary.approved).toBe(2);
    expect(report.gates.find(g => g.gateId === 'CODE_QUALITY')?.status).toBe('AUTO_APPROVED');
    expect(report.gates.find(g => g.gateId === 'INFRASTRUCTURE')?.status).toBe('APPROVED');
  });

  it('should verify the logic of the deprecated deployGate function', async () => {
    const mockAlpha = new AlphaCopilot() as any;
    mockAlpha.requestGateApproval.mockResolvedValue({ approved: true });
    mockAlpha.fullKpiTuneCycle.mockResolvedValue([{ tuned: true }]);
    mockAlpha.orchestrateSpecialists.mockResolvedValue({ success: true });

    const result = await deployGate();
    expect(result.approved).toBe(true);
    expect(result.gates).toContain('BUSINESS');
  });

  it('should handle Alpha Copilot analysis failure gracefully', async () => {
    const mockAlpha = new AlphaCopilot() as any;
    mockAlpha.analyzeIssueTenLayers.mockRejectedValue(new Error('AI Engine Down'));

    const check = await comprehensiveDeploymentCheck();
    expect(check.ready).toBe(false);
    expect(check.orchestratorsStatus.alphaCopilot).toBe(false);
    expect(check.issues).toContain('Alpha Copilot analysis failed');
  });

  it('should report file errors for empty files', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.statSync as jest.Mock).mockReturnValue({ size: 0 });

    const check = await comprehensiveDeploymentCheck();
    expect(check.ready).toBe(false);
    expect(check.fileVerification?.fileErrors.length).toBeGreaterThan(0);
  });
});
