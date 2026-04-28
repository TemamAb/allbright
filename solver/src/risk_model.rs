use crate::{ArbitrageOpportunity, SimulationResult, SystemPolicy, WatchtowerStats};
use serde_json::Value;
use std::sync::atomic::Ordering;
use std::sync::Arc;

/// Errors that can occur in risk model operations
#[derive(Debug, Clone)]
pub enum RiskModelError {
    InvalidInput(String),
    CalculationError(String),
    StatsUnavailable(String),
}

/// Dynamic Risk/Reward Model for Bayesian risk scoring
pub struct DynamicRiskModel {
    stats: Arc<WatchtowerStats>,
    // Bayesian parameters for profit prediction
    profit_mu: f64,           // Mean profit expectation
    profit_sigma2: f64,       // Variance of profit
    // Risk factors learned from historical data
    volatility_factor: f64,   // How much volatility affects risk
    gas_sensitivity: f64,     // Sensitivity to gas costs
    slippage_tolerance: f64,  // Adaptive slippage tolerance based on market conditions
}

impl DynamicRiskModel {
    pub fn new(stats: Arc<WatchtowerStats>) -> Self {
        Self {
            stats,
            profit_mu: 0.01,      // Initial mean profit expectation (0.01 ETH)
            profit_sigma2: 0.0004, // Initial variance
            volatility_factor: 1.0,
            gas_sensitivity: 1.0,
            slippage_tolerance: 0.005, // 0.5% initial
        }
    }

    /// Update Bayesian parameters with new trade outcome
    pub fn update_with_trade(&mut self, profit_eth: f64, success: bool) {
        // Bayesian update for profit distribution (Normal-Inverse-Gamma conjugate prior)
        // Simplified: updating mean and variance with exponential moving average
        let alpha = 0.1; // Learning rate
        
        // Update profit mean
        self.profit_mu = (1.0 - alpha) * self.profit_mu + alpha * profit_eth;
        
        // Update profit variance
        let profit_diff = profit_eth - self.profit_mu;
        self.profit_sigma2 = (1.0 - alpha) * self.profit_sigma2 + alpha * profit_diff.powi(2);
        
        // Adapt slippage tolerance based on recent success rate
        let success_rate = self.stats.meta_success_ratio_ema.load(Ordering::Relaxed) as f64 / 10000.0;
        if success_rate > 0.8 {
            // Increase tolerance when doing well
            self.slippage_tolerance = (self.slippage_tolerance * 0.9 + 0.008).min(0.02); // Max 2%
        } else {
            // Decrease tolerance when struggling
            self.slippage_tolerance = (self.slippage_tolerance * 0.9 + 0.003).max(0.002); // Min 0.2%
        }
    }

