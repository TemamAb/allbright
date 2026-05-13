use crate::strategy::Strategy;

pub fn debug(strategy: &Strategy) -> Vec<String> {
    let mut issues = vec![];

    if strategy.failure_rate > 0.3 {
        issues.push("High failure rate detected".to_string());
    }

    if strategy.gas_cost > 25.0 {
        issues.push("Gas inefficiency detected".to_string());
    }

    if strategy.expected_profit < 50.0 {
        issues.push("Low profit efficiency".to_string());
    }

    issues
}
