pub mod benchmarks;
pub mod specialists;
pub mod timing;
pub mod rpc;

use serde::{Deserialize, Serialize};
use std::error::Error;

/// BSS-36: Centralized GES Weights (Total = 1.0)
/// Optimized for Elite Grade performance targets.
/// [Profit, Risk, Performance, Efficiency, Health, Auto-Opt]
pub const GES_WEIGHTS: [f64; 6] = [
    0.25, // Profitability (High alpha)
    0.20, // Risk Management
    0.15, // Execution Performance
    0.10, 0.10, 0.20 // Efficiency, Health, Auto-Optimization
];

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

/// Core trait for all allbright Solver specialists.
/// Ensures type-safe KPI tuning and status reporting across the system.
pub trait SubsystemSpecialist: Send + Sync {
    fn name(&self) -> &str;
    fn category(&self) -> &str;
    fn tune_kpis(&self, data: &serde_json::Value) -> Result<SpecialistResult, Box<dyn Error>>;
    fn status(&self) -> serde_json::Value;
}

/// Shared runtime statistics for the solver.
/// Wrapped in Arc<Mutex<...>> at the main orchestrator level.
#[derive(Debug, Default, Serialize, Deserialize)]
pub struct WatchtowerStats {
    pub current_nrp_eth_per_day: f64,
    pub min_profit_bps: u64,
    pub min_margin_ratio_bps: u64,
    pub current_competitive_collision_rate: f64,
    pub current_daily_drawdown_eth: f64,
    pub avg_latency_ms: f64,
    pub success_rate: f64,
    pub bribe_ratio_bps: u64,
    pub rpc_inclusion_latency_ms: f64,
    pub active_rpc_count: u32,
    pub msg_throughput_count: u64,
}

impl WatchtowerStats {
    pub fn new() -> Self {
        Self::default()
    }
}


#[test]
fn test_ges_weights_sum_to_one() {
    assert!((GES_WEIGHTS.iter().sum::<f64>() - 1.0).abs() < 0.001);
}
