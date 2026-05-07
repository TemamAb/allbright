//! Core process management logic for solver engine

use std::process::{Child, Command, Stdio};
use std::sync::Mutex;

/// User roles for admin/user mode separation
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum UserRole {
    User,
    Admin,
}

impl Default for UserRole {
    fn default() -> Self {
        UserRole::User
    }
}

/// Workflow stages aligned with work-flow-guide.md
#[derive(Debug, Clone, PartialEq)]
pub enum WorkflowStage {
    Dev,
    Simulation,
    PaperTrading,
    ShadowMode,
    LiveSimulation,
    Canary,
    FullLive,
}

impl Default for WorkflowStage {
    fn default() -> Self {
        WorkflowStage::Simulation
    }
}

impl std::fmt::Display for WorkflowStage {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            WorkflowStage::Dev => write!(f, "dev"),
            WorkflowStage::Simulation => write!(f, "simulation"),
            WorkflowStage::PaperTrading => write!(f, "paper-trading"),
            WorkflowStage::ShadowMode => write!(f, "shadow"),
            WorkflowStage::LiveSimulation => write!(f, "live-simulation"),
            WorkflowStage::Canary => write!(f, "canary"),
            WorkflowStage::FullLive => write!(f, "live"),
        }
    }
}

impl WorkflowStage {
    /// Check if stage requires admin privileges
    pub fn requires_admin(&self) -> bool {
        matches!(
            self,
            WorkflowStage::ShadowMode
                | WorkflowStage::LiveSimulation
                | WorkflowStage::Canary
                | WorkflowStage::FullLive
        )
    }

    /// Get risk level description
    pub fn risk_level(&self) -> &str {
        match self {
            WorkflowStage::Dev => "development",
            WorkflowStage::Simulation => "testing",
            WorkflowStage::PaperTrading => "low",
            WorkflowStage::ShadowMode => "medium",
            WorkflowStage::LiveSimulation => "high",
            WorkflowStage::Canary => "high",
            WorkflowStage::FullLive => "critical",
        }
    }
}

/// Gurudefaults - canonical settings for no-drift operation
pub struct GuruDefaults {
    pub default_stage: WorkflowStage,
    pub default_exposure_limit: f64,
    pub allow_custom_models: bool,
    pub require_wizard_completion: bool,
}

impl Default for GuruDefaults {
    fn default() -> Self {
        Self {
            default_stage: WorkflowStage::Simulation,
            default_exposure_limit: 1000.0,
            allow_custom_models: false,
            require_wizard_completion: true,
        }
    }
}

pub struct AppState {
    pub process: Mutex<Option<Child>>,
    pub mode: Mutex<String>,
    pub logs: Mutex<Vec<String>>,
    pub stage: Mutex<WorkflowStage>,
    pub exposure_limit: Mutex<f64>, // For live-simulation cap
    pub role: Mutex<UserRole>, // Admin or User mode
    pub wizard_completed: Mutex<bool>, // Wizard must be completed before live modes
    pub guru_defaults: GuruDefaults, // Canonical settings
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            process: Mutex::new(None),
            mode: Mutex::new("simulation".to_string()),
            logs: Mutex::new(Vec::new()),
            stage: Mutex::new(WorkflowStage::Simulation),
            exposure_limit: Mutex::new(1000.0),
            role: Mutex::new(UserRole::User),
            wizard_completed: Mutex::new(false),
            guru_defaults: GuruDefaults::default(),
        }
    }
}

/// Check if user has admin privileges
pub fn require_admin(state: &AppState) -> Result<(), String> {
    let role = state.role.lock().map_err(|e| e.to_string())?;
    if *role != UserRole::Admin {
        return Err("Admin privileges required".to_string());
    }
    Ok(())
}

