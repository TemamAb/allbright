use std::error::Error;
use crate::{SubsystemSpecialist, SpecialistResult, GateTriggerResult, GES_WEIGHTS};
use serde_json::json;

pub struct AutoOptimizationSpecialist {
    pub last_ges: f64,
}

impl SubsystemSpecialist for AutoOptimizationSpecialist {
    fn name(&self) -> &str { "AutoOptimizationSpecialist" }
    fn category(&self) -> &str { "Auto-Optimization" }

    fn tune_kpis(&self, data: &serde_json::Value) -> Result<SpecialistResult, Box<dyn Error>> {
        // Calculate current GES based on weights from crate root
        let domain_scores = data.get("domain_scores").cloned().unwrap_or(json!([0.8, 0.8, 0.8, 0.8, 0.8, 0.8]));
        let scores: Vec<f64> = serde_json::from_value(domain_scores)?;
        
        let current_ges: f64 = scores.iter().enumerate()
            .map(|(i, score)| score * GES_WEIGHTS[i])
            .sum();

        Ok(SpecialistResult {
            name: self.name().to_string(),
            category: self.category().to_string(),
            tuned: true,
            metrics: json!({
                "current_ges": current_ges,
                "weights_used": GES_WEIGHTS,
                "drift_from_target": 0.825 - current_ges
            }),
            gate_trigger: GateTriggerResult {
                should_trigger_gate: current_ges < 0.825,
                trigger_reason: Some("GES Below Elite Threshold".to_string()),
                ..Default::default()
            },
        })
    }
    fn status(&self) -> serde_json::Value { json!({ "status": "nominal" }) }
}
