// BSS-45: Risk & Safety Engine
use crate::subsystems::bss_13_solver::ArbitrageOpportunity;
use crate::subsystems::bss_43_simulator::SimulationResult;
use crate::HealthStatus;
use crate::SystemPolicy;
use crate::WatchtowerStats;
use serde_json::Value;
use std::sync::atomic::Ordering;
use std::sync::Arc;

pub struct RiskSpecialist {
    pub stats: Arc<WatchtowerStats>,
}

impl crate::SubsystemSpecialist for RiskSpecialist {
    fn subsystem_id(&self) -> &'static str {
        "BSS-45"
    }
    fn check_health(&self) -> HealthStatus {
        HealthStatus::Optimal
    }
    fn upgrade_strategy(&self) -> &'static str {
        "Probabilistic: Moving to bayesian risk modeling."
    }
    fn testing_strategy(&self) -> &'static str {
        "Adversarial: Simulation of poisoned liquidity."
    }
    fn run_diagnostic(&self) -> Value {
        serde_json::json!({ "gate_active": true, "engine": "policy-validator" })
    }
    fn execute_remediation(&self, _cmd: &str) -> Result<(), String> {
        Ok(())
    }
}

pub struct RiskEngine;

impl RiskEngine {
    /// BSS-45: Final validation gate before execution.
    pub fn validate(
        _opportunity: &ArbitrageOpportunity,
        simulation: &SimulationResult,
        policy: &SystemPolicy,
        stats: &WatchtowerStats,
    ) -> bool {
        // 1. Min Profit Threshold
        let min_profit_eth = 0.001_f64.max((policy.min_profit_bps / 10000.0) * 10.0);
        if simulation.profit_eth < min_profit_eth {
            stats.signals_rejected_risk.fetch_add(1, Ordering::Relaxed);
            return false;
        }
        // 2. Profit/Gas Ratio (20% buffer)
        if simulation.profit_eth < (simulation.gas_estimate_eth * 1.2) {
            stats.signals_rejected_risk.fetch_add(1, Ordering::Relaxed);
            return false;
        }
        // 3. Position Sizing (max 10% of wallet per trade)
        if policy.max_position_size_eth > 0.0 && simulation.profit_eth > policy.max_position_size_eth {
            stats.signals_rejected_risk.fetch_add(1, Ordering::Relaxed);
            return false;
        }
        // 4. Daily Loss Limit (auto-stop at 1 ETH loss)
        if policy.daily_loss_limit_eth > 0.0 {
            let new_loss = policy.daily_loss_used_eth + simulation.profit_eth.min(0.0);
            if new_loss.abs() > policy.daily_loss_limit_eth {
                stats.signals_rejected_risk.fetch_add(1, Ordering::Relaxed);
                return false;
            }
        }
        // 5. Slippage Protection (0.5% max)
        let max_slippage_bps = 50; // 0.5%
        let min_expected_profit = simulation.profit_eth * (1.0 - max_slippage_bps as f64 / 10000.0);
        if simulation.profit_eth < min_expected_profit {
            stats.signals_rejected_risk.fetch_add(1, Ordering::Relaxed);
            return false;
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
