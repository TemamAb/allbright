// Web-only mock implementations
export const startSolver = async (mode: string): Promise<string> => {
  console.log(`[WEB MOCK] Starting solver in ${mode} mode`);
  return `Solver started in ${mode} mode`;
};

export const stopSolver = async (): Promise<string> => {
  console.log('[WEB MOCK] Stopping solver');
  return 'Solver stopped';
};

export const getSolverStatus = async (): Promise<{ running: boolean; mode: string }> => {
  return { running: false, mode: 'stopped' };
};

export const getLogs = async (): Promise<string[]> => {
  return ['[INFO] Web environment - no solver logs available'];
};

export const getReadinessStatus = async (): Promise<any> => {
  return {
    ready: true,
    issues: [],
    missing_approvals: [],
    recommendations: ['Web environment - system ready for operation']
  };
};

export const runReadinessCheck = async (): Promise<any> => {
  return {
    overall_status: 'READY_FOR_DEPLOYMENT',
    deployment_score: 95,
    gates: [{ gate_id: 'web', status: 'approved' }],
    issues: [],
    recommendations: ['Web readiness check passed']
  };
};

export const setUserRole = async (role: string): Promise<string> => {
  console.log(`[WEB MOCK] Setting user role to: ${role}`);
  return `Role set to: ${role}`;
};

export const getUserRole = async (): Promise<string> => {
  return 'user';
};

export const completeWizard = async (): Promise<string> => {
  console.log('[WEB MOCK] Wizard completed');
  return 'Wizard completed successfully';
};

export const isWizardCompleted = async (): Promise<boolean> => {
  return true;
};

export const setExposureLimit = async (limit: number): Promise<string> => {
  console.log(`[WEB MOCK] Setting exposure limit to: $${limit}`);
  return `Exposure limit set to: $${limit}`;
};

export const getExposureLimit = async (): Promise<number> => {
  return 1000;
};

export const canStartStage = async (stage: string): Promise<boolean> => {
  return true;
};

export const getGuruDefaults = async (): Promise<any> => {
  return {
    default_stage: 'simulation',
    default_exposure_limit: 1000,
    allow_custom_models: false,
    require_wizard_completion: true
  };
};