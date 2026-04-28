// BSS-43: Benchmark Target Service
// Source of truth: benchmark-36-kpis.md — 36 Elite Grade KPIs across 6 weighted domains (GES).
// This module provides target thresholds for the pre-deployment gate (Phase 1.5).

use std::sync::OnceLock;

/// BSS-36: GES domain weights (must sum to 1.0)
/// Aligned with KPIs_Audit.md Part I Category weights:
/// Profitability 25% + Risk 20% + Performance 15% + Efficiency 10% + Health 10% + Auto-Opt 10% = 90%
/// Remaining 10% is Dashboard domain (not included in GES gate - used for telemetry only)
pub const GES_DOMAIN_WEIGHTS: [f64; 6] = [0.25, 0.20, 0.15, 0.10, 0.10, 0.10];

/// Elite benchmark targets for the 36-KPI matrix.
/// Metrics stored in natural units (ETH, ms, %, bps, count, etc.)
#[derive(Debug, Clone)]
pub struct BenchmarkTargets {
    // === DOMAIN 1: PROFITABILITY (Weight: 25%) ===
    pub daily_profit_eth: f64,              // 1.1: 22.5 ETH/day
    pub avg_profit_per_trade_eth: f64,      // 1.2: 0.0045 ETH
    pub total_profit_trajectory: f64,       // 1.3: positive (use as boolean flag)
    pub spread_capture_bps: f64,            // 1.4: 15 bps
    pub capital_efficiency: f64,            // 1.5: > 0.8 (80%)
    pub alpha_decay_ms: f64,                // 1.6: > 500ms (lower is better, so we check < 500)

    // === DOMAIN 2: RISK MANAGEMENT (Weight: 20%) ===
    pub loss_rate_bps: f64,                 // 2.1: < 50 bps (0.5%)
    pub daily_drawdown_eth: f64,            // 2.2: 0.4 ETH max
    pub risk_gate_rejection_rate: f64,      // 2.3: > 99% (fraction of bad trades blocked)
    pub adversarial_detections_active: bool,// 2.4: system active (true)
    pub circuit_breaker_uptime: f64,        // 2.5: nominal < 24h total downtime

    // === DOMAIN 3: PERFORMANCE & EXECUTION (Weight: 15%) ===
    pub solver_latency_p99_ms: f64,         // 3.1: < 12ms
    pub msg_throughput_per_sec: f64,        // 3.2: 500 msg/s
    pub success_rate_pct: f64,              // 3.3: > 98.8%
    pub solver_jitter_ms: f64,              // 3.4: < 5ms
    pub opportunities_per_hour: f64,        // 3.5: > 1000/hr
    pub signal_throughput_per_sec: f64,     // 3.6: > 5000/sec

    // === DOMAIN 4: EFFICIENCY & SIMULATION (Weight: 10%) ===
    pub gas_efficiency_pct: f64,            // 4.1: > 96.5%
    pub liquidity_hit_rate_pct: f64,        // 4.2: > 97.5%
    pub sim_success_rate_pct: f64,          // 4.3: > 99%
    pub sim_parity_delta_bps: f64,          // 4.4: < 2 bps
    pub mempool_ingestion_ev_s: f64,        // 4.5: 10,000 ev/s

    // === DOMAIN 5: SYSTEM HEALTH (Weight: 10%) ===
    pub uptime_pct: f64,                    // 5.1: 99.9%
    pub cycle_accuracy_pct: f64,            // 5.2: > 95%
    pub cpu_usage_pct: f64,                 // 5.3: < 80%

    // === DOMAIN 6: AUTO-OPTIMIZATION (Weight: 10%) ===
    pub opt_improvement_delta_bps: f64,     // 6.1: > 5 bps per cycle
    pub opt_cycles_per_hour: f64,           // 6.2: 120 cycles
    pub opt_convergence_cycles: f64,        // 6.3: < 3 cycles
    pub graph_update_latency_ms: f64,       // 6.4: < 5ms
    pub stability_index_pct: f64,           // 6.5: > 98%

    // === DOMAIN 7: DASHBOARD & TELEMETRY (Weight: 10%) —informational only, not in GES
    pub ui_latency_ms: f64,                 // 7.1: < 500ms
    pub socket_stability_pct: f64,          // 7.2: > 99.9%
    pub api_heartbeat_sec: f64,             // 7.3: < 5s
    pub telemetry_fidelity_pct: f64,        // 7.4: 100%
    pub ges_target_pct: f64,                // 7.5: > 95% (elite GES threshold)
}