/// Check if wizard has been completed (drift prevention)
pub fn require_wizard_completed(state: &AppState) -> Result<(), String> {
    let completed = state.wizard_completed.lock().map_err(|e| e.to_string())?;
    if !*completed && state.guru_defaults.require_wizard_completion {
        return Err("Wizard completion required before this operation".to_string());
    }
    Ok(())
}

impl AppState {
    /// Get the solver binary path, checking multiple locations
    fn get_solver_path() -> Result<std::path::PathBuf, String> {
        let extension = if cfg!(target_os = "windows") { ".exe" } else { "" };
        let binary_name = format!("allbright{}", extension);

        // Try resource directory first (bundled app)
        if let Ok(exe_path) = std::env::current_exe() {
            let resource_dir = exe_path.parent()
                .ok_or("Could not get parent directory")?;
            
            // Check standard bundle paths
            let bundled_paths = vec![
                resource_dir.join(&binary_name),
                resource_dir.join(format!("bin/{}", binary_name)),
                resource_dir.join(format!("../bin/{}", binary_name)),
                resource_dir.join(format!("resources/bin/{}", binary_name)),
                // In some Tauri v2 layouts, resources might be elsewhere
                resource_dir.join(format!("../Resources/bin/{}", binary_name)),
            ];
            
            for path in &bundled_paths {
                if path.exists() {
                    tracing::info!("Found solver at bundled path: {:?}", path);
                    return Ok(path.clone());
                }
            }
        }
        
        // Fallback to development paths relative to current directory
        // and workspace root
        let mut dev_paths = vec![
            std::path::PathBuf::from("target/release").join(&binary_name),
            std::path::PathBuf::from("../target/release").join(&binary_name),
            std::path::PathBuf::from("../../target/release").join(&binary_name),
            std::path::PathBuf::from("../solver/target/release").join(&binary_name),
            std::path::PathBuf::from("../../solver/target/release").join(&binary_name),
        ];

        // Also check if we are in a dev environment and can find the workspace root
        if let Ok(cwd) = std::env::current_dir() {
            tracing::info!("Current working directory: {:?}", cwd);
            // If we're in tauri/src-tauri, the workspace root is ../..
            dev_paths.push(cwd.join("../../target/release").join(&binary_name));
            dev_paths.push(cwd.join("../solver/target/release").join(&binary_name));
        }

        for path in &dev_paths {
            if path.exists() {
                tracing::info!("Using development solver path: {:?}", path);
                return Ok(path.clone());
            }
        }
        
        Err(format!("Solver binary {} not found. Checked bundled and development paths.", binary_name))
    }

    pub fn start(&self, mode: &str) -> Result<String, String> {
        let mut process_lock = self.process.lock().map_err(|e| e.to_string())?;
        if process_lock.is_some() {
            return Err("Solver already running".to_string());
        }
        *self.mode.lock().map_err(|e| e.to_string())? = mode.to_string();
        
        let binary_path = Self::get_solver_path()?;
        
        tracing::info!("Starting solver: {:?} --mode={}", binary_path, mode);
        
        let child = Command::new(&binary_path)
            .arg(format!("--mode={}", mode))
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to start solver: {}", e))?;
        
        *process_lock = Some(child);
        Ok(format!("Solver started in {} mode", mode))
    }
    pub fn stop(&self) -> Result<String, String> {
        let mut process_lock = self.process.lock().map_err(|e| e.to_string())?;
        if let Some(child) = process_lock.as_mut() {
            child.kill().map_err(|e| format!("Failed to stop solver: {}", e))?;
            *process_lock = None;
            return Ok("Solver stopped".to_string());
        }
        Err("No solver running".to_string())
    }
    pub fn get_status(&self) -> Result<(bool, String), String> {
        let process_lock = self.process.lock().map_err(|e| e.to_string())?;
        let mode = self.mode.lock().map_err(|e| e.to_string())?;
        let running = process_lock.is_some();
        let mode_str = mode.clone();
        Ok((running, mode_str))
    }
}
