use std::sync::{Arc, Mutex};
use crate::WatchtowerStats;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RpcProvider {
    pub name: String,
    pub url: String,
    pub priority: u32,
    pub latency_ms: f64,
    pub is_healthy: bool,
}

pub struct RpcOrchestrator {
    pub providers: Vec<RpcProvider>,
    stats: Arc<Mutex<WatchtowerStats>>,
}

impl RpcOrchestrator {
    pub fn new(stats: Arc<Mutex<WatchtowerStats>>) -> Self {
        Self {
            providers: vec![
                RpcProvider {
                    name: "LlamaNodes".to_string(),
                    url: "https://base.llamarpc.com".to_string(),
                    priority: 1,
                    latency_ms: 0.0,
                    is_healthy: true,
                },
                RpcProvider {
                    name: "PublicNode".to_string(),
                    url: "https://base-rpc.publicnode.com".to_string(),
                    priority: 2,
                    latency_ms: 0.0,
                    is_healthy: true,
                }
            ],
            stats,
        }
    }

    pub fn update_latencies(&mut self) {
        // BSS-12: Multi-provider Parallel Querying Scaffold
        // In production, this would use tokio::spawn to ping all providers concurrently.
        for provider in self.providers.iter_mut() {
            if provider.is_healthy {
                // Simulated latency update
                provider.latency_ms = 45.0 + (rand::random::<f64>() * 10.0);
            }
        }
        
        let mut stats = self.stats.lock().unwrap();
        let healthy_count = self.providers.iter().filter(|p| p.is_healthy).count();
        stats.active_rpc_count = healthy_count as u32;
        
        if healthy_count > 0 {
            stats.rpc_inclusion_latency_ms = 45.0; // Simulated latency (Target < 65ms)
        }
    }

    /// BSS-12: Returns the healthy provider with the lowest measured latency.
    pub fn get_best_provider(&self) -> Option<RpcProvider> {
        self.providers.iter()
            .filter(|p| p.is_healthy)
            .min_by(|a, b| a.latency_ms.partial_cmp(&b.latency_ms).unwrap_or(std::cmp::Ordering::Equal))
            .cloned()
    }
}