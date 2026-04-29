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
            _padding: [0; 64 - 3], // Initialize padding
        }
    }

    /// Predicts the optimal nanosecond offset within a block to submit a bundle.
    /// Aims to hit the target inclusion latency (65ms) while avoiding collisions.
    /// Uses entropy to prevent timing attack predictability.
    pub fn predict_execution_window(&self, stats: &WatchtowerStats) -> u64 {
        let pressure = stats.market_pressure_factor.load(Ordering::Relaxed);
        let collision_rate = stats.collision_rate_estimate.load(Ordering::Relaxed);

        // Base offset (in nanoseconds) with entropy to prevent timing attacks
        // Target: 65ms = 65,000,000ns, but add random jitter
        let base_offset_ns = 55_000_000;
        let entropy_factor = (fastrand::u64(0..10000) as f64 - 5000.0) / 5000.0; // ±1.0 range
        let mut target_offset_ns = (base_offset_ns as f64 * (1.0 + entropy_factor * 0.1)) as u64;

        // Adjust for market pressure (0-1000) with additional entropy
        if pressure > 800 {
            // High pressure: attempt to front-run with randomized timing
            let pressure_entropy = fastrand::u64(0..2000000); // 0-2ms random
            target_offset_ns = target_offset_ns.saturating_sub(5_000_000 + pressure_entropy);
        }

        // Adjust for collision rate (bps * 100, e.g. 400 = 4.0%) with entropy
        if collision_rate > 300 {
            // High collision: shift window with randomization to avoid patterns
            let collision_entropy = fastrand::u64(0..8000000); // 0-8ms random
            target_offset_ns += 12_000_000 + collision_entropy;
        }

        // Add final entropy layer to prevent statistical analysis
        let final_entropy = fastrand::u64(0..5000000); // 0-5ms random
        target_offset_ns + final_entropy
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