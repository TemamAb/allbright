use std::error::Error;
use std::sync::Arc;
use serde_json::json;

use crate::{
    SubsystemSpecialist, SpecialistResult, GateTriggerResult, RiskLevel, Mutex,
    WatchtowerStats,
};

/// BSS-47: Profitability Specialist
/// Focuses on optimizing net realized profit (NRP) and related metrics.
pub struct ProfitabilitySpecialist {
    name: String,
    category: String,
    stats: Arc<Mutex<WatchtowerStats>>,
}

impl ProfitabilitySpecialist {
    pub fn new(stats: Arc<Mutex<WatchtowerStats>>) -> Self {
        Self {
            name: "Profitability Specialist".to_string(),
            category: "Profitability".to_string(),
            stats,
        }
    }
}

impl SubsystemSpecialist for ProfitabilitySpecialist {
    fn name(&self) -> &str {
        &self.name
    }

    fn category(&self) -> &str {
        &self.category
    }

    fn tune_kpis(&self, _data: &serde_json::Value) -> Result<SpecialistResult, Box<dyn Error>> {
        // In a real scenario, this would analyze `data` (e.g., recent trade outcomes)
        // and `self.stats` to determine if KPI tuning is needed.
        let mut stats_guard = self.stats.lock().unwrap();

        let target_nrp = 20.0; // ETH/day, from benchmark-36-kpis.md
        let current_nrp = stats_guard.current_nrp_eth_per_day;

        let mut gate_trigger = GateTriggerResult::default();
        if current_nrp < target_nrp * 0.8 { // If NRP is significantly below target
            stats_guard.min_profit_bps += 2; // Auto-tune: increase margin requirement
            gate_trigger = GateTriggerResult {
                should_trigger_gate: true,
                gate_id: Some("PROFITABILITY_DEGRADATION".to_string()),
                trigger_reason: Some(format!("Current NRP ({:.2} ETH/day) is below 80% of target ({:.2} ETH/day)", current_nrp, target_nrp)),
                risk_level: Some(RiskLevel::HIGH),
                recommended_actions: vec!["Increase min_profit_bps".to_string(), "Review trade execution strategy".to_string()],
            };
        }

        Ok(SpecialistResult {
            name: self.name.clone(),
            category: self.category.clone(),
            tuned: current_nrp >= target_nrp, // Simple check for tuning status
            metrics: json!({ "current_nrp_eth_per_day": current_nrp, "target_nrp_eth_per_day": target_nrp }),
            gate_trigger,
        })
    }

    fn status(&self) -> serde_json::Value {
        let stats = self.stats.lock().unwrap();
        json!({
            "name": self.name,
            "category": self.category,
            "current_nrp_eth_per_day": stats.current_nrp_eth_per_day,
            "min_profit_bps": stats.min_profit_bps,
            "ready": true, // Placeholder
        })
    }
}