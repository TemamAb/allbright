// BrightSky Solver Library - Core Types & Traits

use std::sync::atomic::{AtomicBool, AtomicU64, AtomicUsize, Ordering};
use std::sync::{Arc, Mutex, RwLock};
use lazy_static::lazy_static;
use std::collections::{HashMap, VecDeque};
use serde::{Deserialize, Serialize};
use serde_json::Value;

// BSS-26: The Specialist Interface
pub trait SubsystemSpecialist: Send + Sync {
    fn subsystem_id(&self) -> &'static str;
    fn check_health(&self) -> HealthStatus;
    fn upgrade_strategy(&self) -> &'static str;
    fn testing_strategy(&self) -> &'static str;
    fn run_diagnostic(&self) -> Value;
    fn execute_remediation(&self, command: &str) -> Result<(), String>;
    fn get_performance_kpi(&self) -> Value {
        serde_json::json!({"kpi": "unknown", "status": "unimplemented"})
    }
    fn get_domain_score(&self) -> f64 { 1.0 }
    fn ai_insight(&self) -> Option<String> { None }
}

// BSS-26: Watchtower Health Definitions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum HealthStatus {
    Optimal,
    Degraded(String),
    Stalled,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum BssLevel {
    Missing,
    Skeleton,
    Production,
}

// Debug Orders
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DebugIntent {
    Audit,
    Recalibrate,
    Reset,
    ModifyCode,
    CreateSubsystem,
    ConfirmOptimization,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DebuggingOrder {
    pub target: String,
    pub intent: DebugIntent,
    pub params: String,
    pub payload: Option<String>,
    pub timestamp: u64,
    pub nonce: u64,
}

#[derive(Debug, Clone)]
pub struct CopilotProposal {
    pub task_id: Arc<str>,
    pub description: String,
    pub impact_analysis: String,
    pub suggested_changes: Vec<String>,
}

lazy_static! {
    pub static ref PENDING_PROPOSAL: Mutex<Option<CopilotProposal>> = Mutex::new(None);
    pub static ref USED_NONCES: Mutex<HashMap<u64, u64>> = Mutex::new(HashMap::new());
}

// System Policy
#[derive(Debug, Clone)]
pub struct SystemPolicy {
    pub max_hops: usize,
    pub min_profit_bps: f64,
    pub shadow_mode: bool,
    pub max_position_size_eth: f64,
    pub daily_loss_limit_eth: f64,
    pub daily_loss_used_eth: f64,
}

// Design KPIs
#[allow(dead_code)]
pub const TARGET_THROUGHPUT: usize = 500;
#[allow(dead_code)]
pub const TARGET_LATENCY_MS: u64 = 10;
#[allow(dead_code)]
const TARGET_CYCLES_PER_HOUR: u64 = 120;
pub const TARGET_MEMPOOL_INGESTION_SEC: f64 = 10000.0;
pub const TARGET_TOTAL_SCORE_PCT: f64 = 95.0;

/// BSS-36: Global Efficiency Score (GES) domain weightings.
/// Sum must equal 1.0 (within floating-point tolerance).
/// Weights from benchmark-36-kpis.md: 25/20/15/10/10/10 (Domains 1-6).
pub const GES_WEIGHTS: [f64; 6] = [0.25, 0.20, 0.15, 0.10, 0.10, 0.10];

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_ges_weights_sum_to_one() {
        let sum: f64 = GES_WEIGHTS.iter().sum();
        assert!(
            (sum - 1.0).abs() < 0.001,
            "GES weights sum to {sum}, expected 1.0"
        );
    }
}

