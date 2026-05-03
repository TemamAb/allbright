use std::sync::OnceLock;

#[derive(Debug, Clone)]
pub struct BenchmarkTargets {
    pub profitability: DomainTargets,
    pub risk: DomainTargets,
    pub performance: DomainTargets,
    pub efficiency: DomainTargets,
    pub system_health: DomainTargets,
    pub optimization: DomainTargets,
}

#[derive(Debug, Clone)]
pub struct DomainTargets {
    pub kpis: [f64; 6],
}

impl Default for BenchmarkTargets {
    fn default() -> Self {
        Self {
            profitability: DomainTargets {
                kpis: [14.77, 95.0, 0.0, 0.0, 1.45, 10.0], // NRP, Success Rate, Avg Profit, Loss Rate, Risk Adj Return, Capital Turnover
            },
            risk: DomainTargets {
                kpis: [4.0, 99.2, 0.7, 1.0, 0.0, 0.0], // Collision Rate, MEV Deflection, Revert Impact, Drawdown, P&L Volatility, Adversarial Events
            },
            performance: DomainTargets {
                kpis: [85.2, 38.5, 142.0, 500.0, 0.0, 12.5], // Alpha Decay, Solver Latency, Inclusion Latency, Signal Throughput, Execution Latency, RPC Lag
            },
            efficiency: DomainTargets {
                kpis: [88.0, 88.0, 50.0, 42.0, 15.0, 0.0], // Gas Efficiency, Liquidity Hit, Slippage Capture, RPC Quota, Bundler Saturation, Capital Efficiency
            },
            system_health: DomainTargets {
                kpis: [100.0, 0.0, 0.0, 0.0, 0.0, 0.0], // Uptime, Cycle Accuracy, RPC Reliability, Executor Deployed, Bundler Online, Circuit Breaker
            },
            optimization: DomainTargets {
                kpis: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0], // Opt Delta, Opt Cycles, Next Cycle, Perf Gap Throughput, Perf Gap Latency, Shadow Mode
            },
        }
    }
}

static BENCHMARKS: OnceLock<BenchmarkTargets> = OnceLock::new();

pub fn load_benchmarks(_path: &str) -> &'static BenchmarkTargets {
    BENCHMARKS.get_or_init(|| {
        // TODO: Parse from file
        BenchmarkTargets::default()
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_load_benchmarks_defaults() {
        let targets = load_benchmarks("dummy");
        assert_eq!(targets.profitability.kpis[0], 14.77); // NRP
        assert_eq!(targets.risk.kpis[0], 4.0); // Collision Rate
        assert_eq!(targets.performance.kpis[0], 85.2); // Alpha Decay
        assert_eq!(targets.efficiency.kpis[0], 88.0); // Gas Efficiency
        assert_eq!(targets.system_health.kpis[0], 100.0); // Uptime
    }
}
