// Detect if running in Tauri environment
const isTauri = () => {
  return typeof window !== 'undefined' && window.__TAURI_INTERNALS__ !== undefined;
};

// Get the appropriate implementation based on environment
const getImplementation = async () => {
  if (isTauri()) {
    return await import('./tauri-native');
  } else {
    return await import('./tauri-web');
  }
};

// Re-export all functions with environment-aware delegation
export const startSolver = async (mode: string): Promise<string> => {
  const impl = await getImplementation();
  return impl.startSolver(mode);
};

export const stopSolver = async (): Promise<string> => {
  const impl = await getImplementation();
  return impl.stopSolver();
};

export const getSolverStatus = async (): Promise<{ running: boolean; mode: string }> => {
  const impl = await getImplementation();
  return impl.getSolverStatus();
};

export const getLogs = async (): Promise<string[]> => {
  const impl = await getImplementation();
  return impl.getLogs();
};

export const getReadinessStatus = async (): Promise<any> => {
  const impl = await getImplementation();
  return impl.getReadinessStatus();
};

export const runReadinessCheck = async (): Promise<any> => {
  const impl = await getImplementation();
  return impl.runReadinessCheck();
};

export const setUserRole = async (role: string): Promise<string> => {
  const impl = await getImplementation();
  return impl.setUserRole(role);
};

export const getUserRole = async (): Promise<string> => {
  const impl = await getImplementation();
  return impl.getUserRole();
};

export const completeWizard = async (): Promise<string> => {
  const impl = await getImplementation();
  return impl.completeWizard();
};

export const isWizardCompleted = async (): Promise<boolean> => {
  const impl = await getImplementation();
  return impl.isWizardCompleted();
};

export const setExposureLimit = async (limit: number): Promise<string> => {
  const impl = await getImplementation();
  return impl.setExposureLimit(limit);
};

export const getExposureLimit = async (): Promise<number> => {
  const impl = await getImplementation();
  return impl.getExposureLimit();
};

export const canStartStage = async (stage: string): Promise<boolean> => {
  const impl = await getImplementation();
  return impl.canStartStage(stage);
};

export const getGuruDefaults = async (): Promise<any> => {
  const impl = await getImplementation();
  return impl.getGuruDefaults();
};