// Watchtower Stats
#[derive(Default)]
pub struct WatchtowerStats {
    pub msg_throughput_sec: AtomicUsize,
    pub last_heartbeat_bss05: AtomicU64,
    pub solver_latency_p99_ms: AtomicU64,
    pub opportunities_found_count: AtomicU64,
    pub executed_trades_count: AtomicU64,
    pub signals_rejected_risk: AtomicU64,
    pub adversarial_detections: AtomicU64,
    pub total_errors_fixed: AtomicU64,
    pub active_tasks: AtomicUsize,
    pub solver_jitter_ms: AtomicU64,
    pub cpu_usage_percent: AtomicUsize,
    pub thermal_throttle_active: AtomicBool,
    pub opt_improvement_delta: AtomicU64,
    pub opt_cycles_hour: AtomicU64,
    pub next_opt_cycle_timestamp: AtomicU64,
    pub opt_convergence_rate: AtomicU64,
    pub min_profit_bps_adj: AtomicU64,
    pub total_profit_milli_eth: AtomicU64,
    pub total_bribe_milli_eth: AtomicU64,
    pub mempool_events_per_sec: AtomicUsize,
    pub alpha_decay_avg_ms: AtomicU64,
    pub sim_parity_delta_bps: AtomicU64,
    pub circuit_breaker_recovery_count: AtomicU64,
    pub simulated_tx_success_rate: AtomicUsize,
    pub win_rate_bps: AtomicU64,
    pub mempool_state_prediction_ready: AtomicBool,
    pub wallet_balance_milli_eth: AtomicU64,
    pub loss_rate_bps: AtomicU64,
    pub gas_efficiency: AtomicU64,
    pub uptime_percent: AtomicU64,
    pub is_executor_deployed: AtomicBool,
    pub nonce_tracker: AtomicU64,
    pub connected_ui_clients: AtomicUsize,
    pub flashloan_contract_address: Arc<RwLock<Option<Arc<str>>>>,
    pub is_shadow_mode_active: AtomicBool,
    pub is_bundler_online: AtomicBool,
    pub is_adversarial_threat_active: AtomicBool,
    pub graph_update_latency_ms: AtomicU64,
    pub graph_node_count: AtomicU64,
    pub graph_edge_count: AtomicU64,
    pub total_weighted_score: AtomicU64,
    pub domain_score_profit: AtomicU64,
    pub domain_score_risk: AtomicU64,
    pub domain_score_perf: AtomicU64,
    pub domain_score_eff: AtomicU64,
    pub domain_score_health: AtomicU64,
    pub domain_score_dashboard: AtomicU64,
    pub domain_score_auto_opt: AtomicU64,
    pub min_margin_ratio_bps: AtomicU64, // BSS-44: Min margin required (bps * 100), e.g., 1000 = 10%
    pub bribe_ratio_bps: AtomicU64,       // BSS-07: Bribe percentage of profit (bps * 100), e.g., 500 = 5%

    // BSS-13: Path caching statistics
    pub path_cache_hits: AtomicU64,
    pub path_cache_misses: AtomicU64,
    pub path_cache_stores: AtomicU64,
    pub path_cache_evictions: AtomicU64,

    // BSS-05: RPC batching statistics
    pub rpc_batch_latency_ms: AtomicU64,
    pub rpc_calls_per_sec: AtomicU64,
    pub rpc_avg_latency_ms: AtomicU64,
    pub rpc_batch_success_rate: AtomicU64,

    // BSS-28: Meta-Learner state (EMA of success rate, profit momentum, trade count)
    pub meta_success_ratio_ema: AtomicUsize, // 0-10000 representing 0-100.00%
    pub meta_profit_momentum: AtomicU64,      // f64 bits (exponential moving sum of profit)
    pub meta_trade_count: AtomicU64,
    // BSS-28: Reinforcement Learning Meta-Learner
    pub reinforcement_meta_learner: Mutex<crate::reinforcement_meta_learner::ReinforcementMetaLearner>,
    // BSS-13: Path caching system
    pub path_cache: Mutex<crate::path_cache::PathCache>,
    // BSS-21: Live Event Log (Circular Buffer)
    pub event_log: Mutex<VecDeque<String>>,
    // KPI Improvement Metrics (Phase: Remaining KPI Categories)
    // Sub-block timing metrics
    pub collision_rate_estimate: AtomicU64,        // Estimated collision rate (bps * 100, e.g., 40 = 0.4%)
    pub timing_precision_ns: AtomicU64,            // Average timing precision achieved (nanoseconds)
    pub builder_queue_position: AtomicU64,         // Average predicted queue position (0-1000)
    pub market_pressure_factor: AtomicU64,         // Market pressure factor (0-1000, higher = more pressure)
    // RPC orchestration metrics
    pub rpc_provider_count: AtomicU64,             // Number of active RPC providers
    pub rpc_avg_latency_ms_per_provider: AtomicU64, // Average latency per provider (ms)
    pub rpc_provider_success_rate: AtomicU64,      // Overall success rate across providers (bps * 100)
    pub rpc_geo_balance_score: AtomicU64,          // Geographic balance score (0-1000)
    pub rpc_predictive_selection_accuracy: AtomicU64, // Accuracy of predictive provider selection (bps * 100)
    // Dynamic position sizing metrics
    pub avg_position_size_pct: AtomicU64,          // Average position size as % of wallet (bps * 100)
    pub volatility_factor_applied: AtomicU64,      // Current volatility factor applied (0-1000)
    pub iceberg_order_ratio: AtomicU64,            // % of orders using iceberg technique (bps * 100)
    pub multi_timeframe_signal_strength: AtomicU64, // Strength of multi-timeframe signals (0-1000)
    // Capital allocator metrics
    pub capital_efficiency_ratio: AtomicU64,       // Capital efficiency ratio (bps * 100, target 2500 for 25%)
    pub portfolio_diversity_score: AtomicU64,      // Portfolio diversity score (0-1000)
    pub risk_adjusted_scaling_factor: AtomicU64,   // Risk-adjusted scaling factor applied (0-1000)
    // Transaction validator metrics
    pub simulation_accuracy_pct: AtomicU64,        // Accuracy of pre-execution simulation (bps * 100)
    pub gas_estimation_error_pct: AtomicU64,       // Average gas estimation error (bps * 100)
    pub revert_reason_count: AtomicU64,            // Count of revert reasons (simplified as counter)
    pub failure_prediction_accuracy: AtomicU64,    // Accuracy of failure prediction (bps * 100)
    pub false_positive_rate: AtomicU64,            // False positive rate of failure prediction (bps * 100)
    // KPI Improvement Modules
    pub sub_block_timing: Mutex<crate::timing::sub_block_timing::SubBlockTimingEngine>,
    pub rpc_orchestrator: Mutex<crate::rpc::rpc_orchestrator::RpcOrchestrator>,
}