impl Default for BenchmarkTargets {
    fn default() -> Self {
        Self {
            // Domain 1: Profitability (25%)
            daily_profit_eth: 22.5,
            avg_profit_per_trade_eth: 0.0045,
            total_profit_trajectory: 1.0,  // positive flag
            spread_capture_bps: 15.0,
            capital_efficiency: 0.80,
            alpha_decay_ms: 500.0,

            // Domain 2: Risk Management (20%)
            loss_rate_bps: 50.0,
            daily_drawdown_eth: 0.4,
            risk_gate_rejection_rate: 0.99,
            adversarial_detections_active: true,
            circuit_breaker_uptime: 24.0,

            // Domain 3: Performance & Execution (15%)
            solver_latency_p99_ms: 12.0,
            msg_throughput_per_sec: 500.0,
            success_rate_pct: 98.8,
            solver_jitter_ms: 5.0,
            opportunities_per_hour: 1000.0,
            signal_throughput_per_sec: 5000.0,

            // Domain 4: Efficiency & Simulation (10%)
            gas_efficiency_pct: 96.5,
            liquidity_hit_rate_pct: 97.5,
            sim_success_rate_pct: 99.0,
            sim_parity_delta_bps: 2.0,
            mempool_ingestion_ev_s: 10000.0,

            // Domain 5: System Health (10%)
            uptime_pct: 99.9,
            cycle_accuracy_pct: 95.0,
            cpu_usage_pct: 80.0,

            // Domain 6: Auto-Optimization (10%)
            opt_improvement_delta_bps: 5.0,
            opt_cycles_per_hour: 120.0,
            opt_convergence_cycles: 3.0,
            graph_update_latency_ms: 5.0,
            stability_index_pct: 98.0,

            // Domain 7: Dashboard & Telemetry (10%)
            ui_latency_ms: 500.0,
            socket_stability_pct: 99.9,
            api_heartbeat_sec: 5.0,
            telemetry_fidelity_pct: 100.0,
            ges_target_pct: 95.0,
        }
    }
}

/// Load benchmarks from the markdown file at `benchmark-36-kpis.md`.
/// Falls back to `Default::default()` on any error.
pub fn load_benchmarks(path: &str) -> BenchmarkTargets {
    let file = match std::fs::read_to_string(path) {
        Ok(f) => f,
        Err(e) => {
            eprintln!("[BSS-43] Warning: Could not read benchmarks file '{}': {}. Using defaults.", path, e);
            return BenchmarkTargets::default();
        }
    };

    // Parse the table from KPIs_Audit.md format
    // Table starts after header "## 🎯 THE 36 ELITE GRADE KPI WEIGHTED MATRIX"
    // Rows: | Category | ID | Operational Metric | Design Target | Weight |
    let mut targets = BenchmarkTargets::default();
    let mut in_table = false;

    for line in file.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with("|---") {
            in_table = true;
            continue;
        }
        if !in_table {
            continue;
        }
        if !trimmed.starts_with('|') {
            break; // table ends
        }

        // Parse: | **1. Profitability** | 1.1 | Daily Profit | 22.5 ETH | **25%** |
        let cells: Vec<&str> = trimmed
            .split('|')
            .filter(|s| !s.trim().is_empty())
            .collect();

        if cells.len() < 5 {
            continue;
        }

        // cells[0] is category name (ignored)
        let _id = cells[1].trim();
        let metric_name = cells[2].trim();
        let target_str = cells[3].trim();

        // Parse target value
        let target_val = parse_target_value(target_str);

        // Map to struct fields by metric name
        match metric_name {
            "Daily Profit" => targets.daily_profit_eth = target_val,
            "Avg Profit Per Trade" => targets.avg_profit_per_trade_eth = target_val,
            "Total Cumulative Profit" => targets.total_profit_trajectory = target_val,
            "Spread Capture" => targets.spread_capture_bps = target_val,
            "Capital Efficiency" => targets.capital_efficiency = target_val / 100.0,
            "Alpha Decay" => targets.alpha_decay_ms = target_val,
            "Loss Rate" => targets.loss_rate_bps = target_val,
            "Daily Drawdown" => targets.daily_drawdown_eth = target_val,
            "Risk Gate Rejections" => targets.risk_gate_rejection_rate = target_val,
            "Adversarial Detections" => targets.adversarial_detections_active = true,
            "Circuit Breaker State" => targets.circuit_breaker_uptime = target_val,
            "Solver Latency (p99)" => targets.solver_latency_p99_ms = target_val,
            "Message Throughput" => targets.msg_throughput_per_sec = target_val,
            "Success Rate" => targets.success_rate_pct = target_val,
            "Solver Jitter" => targets.solver_jitter_ms = target_val,
            "Opportunity Detection Count" => targets.opportunities_per_hour = target_val,
            "Signal Throughput" => targets.signal_throughput_per_sec = target_val,
            "Gas Efficiency" => targets.gas_efficiency_pct = target_val,
            "Liquidity Hit Rate" => targets.liquidity_hit_rate_pct = target_val,
            "Sim Success Rate" => targets.sim_success_rate_pct = target_val,
            "Sim Parity Delta" => targets.sim_parity_delta_bps = target_val,
            "Mempool Ingestion Pressure" => targets.mempool_ingestion_ev_s = target_val,
            "Uptime" => targets.uptime_pct = target_val,
            "Cycle Accuracy" => targets.cycle_accuracy_pct = target_val,
            "CPU Usage" => targets.cpu_usage_pct = target_val,
            "Opt Improvement Delta" => targets.opt_improvement_delta_bps = target_val,
            "Opt Cycles / Hour" => targets.opt_cycles_per_hour = target_val,
            "Opt Convergence Speed" => targets.opt_convergence_cycles = target_val,
            "Arb Graph Update Latency" => targets.graph_update_latency_ms = target_val,
            "Stability Index" => targets.stability_index_pct = target_val,
            "UI Latency" => targets.ui_latency_ms = target_val,
            "Socket Stability" => targets.socket_stability_pct = target_val,
            "API Sync Heartbeat" => targets.api_heartbeat_sec = target_val,
            "Telemetry Fidelity" => targets.telemetry_fidelity_pct = target_val,
            "Global Efficiency Score (GES)" => targets.ges_target_pct = target_val,
            _ => {}
        }
    }

    targets
}

