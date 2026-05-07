/**
 * Allbright Desktop - Tauri API Service
 * Centralized wrapper for all Tauri IPC commands
 */

import { invoke } from "@tauri-apps/api/core";

/// Workflow stages aligned with work-flow-guide.md
export type WorkflowStage = 
  | "dev" 
  | "simulation" 
  | "paper-trading" 
  | "shadow" 
  | "live-simulation" 
  | "canary" 
  | "live";

export interface SolverStatus {
  running: boolean;
  mode: string;
  stage?: WorkflowStage;
  exposure_used?: number;
}

/// All available workflow stages for UI
export const WORKFLOW_STAGES: { value: WorkflowStage; label: string; description: string }[] = [
  { value: "dev", label: "Development", description: "Local development mode" },
  { value: "simulation", label: "Simulation", description: "Synthetic data testing" },
  { value: "paper-trading", label: "Paper Trading", description: "Real data, no execution" },
  { value: "shadow", label: "Shadow Mode", description: "Parallel production comparison" },
  { value: "live-simulation", label: "Live Simulation", description: "Limited real execution" },
  { value: "canary", label: "Canary Release", description: "1-25% traffic" },
  { value: "live", label: "Full Live", description: "Production mode" },
];

/**
 * Start the arbitrage solver engine
 * @param mode - Any workflow stage from work-flow-guide.md
 */
export async function startSolver(mode: WorkflowStage): Promise<string> {
  return invoke<string>("start_solver", { mode });
}

/**
 * Stop the arbitrage solver engine
 */
export async function stopSolver(): Promise<string> {
  return invoke<string>("stop_solver");
}

/**
 * Get current solver status
 */
export async function getSolverStatus(): Promise<SolverStatus> {
  return invoke<SolverStatus>("get_solver_status");
}

/**
 * Get recent logs from the engine
 */
export async function getLogs(): Promise<string[]> {
  return invoke<string[]>("get_logs");
}

// ===========================================
// Deployment Readiness Types
// ===========================================

export interface ReadinessStatus {
  ready: boolean;
  missing_approvals: string[];
  issues: string[];
  recommendations: string[];
}

export interface CheckItem {
  status: 'PASS' | 'FAIL' | 'WARN';
  details: string;
}

export interface StrategicChecklist {
  bribe_engine_sync: CheckItem;
  meta_learner_active: CheckItem;
  kpi_persistence: CheckItem;
  simulation_gate: CheckItem;
  liquidity_gate: CheckItem;
  orchestrator_health: CheckItem;
  source_integrity: CheckItem;
  disaster_recovery: CheckItem;
  apex_pursuit_active: CheckItem;
  engineering_integrity: CheckItem;
  private_relay_active: CheckItem;
}

export interface GateStatus {
  gate_id: string;
  gate_name: string;
  status: string;
  approved: boolean;
}

export interface ReadinessReport {
  generated_at: string;
  overall_status: string;
  deployment_score: number;
  override_active: boolean;
  gates: GateStatus[];
  strategic_checklist: StrategicChecklist;
  issues: string[];
  recommendations: string[];
}

/**
 * Get deployment readiness summary
 * Queries the API server for current readiness status
 */
export async function getReadinessStatus(): Promise<ReadinessStatus> {
  return invoke<ReadinessStatus>("get_readiness_status");
}

/**
 * Run full deployment readiness check
 * Triggers a comprehensive readiness analysis via API
 */
export async function runReadinessCheck(): Promise<ReadinessReport> {
  return invoke<ReadinessReport>("run_readiness_check");
}

/**
 * Check if a stage requires safety confirmation
 */
export function requiresConfirmation(stage: WorkflowStage): boolean {
  return ["live-simulation", "canary", "live"].includes(stage);
}

// ===========================================
// Admin & Workflow Management
// ===========================================

export type UserRole = "admin" | "user";

export interface GuruDefaults {
  default_stage: string;
  default_exposure_limit: number;
  allow_custom_models: boolean;
  require_wizard_completion: boolean;
}

/**
 * Set user role (requires admin privileges)
 */
export async function setUserRole(role: UserRole): Promise<string> {
  return invoke<string>("set_user_role", { role });
}

/**
 * Get current user role
 */
export async function getUserRole(): Promise<UserRole> {
  return invoke<UserRole>("get_user_role");
}

/**
 * Mark wizard as completed
 * Enables live modes for users
 */
export async function completeWizard(): Promise<string> {
  return invoke<string>("complete_wizard");
}

/**
 * Check if wizard is completed
 */
export async function isWizardCompleted(): Promise<boolean> {
  return invoke<boolean>("is_wizard_completed");
}

/**
 * Set exposure limit for live simulation mode
 * Only available to admin users
 */
export async function setExposureLimit(limit: number): Promise<string> {
  return invoke<string>("set_exposure_limit", { limit });
}

/**
 * Get current exposure limit
 */
export async function getExposureLimit(): Promise<number> {
  return invoke<number>("get_exposure_limit");
}

/**
 * Check if user can start a particular workflow stage
 * Validates admin requirements and wizard completion
 */
export async function canStartStage(stage: WorkflowStage): Promise<boolean> {
  try {
    // 1. Institutional Tier: Concurrent check of identity and backend authority
    const [role, isDone, backendAuthorized] = await Promise.all([
      getUserRole(),
      isWizardCompleted(),
      invoke<boolean>("can_start_stage", { stage })
    ]);

    const isAdmin = role === "admin";

    // 2. Commercial Standard Permission Matrix (RBAC)
    // Tier 1: Public/Research stages (Always accessible)
    if (["dev", "simulation", "paper-trading"].includes(stage)) return true;

    // Tier 2: Monitoring/Audit (Requires Admin)
    if (stage === "shadow") return isAdmin;

    // Tier 3: Execution/Production (Requires Admin AND Wizard completion)
    // This ensures no production execution occurs without verified onboarding.
    if (["live-simulation", "canary", "live"].includes(stage)) {
      return isAdmin && isDone;
    }

    // 3. Fallback to specific backend gate logic
    return backendAuthorized;
  } catch (err) {
    console.error("Commercial Security Gate Failure:", err);
    // Fail-safe: lock down to low-risk research stages only on system error
    return ["dev", "simulation", "paper-trading"].includes(stage);
  }
}

/**
 * Get guru defaults (canonical settings for no-drift)
 */
export async function getGuruDefaults(): Promise<GuruDefaults> {
  return invoke<GuruDefaults>("get_guru_defaults");
}