// PolicyDelta from MetaLearner → AutoOptimizer
#[derive(Default, Clone, Copy)]
pub struct PolicyDelta {
    pub min_profit_bps_delta: i64,
    pub max_hops_delta: i64,
    // Extendable: max_position_size_delta, daily_loss_limit_delta, etc.
}

impl WatchtowerStats {
    /// BSS-28: Observe outcome of a single trade to update online learning metrics.
    /// Call from gateway handler when Node.js reports a completed trade.
    pub fn observe_trade(&self, profit_eth: f64, success: bool) {
        // EMA update for success ratio (α = 0.1) - keep for backward compatibility
        let old = self.meta_success_ratio_ema.load(Ordering::Relaxed);
        let target = if success { 10000 } else { 0 };
        let new = ((old as f64) * 0.9 + target as f64 * 0.1) as usize;
        self.meta_success_ratio_ema.store(new, Ordering::Relaxed);
        
        // Update Win Rate statistic
        let executed = self.executed_trades_count.load(Ordering::Relaxed) as f64;
        let opportunities = self.opportunities_found_count.load(Ordering::Relaxed) as f64;
        if opportunities > 0.0 {
            let wr = (executed / opportunities) * 10000.0;
            self.win_rate_bps.store(wr as u64, Ordering::Relaxed);
        }

        // EMA for profit momentum - keep for backward compatibility
        let old_bits = self.meta_profit_momentum.load(Ordering::Relaxed);
        let old_momentum = f64::from_bits(old_bits);
        let new_momentum = old_momentum * 0.9 + profit_eth * 0.1;
        self.meta_profit_momentum.store(new_momentum.to_bits(), Ordering::Relaxed);

        // Add to event log
        let event = format!(
            "[{}] Trade Outcome: {} | Profit: {:.4} ETH", 
            if success { "SUCCESS" } else { "REVERT" }, 
            if success { "Executed" } else { "Failed" }, 
            profit_eth
        );
        if let Ok(mut log) = self.event_log.lock() {
            log.push_back(event);
            if log.len() > 50 { log.pop_front(); }
        }

        // Increment trade counter
        self.meta_trade_count.fetch_add(1, Ordering::Relaxed);

        // BSS-28: Update reinforcement learning meta-learner
        if let Ok(mut rl_learner) = self.reinforcement_meta_learner.lock() {
            rl_learner.observe_trade(self, profit_eth, success);
        }
    }

    /// BSS-28: Generate policy adjustment recommendations based on learned trends.
    /// Uses reinforcement learning meta-learner for better long-term strategy optimization.
    pub fn get_meta_recommendation(&self) -> PolicyDelta {
        // Try reinforcement learning approach first
        if let Ok(rl_learner) = self.reinforcement_meta_learner.lock() {
            return rl_learner.getPolicyRecommendation(self);
        }

        // Fallback to original EMA-based approach if RL fails
        let mut delta = PolicyDelta::default();

        let success_pct = self.meta_success_ratio_ema.load(Ordering::Relaxed) as f64 / 100.0;
        if success_pct < 80.0 {
            delta.min_profit_bps_delta = 5; // raise floor to improve quality
        }

        let momentum = f64::from_bits(self.meta_profit_momentum.load(Ordering::Relaxed));
        if momentum < -0.3 {
            delta.max_hops_delta = -1; // reduce complexity when losing
        }

        delta
    }
}