    /// Calculate dynamic risk score for an opportunity
    /// Returns risk score (0-1, where lower is better) and recommended adjustments
    pub fn assess_risk(
        &self,
        opportunity: &ArbitrageOpportunity,
        simulation: &SimulationResult,
        policy: &SystemPolicy,
    ) -> Result<(f64, DynamicRiskAdjustments), RiskModelError> {
        // Validate inputs
        if simulation.profit_eth.is_nan() || simulation.profit_eth.is_infinite() {
            return Err(RiskModelError::InvalidInput("Invalid profit value".to_string()));
        }
        if simulation.gas_estimate_eth.is_nan() || simulation.gas_estimate_eth.is_infinite() {
            return Err(RiskModelError::InvalidInput("Invalid gas estimate".to_string()));
        }

        // Base risk from multiple factors
        let mut risk_components = Vec::new();

        // 1. Profit uncertainty risk (based on Bayesian variance)
        let profit_uncertainty = if self.profit_sigma2 > 0.0 {
            (simulation.profit_eth / self.profit_sigma2.sqrt()).min(5.0) / 5.0
        } else {
            0.5
        };
        risk_components.push(("profit_uncertainty", profit_uncertainty));

        // 2. Volatility-adjusted profit/gas ratio
        let expected_profit = simulation.profit_eth;
        let gas_cost = simulation.gas_estimate_eth;
        let base_ratio = if gas_cost > 0.0 { expected_profit / gas_cost } else { 0.0 };
        // Adjust ratio based on market volatility (higher volatility = lower acceptable ratio)
        let volatility_adjustment = 1.0 + (self.volatility_factor - 1.0) * 0.5;
        let adjusted_ratio = base_ratio / volatility_adjustment;
        let gas_ratio_risk = (1.0 - adjusted_ratio.min(2.0) / 2.0).max(0.0); // Risk increases as ratio decreases below 2.0
        risk_components.push(("gas_ratio", gas_ratio_risk));

        // 3. Position size risk with volatility adjustment
        let position_size_risk = if policy.max_position_size_eth > 0.0 {
            let size_ratio = expected_profit / policy.max_position_size_eth;
            // Reduce allowed size in volatile markets
            let vol_adjusted_limit = policy.max_position_size_eth / self.volatility_factor;
            let vol_adjusted_limit = vol_adjusted_limit.max(0.001); // Prevent division by near-zero
            let vol_size_ratio = expected_profit / vol_adjusted_limit;
            size_ratio.min(vol_size_ratio)
        } else {
            0.0
        };
        risk_components.push(("position_size", position_size_risk.min(1.0)));

        // 4. Slippage risk with adaptive tolerance
        let slippage_risk = simulation.profit_eth * self.slippage_tolerance;
        let slippage_component = (slippage_risk / expected_profit.max(0.0001)).min(1.0);
        risk_components.push(("slippage", slippage_component));

        // 5. Market conditions risk (based on recent performance)
        let recent_performance = self.stats.meta_profit_momentum.load(Ordering::Relaxed);
        let momentum = f64::from_bits(recent_performance);
        let momentum_risk = if momentum < 0.0 { (-momentum * 10.0).min(1.0) } else { 0.0 };
        risk_components.push(("momentum", momentum_risk));

        // Calculate weighted risk score
        let total_risk: f64 = risk_components.iter()
            .map(|(_, risk)| risk * 0.2) // Equal weighting for now
            .sum();

        // Validate risk score
        if total_risk.is_nan() || total_risk.is_infinite() {
            return Err(RiskModelError::CalculationError("Invalid risk score calculated".to_string()));
        }

        // Generate recommended adjustments based on risk assessment
        let adjustments = DynamicRiskAdjustments {
            min_profit_bps: self.calculate_dynamic_min_profit(),
            max_hops: self.calculate_dynamic_max_hops(),
            position_size_pct: self.calculate_dynamic_position_limit(),
            slippage_bps: (self.slippage_tolerance * 10000.0) as u32,
            risk_score: total_risk,
        };

        Ok((total_risk, adjustments))
    }
    
    /// Calculate dynamic minimum profit based on recent performance and uncertainty
    fn calculate_dynamic_min_profit(&self) -> u64 {
        // Base minimum profit (0.05%) adjusted by confidence
        let base_min = 5.0; // 0.05% in bps
        let confidence = 1.0 / (1.0 + self.profit_sigma2 * 10000.0); // Higher variance = lower confidence
        let dynamic_min = base_min * (0.5 + confidence * 0.5); // Range: 0.5x to 1.5x base
        dynamic_min.max(2.0).min(20.0) as u64 // Clamp between 0.02% and 0.2%
    }
    
    /// Calculate dynamic max hops based on gas costs and success rate
    fn calculate_dynamic_max_hops(&self) -> i64 {
        let success_rate = self.stats.meta_success_ratio_ema.load(Ordering::Relaxed) as f64 / 10000.0;
        let base_hops = 3;
        
        // Increase hops when doing well, decrease when struggling
        let hop_adjustment = match success_rate {
            x if x > 0.9 => 1,   // Can try more complex routes
            x if x > 0.7 => 0,   // Normal
            x if x > 0.5 => -1,  // Stick to simpler routes
            _ => -2,             // Only simplest routes when performing poorly
        };
        
        (base_hops as i64 + hop_adjustment).max(1).min(5)
    }
    
    /// Calculate dynamic position limit as percentage of wallet
    fn calculate_dynamic_position_limit(&self) -> f64 {
        let success_rate = self.stats.meta_success_ratio_ema.load(Ordering::Relaxed) as f64 / 10000.0;
        let base_limit = 0.1; // 10% of wallet
        
        // Adjust based on performance and volatility
        let performance_factor = 0.5 + success_rate; // 0.5 to 1.5
        let volatility_factor = 1.0 / self.volatility_factor.max(0.5); // Inverse volatility
        
        (base_limit * performance_factor * volatility_factor)
            .min(0.25) // Max 25% of wallet
            .max(0.02) // Min 2% of wallet
    }
}

