#[derive(Clone)]
pub struct Strategy {
    pub name: String,
    pub expected_profit: f64,
    pub failure_rate: f64,
    pub gas_cost: f64,
}

pub fn baseline_strategy() -> Strategy {
    Strategy {
        name: "baseline_arbitrage".to_string(),
        expected_profit: 120.0,
        failure_rate: 0.25,
        gas_cost: 20.0,
    }
}

pub fn upgraded_strategy(base: &Strategy) -> Strategy {
    Strategy {
        name: "optimized_arbitrage_v2".to_string(),
        expected_profit: base.expected_profit * 1.35,
        failure_rate: base.failure_rate * 0.8,
        gas_cost: base.gas_cost * 0.9,
    }
}
