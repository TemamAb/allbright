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
}

