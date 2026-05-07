//! Tauri command handlers for deployment readiness
//! Calls the API server endpoints to check and trigger readiness analysis

use serde::{Deserialize, Serialize};

/// Readiness status response from the API
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ReadinessStatus {
    pub ready: bool,
    pub missing_approvals: Vec<String>,
    pub issues: Vec<String>,
    pub recommendations: Vec<String>,
}

/// Full readiness report from the API
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ReadinessReport {
    pub generated_at: String,
    pub overall_status: String,
    pub deployment_score: u32,
    pub override_active: bool,
    pub gates: Vec<GateStatus>,
    pub strategic_checklist: StrategicChecklist,
    pub issues: Vec<String>,
    pub recommendations: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GateStatus {
    pub gate_id: String,
    pub gate_name: String,
    pub status: String,
    pub approved: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StrategicChecklist {
    pub bribe_engine_sync: CheckItem,
    pub meta_learner_active: CheckItem,
    pub kpi_persistence: CheckItem,
    pub simulation_gate: CheckItem,
    pub liquidity_gate: CheckItem,
    pub orchestrator_health: CheckItem,
    pub source_integrity: CheckItem,
    pub disaster_recovery: CheckItem,
    pub apex_pursuit_active: CheckItem,
    pub engineering_integrity: CheckItem,
    pub private_relay_active: CheckItem,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CheckItem {
    pub status: String,
    pub details: String,
}

/// Get deployment readiness summary from API
#[tauri::command]
pub fn get_readiness_status() -> Result<ReadinessStatus, String> {
    tracing::info!("Fetching deployment readiness status from API");

    // Call the API server endpoint
    let api_url = std::env::var("API_URL").unwrap_or_else(|_| "http://localhost:3000".to_string());
    let url = format!("{}/api/deployment/readiness", api_url);

    let client = reqwest::blocking::Client::new();
    let response = client
        .get(&url)
        .timeout(std::time::Duration::from_secs(30))
        .send()
        .map_err(|e| format!("Failed to connect to API: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("API returned error: {}", response.status()));
    }

    let status: ReadinessStatus = response
        .json()
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    tracing::info!(
        "Readiness status: ready={}, issues={}",
        status.ready,
        status.issues.len()
    );

    Ok(status)
}

/// Run a full deployment readiness check
#[tauri::command]
pub fn run_readiness_check() -> Result<ReadinessReport, String> {
    tracing::info!("Running deployment readiness check via API");

    // Call the API server endpoint
    let api_url = std::env::var("API_URL").unwrap_or_else(|_| "http://localhost:3000".to_string());
    let url = format!("{}/api/deployment/readiness/run", api_url);

    let client = reqwest::blocking::Client::new();
    let response = client
        .post(&url)
        .timeout(std::time::Duration::from_secs(120))
        .send()
        .map_err(|e| format!("Failed to connect to API: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("API returned error: {}", response.status()));
    }

    let report: ReadinessReport = response
        .json()
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    tracing::info!(
        "Readiness report: status={}, score={}",
        report.overall_status,
        report.deployment_score
    );

    Ok(report)
}
