//! Timing and latency measurement module
//! Critical for deployment readiness

pub mod sub_block_timing;

pub use sub_block_timing::SubBlockTiming;

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