/// Parse a target string like "22.5 ETH", "< 12ms", "> 98.8%", "10,000 ev/s" into f64.
fn parse_target_value(s: &str) -> f64 {
    let s = s.trim();
    // Remove inequality prefix
    let s = s.trim_start_matches(['<', '>', '≤', '≥', '≈', '~']).trim();
    // Remove units and commas
    let cleaned = s
        .replace("ETH", "")
        .replace("ms", "")
        .replace("%", "")
        .replace("bps", "")
        .replace("ev/s", "")
        .replace("msg/sec", "")
        .replace("cycles", "")
        .replace("cycles", "")
        .replace(",", "")
        .trim()
        .to_string();

    cleaned.parse::<f64>().unwrap_or(0.0)
}

/// Global singleton for benchmarks, initialized at startup.
static BENCHMARKS: OnceLock<BenchmarkTargets> = OnceLock::new();

/// Initialize global benchmarks. Call once at startup in main().
pub fn init_benchmarks(path: &str) -> Result<(), String> {
    let benchmarks = load_benchmarks(path);
    BENCHMARKS
        .set(benchmarks)
        .map_err(|_| "Benchmarks already initialized".to_string())
}

/// Get global benchmarks (panics if not initialized).
pub fn get_benchmarks() -> &'static BenchmarkTargets {
    BENCHMARKS.get().expect("Benchmarks not initialized. Call init_benchmarks() at startup.")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ges_weights_sum() {
        let sum: f64 = GES_DOMAIN_WEIGHTS.iter().sum();
        assert!((sum - 1.0).abs() < 0.001, "GES weights sum to {}, expected 1.0", sum);
    }

    #[test]
    fn test_default_targets() {
        let t = BenchmarkTargets::default();
        assert_eq!(t.daily_profit_eth, 22.5);
        assert_eq!(t.solver_latency_p99_ms, 12.0);
        assert_eq!(t.success_rate_pct, 98.8);
        assert_eq!(t.gas_efficiency_pct, 96.5);
    }

    #[test]
    fn test_parse_target() {
        assert_eq!(parse_target_value("22.5 ETH"), 22.5);
        assert_eq!(parse_target_value("< 12ms"), 12.0);
        assert_eq!(parse_target_value("> 98.8%"), 98.8);
        assert_eq!(parse_target_value("10,000 ev/s"), 10000.0);
    }
}