//! Admin commands for user role management and configuration
//! Provides admin/user mode separation and wizard completion tracking

use tauri::State;
use crate::core::process_manager::{AppState, UserRole, require_admin, require_wizard_completed, WorkflowStage};

/// Set user role (admin or user)
/// Requires current admin privileges
#[tauri::command]
pub fn set_user_role(role: String, state: State<'_, AppState>) -> Result<String, String> {
    require_admin(&state)?;
    
    let new_role = match role.as_str() {
        "admin" => UserRole::Admin,
        "user" => UserRole::User,
        _ => return Err("Invalid role. Use 'admin' or 'user'".to_string()),
    };
    
    *state.role.lock().map_err(|e| e.to_string())? = new_role.clone();
    tracing::info!("User role changed to: {:?}", new_role);
    Ok(format!("Role set to: {}", role))
}

/// Get current user role
#[tauri::command]
pub fn get_user_role(state: State<'_, AppState>) -> Result<String, String> {
    let role = state.role.lock().map_err(|e| e.to_string())?;
    let role_str = match *role {
        UserRole::Admin => "admin",
        UserRole::User => "user",
    };
    Ok(role_str.to_string())
}

/// Mark wizard as completed (enables live modes for non-admin users)
#[tauri::command]
pub fn complete_wizard(state: State<'_, AppState>) -> Result<String, String> {
    *state.wizard_completed.lock().map_err(|e| e.to_string())? = true;
    tracing::info!("Wizard completed - live modes enabled");
    Ok("Wizard completed successfully".to_string())
}

/// Check if wizard is completed
#[tauri::command]
pub fn is_wizard_completed(state: State<'_, AppState>) -> Result<bool, String> {
    let completed = state.wizard_completed.lock().map_err(|e| e.to_string())?;
    Ok(*completed)
}

/// Set exposure limit for live simulation mode
/// Only available to admin users
#[tauri::command]
pub fn set_exposure_limit(limit: f64, state: State<'_, AppState>) -> Result<String, String> {
    require_admin(&state)?;
    
    if limit <= 0.0 {
        return Err("Exposure limit must be positive".to_string());
    }
    
    *state.exposure_limit.lock().map_err(|e| e.to_string())? = limit;
    tracing::info!("Exposure limit set to: ${}", limit);
    Ok(format!("Exposure limit set to: ${}", limit))
}

/// Get current exposure limit
#[tauri::command]
pub fn get_exposure_limit(state: State<'_, AppState>) -> Result<f64, String> {
    let limit = state.exposure_limit.lock().map_err(|e| e.to_string())?;
    Ok(*limit)
}

/// Validate if user can start a particular workflow stage
/// Checks admin requirements and wizard completion
#[tauri::command]
pub fn can_start_stage(stage: String, state: State<'_, AppState>) -> Result<bool, String> {
    let stage_enum = match stage.as_str() {
        "dev" => WorkflowStage::Dev,
        "simulation" => WorkflowStage::Simulation,
        "paper-trading" => WorkflowStage::PaperTrading,
        "shadow" => WorkflowStage::ShadowMode,
        "live-simulation" => WorkflowStage::LiveSimulation,
        "canary" => WorkflowStage::Canary,
        "live" => WorkflowStage::FullLive,
        _ => return Err("Unknown stage".to_string()),
    };
    
    // Check if admin required but user is not admin
    if stage_enum.requires_admin() {
        let role = state.role.lock().map_err(|e| e.to_string())?;
        if *role != UserRole::Admin {
            return Ok(false);
        }
    }
    
    // Check if wizard completion required but not completed
    if stage_enum.requires_admin() || matches!(stage_enum, WorkflowStage::LiveSimulation | WorkflowStage::FullLive) {
        let completed = state.wizard_completed.lock().map_err(|e| e.to_string())?;
        let guru_defaults = &state.guru_defaults;
        if guru_defaults.require_wizard_completion && !*completed {
            return Ok(false);
        }
    }
    
    Ok(true)
}

/// Get guru defaults (canonical settings for no-drift)
#[tauri::command]
pub fn get_guru_defaults(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let guru = &state.guru_defaults;
    Ok(serde_json::json!({
        "default_stage": guru.default_stage.to_string(),
        "default_exposure_limit": guru.default_exposure_limit,
        "allow_custom_models": guru.allow_custom_models,
        "require_wizard_completion": guru.require_wizard_completion,
    }))
}