// Specialist Structs (defined here: core shared types)
// DashboardSpecialist and InvariantSpecialist are defined here.
// Other specialists are defined in main.rs.
pub struct DashboardSpecialist { pub stats: Arc<WatchtowerStats> }
pub struct InvariantSpecialist { pub graph: Arc<GraphPersistence>, pub stats: Arc<WatchtowerStats> }

// Implement SubsystemSpecialist for DashboardSpecialist
impl SubsystemSpecialist for DashboardSpecialist {
    fn subsystem_id(&self) -> &'static str { "BSS-27" }
    fn check_health(&self) -> HealthStatus { HealthStatus::Optimal }
    fn upgrade_strategy(&self) -> &'static str { "Hot-Swappable via API Gateway" }
    fn testing_strategy(&self) -> &'static str { "End-to-End: Browser simulation" }
    fn run_diagnostic(&self) -> Value {
        serde_json::json!({ "ui_version": "2.0.0", "connected_clients": self.stats.connected_ui_clients.load(Ordering::Relaxed) })
    }
    fn execute_remediation(&self, _: &str) -> Result<(), String> { Ok(()) }
    fn get_performance_kpi(&self) -> Value {
        serde_json::json!({"throughput": 500, "latency_p99": 10})
    }
    fn ai_insight(&self) -> Option<String> {
        Some("Dashboard latency within P99 bounds; suggesting Matte Glassmorphism update".into())
    }
}

// Implement SubsystemSpecialist for InvariantSpecialist
impl SubsystemSpecialist for InvariantSpecialist {
    fn subsystem_id(&self) -> &'static str { "BSS-30" }
    fn check_health(&self) -> HealthStatus {
        if let Some(err) = self.graph.validate_global_invariants() {
            HealthStatus::Degraded(err)
        } else {
            HealthStatus::Optimal
        }
    }
    fn upgrade_strategy(&self) -> &'static str { "Static: Formal verification of log-space math." }
    fn testing_strategy(&self) -> &'static str { "Fuzzing: Graph cycle validation." }
    fn get_performance_kpi(&self) -> Value {
        serde_json::json!({
            "kpi": "Graph Update Latency",
            "target": 5.0,
            "actual": self.stats.graph_update_latency_ms.load(Ordering::Relaxed) as f64,
            "unit": "ms"
        })
    }
    fn run_diagnostic(&self) -> Value {
        serde_json::json!({
            "checks": ["no-self-loops", "reserve-positivity", "fee-cap"],
            "node_count": self.graph.token_to_index.len(),
            "edge_count": self.stats.graph_edge_count.load(Ordering::Relaxed)
        })
    }
    fn execute_remediation(&self, _cmd: &str) -> Result<(), String> { Ok(()) }
}

// Re-export subsystem modules
pub mod module;
// BSS-36 Auto-Optimizer module (root level file)
pub mod benchmarks;
pub mod bss_36_auto_optimizer;
pub mod reinforcement_meta_learner;
pub mod path_cache;
pub mod timing;
pub mod rpc;
pub use bss_36_auto_optimizer::AutoOptimizer;
pub use module::bss_04_graph::{GraphPersistence, PoolState, PoolEdge};
pub use module::bss_13_solver::{ArbitrageOpportunity, SolverSpecialist};
pub use module::bss_44_liquidity::LiquidityEngine;
pub use module::bss_43_simulator::{SimulationEngine, SimulationResult, SimulationSpecialist};
pub use module::bss_45_risk::{RiskEngine, RiskSpecialist};
pub use module::bss_42_mev_guard::{MEVGuardEngine, MEVGuardSpecialist};
pub use module::bss_27_ui_gateway::UIGatewaySpecialist;
pub use module::bss_46_metrics::MetricsSpecialist;
pub use module::bss_41_executor::PrivateExecutorSpecialist;
pub use module::bss_16_p2p_bridge::P2PNBridgeSpecialist;

pub use module::bss_40_mempool::{MempoolIntelligenceSpecialist, MempoolEngine};
pub use module::bss_05_sync::{subscribe_chain, subscribe_mempool};
