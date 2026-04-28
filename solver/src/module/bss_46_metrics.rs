// BSS-46: Metrics & Observability Subsystem
use crate::{HealthStatus, SubsystemSpecialist, WatchtowerStats};
use serde_json::Value;
use std::sync::atomic::Ordering;
use std::sync::Arc;

pub struct MetricsSpecialist {
    pub stats: Arc<WatchtowerStats>,
}

impl SubsystemSpecialist for MetricsSpecialist {
    fn subsystem_id(&self) -> &'static str {
        "BSS-46"
    }
    fn check_health(&self) -> HealthStatus {
        HealthStatus::Optimal
    }
    fn upgrade_strategy(&self) -> &'static str {
        "Granularity: Moving to Prometheus/Grafana export."
    }
    fn testing_strategy(&self) -> &'static str {
        "Consistency: Validating atomic counters sum."
    }
    fn run_diagnostic(&self) -> Value {
        let executed = self.stats.executed_trades_count.load(Ordering::Relaxed);
        let found = self.stats.opportunities_found_count.load(Ordering::Relaxed);
        let success_rate = if found > 0 {
            (executed as f64 / found as f64) * 100.0
        } else {
            0.0
        };

        serde_json::json!({
            "opportunities_found": found,
            "trades_executed": executed,
            "success_rate_pct": success_rate,
            "total_profit_eth": self.stats.total_profit_milli_eth.load(Ordering::Relaxed) as f64 / 1000.0
        })
    }
    fn execute_remediation(&self, _cmd: &str) -> Result<(), String> {
        Ok(())
    }
    fn ai_insight(&self) -> Option<String> {
        let profit = self.stats.total_profit_milli_eth.load(Ordering::Relaxed) as f64 / 1000.0;
        Some(format!(
             "BSS-46: Cumulative system profit is {profit:.4} ETH. Monitoring conversion efficiency."
          ))
    }
    fn get_performance_kpi(&self) -> Value {
        let executed = self.stats.executed_trades_count.load(Ordering::Relaxed);
        let found = self.stats.opportunities_found_count.load(Ordering::Relaxed);
        let success_rate = if found > 0 {
            (executed as f64 / found as f64) * 100.0
        } else {
            0.0
        };
        serde_json::json!({
            "kpi": "System Success Rate",
            "target": 95.0,
            "actual": success_rate,
            "unit": "%"
        })
    }
}

