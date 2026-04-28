use crate::WatchtowerStats;
use std::sync::atomic::Ordering;

/// BSS-47: Sub-Block Timing Engine
/// Provides nanosecond-precision execution windows to minimize competitive collisions.
/// This addresses the high competitive collision rate (currently 4.0%, target 0.8%).
pub struct SubBlockTimingEngine {
    pub nanosecond_precision: bool,
    pub queue_position_estimator: bool,
    pub market_pressure_detector: bool,
}

impl SubBlockTimingEngine {
    pub fn new() -> Self {
        Self {
            nanosecond_precision: true,
            queue_position_estimator: true,
            market_pressure_detector: true,
        }
    }

    /// Predicts the optimal nanosecond offset within a block to submit a bundle.
    /// Aims to hit the target inclusion latency (65ms) while avoiding collisions.
    pub fn predict_execution_window(&self, stats: &WatchtowerStats) -> u64 {
        let pressure = stats.market_pressure_factor.load(Ordering::Relaxed);
        let collision_rate = stats.collision_rate_estimate.load(Ordering::Relaxed);
        
        // Base offset (in nanoseconds) - start slightly after block start
        // Target: 65ms = 65,000,000ns
        let mut target_offset_ns = 55_000_000; 

        // Adjust for market pressure (0-1000)
        if pressure > 800 {
            // High pressure: attempt to front-run the peak congestion window
            target_offset_ns = target_offset_ns.saturating_sub(5_000_000); 
        }

        // Adjust for collision rate (bps * 100, e.g. 400 = 4.0%)
        if collision_rate > 300 { 
            // High collision: shift window to find a less crowded micro-slot
            target_offset_ns += 12_000_000;
        }

        target_offset_ns
    }

    /// Updates performance metrics after a block execution cycle to improve future predictions.
    pub fn record_block_outcome(&self, stats: &WatchtowerStats, actual_pos: u64) {
        stats.builder_queue_position.store(actual_pos, Ordering::Relaxed);
        
        // Update collision rate estimate using EMA (exponential moving average)
        let was_collision = if actual_pos > 1 { 1000 } else { 0 }; // 10% penalty for non-top inclusion
        let current_rate = stats.collision_rate_estimate.load(Ordering::Relaxed);
        let new_rate = ((current_rate * 95) + (was_collision * 5)) / 100;
        
        stats.collision_rate_estimate.store(new_rate, Ordering::Relaxed);
    }
}

impl Default for SubBlockTimingEngine {
    fn default() -> Self {
        Self::new()
    }
}