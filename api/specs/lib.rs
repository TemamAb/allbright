pub mod specialists;
pub mod benchmarks;

use serde::{Deserialize, Serialize};
use std::error::Error;

#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq)]
pub enum RiskLevel {
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GateTriggerResult {
    pub should_trigger_gate: bool,
    pub gate_id: Option<String>,
    pub trigger_reason: Option<String>,
    pub risk_level: Option<RiskLevel>,
    pub recommended_actions: Vec<String>,
}

impl Default for GateTriggerResult {
    fn default() -> Self {
        Self {
            should_trigger_gate: false,
            gate_id: None,
            trigger_reason: None,
            risk_level: None,
            recommended_actions: vec![],
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SpecialistResult {
    pub name: String,
    pub category: String,
    pub tuned: bool,
    pub metrics: serde_json::Value,
    pub gate_trigger: GateTriggerResult,
}

/// Core trait for all BrightSky Solver specialists.
/// Ensures type-safe KPI tuning and status reporting across the system.
pub trait SubsystemSpecialist: Send + Sync {
    fn name(&self) -> &str;
    fn category(&self) -> &str;
    fn tune_kpis(&self, data: &serde_json::Value) -> Result<SpecialistResult, Box<dyn Error>>;
    fn status(&self) -> serde_json::Value;
}