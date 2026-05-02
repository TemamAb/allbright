//! Sub-block timing analysis for bribe optimization
//! Measures timing within Ethereum blocks for MEV opportunities

use std::collections::HashMap;

pub struct SubBlockTiming {
    pub latencies: HashMap<u64, f64>,
    pub avg_subblock_time: f64,
}

impl SubBlockTiming {
    pub fn new() -> Self {
        Self {
            latencies: HashMap::new(),
            avg_subblock_time: 0.0,
        }
    }

    pub fn record_latency(&mut self, slot: u64, latency_ms: f64) {
        self.latencies.insert(slot, latency_ms);
        self.avg_subblock_time = self.latencies.values().sum::<f64>() / self.latencies.len() as f64;
    }

    /// BSS-13: Predicts if a bribe increase is necessary based on competitive pressure
    pub fn estimate_bribe_multiplier(&self, current_slot: u64) -> f64 {
        let last_latency = self.latencies.get(&current_slot).unwrap_or(&self.avg_subblock_time);
        
        // If latency > 65ms (Target P0), increase bribe aggressively to jump the builder queue
        if *last_latency > 65.0 {
            1.25 // 25% Bribe boost
        } else if *last_latency > 45.0 {
            1.10 // 10% Bribe boost
        } else {
            1.00 // Nominal
        }
    }
}
