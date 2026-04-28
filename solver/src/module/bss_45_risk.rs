// BSS-45: Risk & Safety Engine
use crate::{HealthStatus, SubsystemSpecialist, WatchtowerStats, ArbitrageOpportunity, SimulationResult, SystemPolicy};
use serde_json::Value;
use std::sync::atomic::Ordering;
use std::sync::Arc;
use std::sync::Mutex;

pub struct RiskSpecialist {
    pub stats: Arc<WatchtowerStats>,
    pub risk_model: Mutex<crate::risk_model::DynamicRiskModel>,
}

impl crate::SubsystemSpecialist for RiskSpecialist {
    fn subsystem_id(&self) -> &'static str {
        "BSS-45"
    }
    
    fn check_health(&self) -> HealthStatus {
        HealthStatus::Optimal
    }
    
    fn upgrade_strategy(&self) -> &'static str {
        "Probabilistic: Using bayesian risk modeling with dynamic adjustments."
    }
    
    fn testing_strategy(&self) -> &'static str {
        "Adversarial: Simulation of poisoned liquidity."
    }
    
    fn run_diagnostic(&self) -> Value {
        let risk_model_result = self.risk_model.lock();
        match risk_model_result {
            Ok(risk_model) => serde_json::json!({
                "gate_active": true,
                "engine": "bayesian_risk_model",
                "risk_score": risk_model.risk_score,
                "slippage_tolerance": risk_model.slippage_tolerance,
                "profit_mu": risk_model.profit_mu,
                "profit_sigma": risk_model.profit_sigma2.sqrt(),
                "status": "operational"
            }),
            Err(_) => serde_json::json!({
                "gate_active": false,
                "engine": "bayesian_risk_model",
                "error": "Risk model mutex poisoned",
                "status": "error"
            })
        }
    }
    
    fn execute_remediation(&self, _cmd: &str) -> Result<(), String> {
        Ok(())
    }
    
    fn get_performance_kpi(&self) -> Value {
        serde_json::json!({
            "kpi": "Risk Gate Rejection Rate",
            "target": 10.0,
            "actual": self.stats.signals_rejected_risk.load(Ordering::Relaxed) as f64,
            "unit": "rejections"
        })
    }
    
    fn ai_insight(&self) -> Option<String> {
        let risk_model_result = self.risk_model.lock();
        match risk_model_result {
            Ok(risk_model) => Some(format!(
                "Bayesian Risk Model: Profit μ={:.4f}σ, σ={:.4f}, Slippage Tolerance={:.2}%, Risk Score={:.2}",
                risk_model.profit_mu,
                risk_model.profit_sigma2.sqrt(),
                risk_model.slippage_tolerance * 100.0,
                risk_model.risk_score
            )),
            Err(_) => Some("Bayesian Risk Model: Error - Mutex poisoned".to_string())
        }
    }
}

pub struct RiskEngine;

impl RiskEngine {
    /// BSS-45: Final validation gate before execution using dynamic Bayesian risk modeling.
    pub fn validate(
        opportunity: &ArbitrageOpportunity,
        simulation: &SimulationResult,
        policy: &SystemPolicy,
        stats: &WatchtowerStats,
        risk_model: &Mutex<crate::risk_model::DynamicRiskModel>,
    ) -> bool {
        // Additional hard stops for extreme cases (checked first for performance)
        if simulation.profit_eth <= 0.0 {
            stats.signals_rejected_risk.fetch_add(1, Ordering::Relaxed);
            return false;
        }

        if simulation.gas_estimate_eth <= 0.0 {
            stats.signals_rejected_risk.fetch_add(1, Ordering::Relaxed);
            return false;
        }

        // Update the risk model with recent trade outcomes (this would typically be done separately)
        // For now, we'll use the current model state

        let risk_assessment = {
            let risk_model_locked = match risk_model.lock() {
                Ok(model) => model,
                Err(_) => {
                    // Mutex poisoned, reject trade for safety
                    stats.signals_rejected_risk.fetch_add(1, Ordering::Relaxed);
                    return false;
                }
            };
            risk_model_locked.assess_risk(opportunity, simulation, policy)
        };

        let (risk_score, _adjustments) = match risk_assessment {
            Ok(result) => result,
            Err(_) => {
                // Risk calculation failed, reject trade for safety
                stats.signals_rejected_risk.fetch_add(1, Ordering::Relaxed);
                return false;
            }
        };

        // Dynamic risk-based decision making
        // Only proceed if risk score is below threshold (configurable based on market conditions)
        let risk_threshold = 0.7; // Start conservative, can be adjusted by auto-optimizer

        // Primary risk gate
        if risk_score > risk_threshold {
            stats.signals_rejected_risk.fetch_add(1, Ordering::Relaxed);
            return false;
        }

        // Log the dynamic adjustments for monitoring/tuning
        // In a real implementation, these would feed back into policy adjustments
        if risk_score > 0.5 {
            // Higher risk trades get logged for analysis
            // This could be expanded to adjust future parameters
        }

        true
    }

    /// BSS-45: Post-simulation slippage check at execution time
    pub fn check_slippage(
        simulated_output: u128,
        actual_reserve_in: u128,
        actual_reserve_out: u128,
        fee_bps: u32,
    ) -> bool {
        let expected_output = super::bss_44_liquidity::LiquidityEngine::get_amount_out(
            simulated_output,
            actual_reserve_out,
            actual_reserve_in,
            fee_bps,
        );
        if expected_output == 0 { return false; }
        let slippage_bps = ((simulated_output as f64 - expected_output as f64) / simulated_output as f64 * 10000.0) as i32;
        slippage_bps <= 50
    }
}
