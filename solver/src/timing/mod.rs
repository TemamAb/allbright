//! Timing and latency measurement module
//! Critical for deployment readiness

pub mod sub_block_timing;
pub mod rpc_orchestrator;

pub use sub_block_timing::SubBlockTiming;
pub use rpc_orchestrator::RpcOrchestrator;

/// Timing configuration
pub struct TimingConfig {
    pub alpha_decay_avg_ms: f64,
    pub target_block_time_ms: f64,
}

impl Default for TimingConfig {
    fn default() -> Self {
        Self {
            alpha_decay_avg_ms: 45.0,
            target_block_time_ms: 12000.0,
        }
    }
}

