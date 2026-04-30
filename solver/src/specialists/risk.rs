use std::error::Error;
use std::sync::Arc;
use serde_json::json;
use std::sync::Mutex;

use crate::{
    SubsystemSpecialist, SpecialistResult, GateTriggerResult, RiskLevel,
    WatchtowerStats,
};

/// BSS-48: Risk Specialist
/// Focuses on monitoring and mitigating various operational and market risks.
pub struct RiskSpecialist {
    name: String,
    category: String,
    stats: Arc<Mutex<WatchtowerStats>>,
}

impl RiskSpecialist {
    pub fn new(stats: Arc<Mutex<WatchtowerStats>>) -> Self {
        Self {
            name: "Risk Specialist".to_string(),
            category: "Risk".to_string(),
            stats,
        }
    }
}

impl SubsystemSpecialist for RiskSpecialist {
    fn name(&self) -> &str {
        &self.name
    }

    fn category(&self) -> &str {
        &self.category
    }

    fn tune_kpis(&self, _data: &serde_json::Value) -> Result<SpecialistResult, Box<dyn Error>> {
        // Simulate checking competitive collision rate (from benchmark-36-kpis.md)
        let stats = self.stats.lock().unwrap();
        let target_collision_rate = 0.8; // %
        let current_collision_rate = stats.current_competitive_collision_rate;

        let mut gate_trigger = GateTriggerResult::default();
        if current_collision_rate > target_collision_rate * 2.0 { // If collision rate is more than double the target
            gate_trigger = GateTriggerResult {
                should_trigger_gate: true,
                gate_id: Some("HIGH_COLLISION_RISK".to_string()),
                trigger_reason: Some(format!("Current competitive collision rate ({:.2}%) is too high (target: {:.2}%)", current_collision_rate, target_collision_rate)),
                risk_level: Some(RiskLevel::CRITICAL),
                recommended_actions: vec!["Adjust MEV protection strategy".to_string(), "Reduce scan concurrency".to_string()],
            };
        }

        Ok(SpecialistResult {
            name: self.name.clone(),
            category: self.category.clone(),
            tuned: current_collision_rate <= target_collision_rate, // Simple check for tuning status
            metrics: json!({ "current_collision_rate": current_collision_rate, "target_collision_rate": target_collision_rate }),
            gate_trigger,
        })
    }

    fn status(&self) -> serde_json::Value {
        let stats = self.stats.lock().unwrap();
        json!({
            "name": self.name,
            "category": self.category,
            "current_competitive_collision_rate": stats.current_competitive_collision_rate,
            "current_daily_drawdown_eth": stats.current_daily_drawdown_eth,
            "ready": true, // Placeholder
        })
    }
}