#[derive(Debug, Clone, Copy)]
pub struct DynamicRiskAdjustments {
    pub min_profit_bps: u64,
    pub max_hops: i64,
    pub position_size_pct: f64,
    pub slippage_bps: u32,
    pub risk_score: f64,
}

impl Default for DynamicRiskAdjustments {
    fn default() -> Self {
        Self {
            min_profit_bps: 5,
            max_hops: 3,
            position_size_pct: 0.1,
            slippage_bps: 50,
            risk_score: 0.5,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::WatchtowerStats;
    use std::sync::Arc;

    #[test]
    fn test_assess_risk_valid_inputs() {
        let stats = Arc::new(WatchtowerStats::default());
        let model = DynamicRiskModel::new(stats);

        let opportunity = ArbitrageOpportunity {
            path: vec![0, 1, 2, 0],
            log_weight: -0.1,
        };

        let simulation = SimulationResult {
            profit_eth: 0.1,
            gas_estimate_eth: 0.01,
            // Add other required fields with defaults
            ..Default::default()
        };

        let policy = SystemPolicy {
            max_position_size_eth: 1.0,
            // Add other required fields with defaults
            ..Default::default()
        };

        let result = model.assess_risk(&opportunity, &simulation, &policy);
        assert!(result.is_ok());

        let (risk_score, adjustments) = result.unwrap();
        assert!(risk_score >= 0.0 && risk_score <= 1.0);
        assert!(adjustments.risk_score >= 0.0 && adjustments.risk_score <= 1.0);
    }

    #[test]
    fn test_assess_risk_invalid_profit() {
        let stats = Arc::new(WatchtowerStats::default());
        let model = DynamicRiskModel::new(stats);

        let opportunity = ArbitrageOpportunity {
            path: vec![0, 1, 2, 0],
            log_weight: -0.1,
        };

        let simulation = SimulationResult {
            profit_eth: f64::NAN,
            gas_estimate_eth: 0.01,
            ..Default::default()
        };

        let policy = SystemPolicy {
            max_position_size_eth: 1.0,
            ..Default::default()
        };

        let result = model.assess_risk(&opportunity, &simulation, &policy);
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), RiskModelError::InvalidInput(_)));
    }

    #[test]
    fn test_assess_risk_invalid_gas() {
        let stats = Arc::new(WatchtowerStats::default());
        let model = DynamicRiskModel::new(stats);

        let opportunity = ArbitrageOpportunity {
            path: vec![0, 1, 2, 0],
            log_weight: -0.1,
        };

        let simulation = SimulationResult {
            profit_eth: 0.1,
            gas_estimate_eth: f64::INFINITY,
            ..Default::default()
        };

        let policy = SystemPolicy {
            max_position_size_eth: 1.0,
            ..Default::default()
        };

        let result = model.assess_risk(&opportunity, &simulation, &policy);
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), RiskModelError::InvalidInput(_)));
    }

    #[test]
    fn test_update_with_trade() {
        let stats = Arc::new(WatchtowerStats::default());
        let mut model = DynamicRiskModel::new(stats);

        let initial_mu = model.profit_mu;
        let initial_sigma2 = model.profit_sigma2;

        model.update_with_trade(0.1, true);

        // Mean should be updated
        assert_ne!(model.profit_mu, initial_mu);
        // Variance should be updated
        assert_ne!(model.profit_sigma2, initial_sigma2);
    }

    #[test]
    fn test_slippage_tolerance_adaptation() {
        let stats = Arc::new(WatchtowerStats::default());
        let mut model = DynamicRiskModel::new(stats);

        // Simulate successful trades
        for _ in 0..10 {
            model.update_with_trade(0.1, true);
        }

        // Slippage tolerance should increase with success
        assert!(model.slippage_tolerance > 0.005); // Initial value

        // Reset model and simulate failures
        let mut model2 = DynamicRiskModel::new(Arc::new(WatchtowerStats::default()));
        for _ in 0..10 {
            model2.update_with_trade(0.01, false); // Small profit, failed
        }

        // Slippage tolerance should decrease with failures
        assert!(model2.slippage_tolerance < 0.005); // Should be lower
    }
}