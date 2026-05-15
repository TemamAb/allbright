use crate::strategy::Strategy;
use crate::debugger::{ArbitrageDebugger, DiagnosticReport};

/// Simulation result
#[derive(Debug, Clone)]
pub struct SimulationResult {
    pub profit: f64,
    pub loss: f64,
    pub net_result: f64,
    pub gas_spent: f64,
    pub flash_loan_fee: f64,
    pub success: bool,
    pub steps: usize,
}

impl Default for SimulationResult {
    fn default() -> Self {
        SimulationResult {
            profit: 0.0,
            loss: 0.0,
            net_result: 0.0,
            gas_spent: 0.0,
            flash_loan_fee: 0.0,
            success: false,
            steps: 0,
        }
    }
}

/// Flash Loan Simulator
/// Simulates flash loan arbitrage execution
pub struct FlashLoanSimulator {
    flash_loan_fee_bps: f64,
    gas_price_gwei: f64,
}

impl FlashLoanSimulator {
    pub fn new(flash_loan_fee_bps: f64, gas_price_gwei: f64) -> Self {
        FlashLoanSimulator {
            flash_loan_fee_bps,
            gas_price_gwei,
        }
    }

    pub fn new_default() -> Self {
        FlashLoanSimulator::new(9.0, 20.0)
    }

    pub fn simulate(&self, strategy: &Strategy, loan_amount: f64) -> SimulationResult {
        let mut result = SimulationResult::default();
        
        result.flash_loan_fee = loan_amount * (self.flash_loan_fee_bps / 10000.0);
        let gas_limit: f64 = 500000.0;
        result.gas_spent = gas_limit * self.gas_price_gwei / 1e9;
        
        let gross_profit = strategy.expected_profit;
        let net_profit = gross_profit - result.flash_loan_fee - result.gas_spent;
        let success_probability = 1.0 - strategy.failure_rate;
        let expected_value = net_profit * success_probability;
        
        result.net_result = expected_value;
        result.profit = if expected_value > 0.0 { expected_value } else { 0.0 };
        result.loss = if expected_value < 0.0 { expected_value.abs() } else { 0.0 };
        result.success = expected_value > 0.0;
        result.steps = self.estimate_steps(strategy);
        
        result
    }

    pub fn simulate_with_diagnostic(&self, strategy: &Strategy, loan_amount: f64) -> (SimulationResult, DiagnosticReport) {
        let result = self.simulate(strategy, loan_amount);
        let mut debugger = ArbitrageDebugger::new_default();
        let report = debugger.run_diagnostic(strategy);
        (result, report)
    }

    fn estimate_steps(&self, strategy: &Strategy) -> usize {
        let base_steps = 10;
        let retry_overhead = (strategy.failure_rate * 5.0) as usize;
        base_steps + retry_overhead
    }

    pub fn break_even(&self, loan_amount: f64) -> f64 {
        let fee = loan_amount * (self.flash_loan_fee_bps / 10000.0);
        let gas = 500000.0 * self.gas_price_gwei / 1e9;
        fee + gas
    }

    pub fn is_profitable(&self, strategy: &Strategy, loan_amount: f64) -> bool {
        let result = self.simulate(strategy, loan_amount);
        result.success
    }
}

pub fn simulate(strategy: &Strategy) -> f64 {
    let simulator = FlashLoanSimulator::new_default();
    let result = simulator.simulate(strategy, 10000.0);
    result.net_result
}
