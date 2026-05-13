use crate::strategy::Strategy;

pub fn simulate(strategy: &Strategy) -> f64 {
    let risk_penalty = strategy.failure_rate * 50.0;
    let gas_penalty = strategy.gas_cost;

    strategy.expected_profit - risk_penalty - gas_penalty
}
