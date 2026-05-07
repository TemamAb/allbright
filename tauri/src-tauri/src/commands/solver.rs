//! Tauri command handlers for solver process management

use tauri::State;
use crate::core::process_manager::{AppState, WorkflowStage, require_admin, require_wizard_completed};

#[tauri::command]
pub fn start_solver(mode: String, state: State<'_, AppState>) -> Result<String, String> {
    // Validate stage permissions based on work-flow-guide.md
    let stage = match mode.as_str() {
        "dev" => WorkflowStage::Dev,
        "simulation" => WorkflowStage::Simulation,
        "paper-trading" => WorkflowStage::PaperTrading,
        "shadow" => WorkflowStage::ShadowMode,
        "live-simulation" => WorkflowStage::LiveSimulation,
        "canary" => WorkflowStage::Canary,
        "live" => WorkflowStage::FullLive,
        _ => return Err(format!("Invalid mode: {}. Use: dev, simulation, paper-trading, shadow, live-simulation, canary, or live", mode)),
    };
    
    // Phase 3: Shadow Mode check - requires admin privileges
    if stage.requires_admin() {
        require_admin(&state)?;
    }
    
    // Phase 4: Live Simulation check - requires wizard completion + admin
    if matches!(stage, WorkflowStage::LiveSimulation | WorkflowStage::Canary | WorkflowStage::FullLive) {
        require_wizard_completed(&state)?;
    }
    
    tracing::info!("Starting solver in {} mode (risk: {})", mode, stage.risk_level());
    state.start(&mode)
}

#[tauri::command]
pub fn stop_solver(state: State<'_, AppState>) -> Result<String, String> {
    tracing::info!("Stopping solver");
    state.stop()
}

#[tauri::command]
pub fn get_solver_status(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let (running, mode) = state.get_status()?;
    Ok(serde_json::json!({
        "running": running,
        "mode": mode
    }))
}

#[tauri::command]
pub fn get_logs(state: State<'_, AppState>) -> Result<Vec<String>, String> {
    let logs = state.logs.lock().map_err(|e| e.to_string())?;
    Ok(logs.clone())
}
