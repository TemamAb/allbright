use std::error::Error;
use std::sync::{Arc, Mutex};
use serde_json::json;
use crate::{SubsystemSpecialist, SpecialistResult, GateTriggerResult, RiskLevel, WatchtowerStats};

/// BSS-48: Risk Specialist
/// Monitors drawdown, collision rates, and adversarial events.
pub struct RiskSpecialist {
    stats: Arc<Mutex<WatchtowerStats>>,
}

impl RiskSpecialist {
    pub fn new(stats: Arc<Mutex<WatchtowerStats>>) -> Self {
        Self { stats }
    }
}

impl SubsystemSpecialist for RiskSpecialist {
    fn name(&self) -> &str { "RiskSpecialist" }
    fn category(&self) -> &str { "Risk" }

    fn tune_kpis(&self, _data: &serde_json::Value) -> Result<SpecialistResult, Box<dyn Error>> {
        let stats = self.stats.lock().unwrap();
        
        let mut gate_trigger = GateTriggerResult::default();
        let current_drawdown = stats.current_daily_drawdown_eth;
        let collision_rate = stats.current_competitive_collision_rate;

        // P0: Circuit breaker if drawdown > 1.0 ETH or Collision > 5%
        if current_drawdown > 1.0 || collision_rate > 5.0 {
            gate_trigger = GateTriggerResult {
                should_trigger_gate: true,
                gate_id: Some("RISK_CIRCUIT_BREAKER".to_string()),
                trigger_reason: Some(format!(
                    "Critical Risk: Drawdown={:.2} ETH, Collision={:.2}%", 
                    current_drawdown, collision_rate
                )),
                risk_level: Some(RiskLevel::CRITICAL),
                recommended_actions: vec!["Pause LIVE execution".to_string(), "Verify RPC latency".to_string()],
            };
        }

        Ok(SpecialistResult {
            name: self.name().to_string(),
            category: self.category().to_string(),
            tuned: true,
            metrics: json!({
                "drawdown_eth": current_drawdown,
                "collision_rate_pct": collision_rate,
                "risk_index": if current_drawdown > 0.5 { 0.8 } else { 0.2 }
            }),
            gate_trigger,
        })
    }

    fn status(&self) -> serde_json::Value {
        let stats = self.stats.lock().unwrap();
        json!({ "status": "active", "drawdown": stats.current_daily_drawdown_eth })
    }
}
