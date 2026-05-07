// Tauri-specific implementations with real API calls
export const startSolver = async (mode: string): Promise<string> => {
  const { invoke } = await import('@tauri-apps/api/core');
  return await invoke('start_solver', { mode });
};

export const stopSolver = async (): Promise<string> => {
  const { invoke } = await import('@tauri-apps/api/core');
  return await invoke('stop_solver');
};

export const getSolverStatus = async (): Promise<{ running: boolean; mode: string }> => {
  const { invoke } = await import('@tauri-apps/api/core');
  return await invoke('get_solver_status');
};

export const getLogs = async (): Promise<string[]> => {
  const { invoke } = await import('@tauri-apps/api/core');
  return await invoke('get_logs');
};

export const getReadinessStatus = async (): Promise<any> => {
  const { invoke } = await import('@tauri-apps/api/core');
  return await invoke('get_readiness_status');
};

export const runReadinessCheck = async (): Promise<any> => {
  const { invoke } = await import('@tauri-apps/api/core');
  return await invoke('run_readiness_check');
};

export const setUserRole = async (role: string): Promise<string> => {
  const { invoke } = await import('@tauri-apps/api/core');
  return await invoke('set_user_role', { role });
};

export const getUserRole = async (): Promise<string> => {
  const { invoke } = await import('@tauri-apps/api/core');
  return await invoke('get_user_role');
};

export const completeWizard = async (): Promise<string> => {
  const { invoke } = await import('@tauri-apps/api/core');
  return await invoke('complete_wizard');
};

export const isWizardCompleted = async (): Promise<boolean> => {
  const { invoke } = await import('@tauri-apps/api/core');
  return await invoke('is_wizard_completed');
};

export const setExposureLimit = async (limit: number): Promise<string> => {
  const { invoke } = await import('@tauri-apps/api/core');
  return await invoke('set_exposure_limit', { limit });
};

export const getExposureLimit = async (): Promise<number> => {
  const { invoke } = await import('@tauri-apps/api/core');
  return await invoke('get_exposure_limit');
};

export const canStartStage = async (stage: string): Promise<boolean> => {
  const { invoke } = await import('@tauri-apps/api/core');
  return await invoke('can_start_stage', { stage });
};

export const getGuruDefaults = async (): Promise<any> => {
  const { invoke } = await import('@tauri-apps/api/core');
  return await invoke('get_guru_defaults');
};