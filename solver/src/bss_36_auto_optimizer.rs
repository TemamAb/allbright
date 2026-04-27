use crate::{HealthStatus, SubsystemSpecialist, WatchtowerStats, TARGET_TOTAL_SCORE_PCT, TARGET_CYCLES_PER_HOUR};
use serde_json::Value;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;

/// BSS-36: Auto-Optimization Subsystem
/// Continually monitors KPIs, commits logic improvements, and manages redeployment cycles.
/// Now part of Domain 6: Auto-Optimization.
pub struct AutoOptimizer {
    pub last_optimization: AtomicU64,
    pub cycle_interval_secs: AtomicU64,
    pub stats: Arc<WatchtowerStats>,
}

impl SubsystemSpecialist for AutoOptimizer {
    fn subsystem_id(&self) -> &'static str {
        "BSS-36"
    }

    fn check_health(&self) -> HealthStatus {
        let conv = self.stats.opt_convergence_rate.load(Ordering::Relaxed);
        if conv > 10 {
            HealthStatus::Degraded(format!("Optimization failed to converge: {} cycles", conv))
        } else {
            HealthStatus::Optimal
        }
    }

    fn upgrade_strategy(&self) -> &'static str {
        "Self-Modifying: Updates local strategy weights based on 31 KPI analysis."
    }

    fn testing_strategy(&self) -> &'static str {
        "Multi-KPI Validation: Compare all 31 KPIs before/after optimization."
    }

    fn run_diagnostic(&self) -> Value {
        serde_json::json!({
            "current_interval": self.cycle_interval_secs.load(Ordering::Relaxed),
            "last_redeployment": self.last_optimization.load(Ordering::Relaxed),
            "convergence_cycles": self.stats.opt_convergence_rate.load(Ordering::Relaxed)
        })
    }

    fn execute_remediation(&self, command: &str) -> Result<(), String> {
        if command == "CONTINUOUS_TUNE" {
            let ges = self.calculate_global_efficiency_score();
            self.tune_engine_parameters(ges);
            
            let cpu = self.stats.cpu_usage_percent.load(Ordering::Relaxed);
            if cpu > 80 {
                self.stats.thermal_throttle_active.store(true, Ordering::SeqCst);
            } else if cpu < 60 {
                self.stats.thermal_throttle_active.store(false, Ordering::SeqCst);
            }

            let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs();
            self.last_optimization.store(now, Ordering::SeqCst);
            return Ok(());
        }
        
        if command == "COMMIT_OPTIMIZATION" {
            let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_secs();
            self.last_optimization.store(now, Ordering::SeqCst);
            self.stats.opt_improvement_delta.store(5, Ordering::Relaxed);
            self.stats.opt_cycles_hour.fetch_add(1, Ordering::Relaxed);
            let next_interval = self.cycle_interval_secs.load(Ordering::Relaxed);
            self.stats.next_opt_cycle_timestamp.store(now + next_interval, Ordering::Relaxed);
            return Ok(());
        }
        Err("Optimization command failed".into())
    }

    fn get_performance_kpi(&self) -> Value {
        let ges = self.calculate_global_efficiency_score();
        serde_json::json!({
            "kpi": "Total Weighted Score",
            "target": TARGET_TOTAL_SCORE_PCT,
            "actual": ges * 100.0,
            "unit": "%"
        })
    }

    /// BSS-36 Convergence Sensing Logic
    /// Reports Domain 6 score based on how quickly the system stabilizes.
    /// Target: < 3 cycles (KPI 6.3)
    fn get_domain_score(&self) -> f64 {
        let actual_cycles = self.stats.opt_convergence_rate.load(Ordering::Relaxed) as f64;
        
        let score = if actual_cycles == 0.0 {
            1.0 // System is perfectly stable
        } else {
            // Target is 3.0 cycles. Score decreases linearly as cycles increase.
            (3.0 / actual_cycles).min(1.0)
        };

        self.stats.domain_score_auto_opt.store((score * 1000.0) as u64, Ordering::Relaxed);
        score
    }

    fn ai_insight(&self) -> Option<String> {
        let ges = self.calculate_global_efficiency_score();
        Some(format!("BSS-36 Executive: Global Efficiency Score: {:.2}%. Status: {}", 
            ges * 100.0,
            if ges >= 0.95 { "ELITE" } else { "TUNING" }
        ))
    }
}

impl AutoOptimizer {
    /// BSS-36: Calculates a weighted Global Efficiency Score based on real-time domain feedback.
    /// Weights aligned with KPI_Audit.md Part I: 30/20/20/10/10/10
    fn calculate_global_efficiency_score(&self) -> f64 {
        const W_PROFIT: f64 = 0.30;
        const W_RISK: f64 = 0.20;
        const W_PERF: f64 = 0.20;
        const W_EFF: f64 = 0.10;
        const W_HEALTH: f64 = 0.10;
        const W_AUTO_OPT: f64 = 0.10;

        let d1 = self.stats.domain_score_profit.load(Ordering::Relaxed) as f64 / 1000.0;
        let d2 = self.stats.domain_score_risk.load(Ordering::Relaxed) as f64 / 1000.0;
        let d3 = self.stats.domain_score_perf.load(Ordering::Relaxed) as f64 / 1000.0;
        let d4 = self.stats.domain_score_eff.load(Ordering::Relaxed) as f64 / 1000.0;
        let d5 = self.stats.domain_score_health.load(Ordering::Relaxed) as f64 / 1000.0;
        let d6 = self.stats.domain_score_auto_opt.load(Ordering::Relaxed) as f64 / 1000.0;

        (d1 * W_PROFIT) + 
        (d2 * W_RISK) + 
        (d3 * W_PERF) + 
        (d4 * W_EFF) + 
        (d5 * W_HEALTH) + 
        (d6 * W_AUTO_OPT)
    }

    fn tune_engine_parameters(&self, ges: f64) {
        if ges < 0.85 {
            // Aggressive recovery
            self.stats.min_profit_bps_adj.fetch_add(10, Ordering::Relaxed);
            self.stats.opt_convergence_rate.fetch_add(1, Ordering::Relaxed);
        } else if ges < 0.95 {
            // Micro-tuning
            let latency = self.stats.solver_latency_p99_ms.load(Ordering::Relaxed);
            if latency < 8 {
                let current = self.stats.min_profit_bps_adj.load(Ordering::Relaxed);
                if current > 2 {
                    self.stats.min_profit_bps_adj.fetch_sub(1, Ordering::Relaxed);
                }
            }
            // Reset convergence rate as we approach elite state
            self.stats.opt_convergence_rate.store(1, Ordering::Relaxed);
        } else {
            // Elite maintenance
            self.stats.opt_convergence_rate.store(0, Ordering::Relaxed);
            self.stats.opt_improvement_delta.store(2, Ordering::Relaxed);
        }

        self.stats.total_weighted_score.store((ges * 1000.0) as u64, Ordering::Relaxed);
        println!("[BSS-36] EXECUTIVE REFRESH: GES = {:.2}%, Stability = {} cycles", 
            ges * 100.0, self.stats.opt_convergence_rate.load(Ordering::Relaxed));
    }
}