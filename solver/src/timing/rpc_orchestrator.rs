use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::RwLock;
use serde::{Serialize, Deserialize};
use ethers::providers::{Provider, Http, Middleware};
use async_trait::async_trait;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RpcConfig {
    pub id: String,
    pub url: String,
    pub weight: u8, 
    pub max_latency_ms: u64,
    pub region: String, // e.g., "us-east-1", "eu-central-1"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RpcHealth {
    pub id: String,
    pub is_healthy: bool,
    pub current_latency_ms: u64,
    pub error_rate: f32,
    pub last_block_number: u64,
    pub consecutive_failures: u32,
    pub region: String,
}

/// Internal metrics tracking for the orchestrator
struct RpcMetrics {
    config: RpcConfig,
    health: RpcHealth,
    provider: Arc<Provider<Http>>,
}

pub struct RpcOrchestrator {
    rpc_pool: RwLock<HashMap<String, RpcMetrics>>,
    local_region: String,
}

impl RpcOrchestrator {
    pub fn new(configs: Vec<RpcConfig>, local_region: String) -> Self {
        let mut pool = HashMap::new();
        for cfg in configs {
            let provider = Provider::<Http>::try_from(&cfg.url)
                .expect("Invalid RPC URL provided in configuration");
            
            pool.insert(cfg.id.clone(), RpcMetrics {
                config: cfg.clone(),
                health: RpcHealth {
                    id: cfg.id.clone(),
                    is_healthy: true,
                    current_latency_ms: 0,
                    error_rate: 0.0,
                    last_block_number: 0,
                    consecutive_failures: 0,
                    region: cfg.region.clone(),
                },
                provider: Arc::new(provider),
            });
        }

        Self {
            rpc_pool: RwLock::new(pool),
            local_region,
        }
    }

    /// Background task to probe all nodes for health and latency
    pub async fn run_health_monitor(self: Arc<Self>) {
        let mut interval = tokio::time::interval(Duration::from_secs(5));
        loop {
            interval.tick().await;
            let ids: Vec<String> = {
                let pool = self.rpc_pool.read().await;
                pool.keys().cloned().collect()
            };

            for id in ids {
                let (provider, max_latency) = {
                    let pool = self.rpc_pool.read().await;
                    let metrics = pool.get(&id).unwrap();
                    (metrics.provider.clone(), metrics.config.max_latency_ms)
                };

                let start = Instant::now();
                let block_result = provider.get_block_number().await;
                let latency = start.elapsed().as_millis() as u64;

                let mut pool = self.rpc_pool.write().await;
                if let Some(metrics) = pool.get_mut(&id) {
                    match block_result {
                        Ok(num) => {
                            metrics.health.current_latency_ms = latency;
                            metrics.health.last_block_number = num.as_u64();
                            metrics.health.consecutive_failures = 0;
                            metrics.health.is_healthy = latency <= max_latency;
                        }
                        Err(_) => {
                            metrics.health.consecutive_failures += 1;
                            metrics.health.is_healthy = false;
                        }
                    }
                }
            }
        }
    }

    /// Scoring algorithm to select the "best" node
    /// Logic: Higher weight + Lower latency + Healthy status + Geographic proximity
    pub async fn get_best_provider(&self) -> Option<Arc<Provider<Http>>> {
        let pool = self.rpc_pool.read().await;
        let mut best_id: Option<String> = None;
        let mut highest_score: f32 = -1.0;

        for (id, metrics) in pool.iter() {
            if !metrics.health.is_healthy {
                continue;
            }

            // Normalized Latency Score (Lower is better)
            let latency_factor = 1.0 - (metrics.health.current_latency_ms as f32 / metrics.config.max_latency_ms as f32).min(1.0);
            
            // Normalized Weight (Higher is better)
            let weight_factor = metrics.config.weight as f32 / 255.0;

            // Reliability Score
            let reliability_factor = 1.0 / (metrics.health.consecutive_failures as f32 + 1.0);

            // Geographic Proximity Bonus (BSS-12)
            let geo_bonus = if metrics.config.region == self.local_region { 0.3 } else { 0.0 };

            let total_score = (latency_factor * 0.4) + (weight_factor * 0.2) + (reliability_factor * 0.1) + geo_bonus;

            if total_score > highest_score {
                highest_score = total_score;
                best_id = Some(id.clone());
            }
        }

        best_id.and_then(|id| pool.get(&id).map(|m| m.provider.clone()))
    }

    /// Returns the top N healthy RPC providers based on their current score.
    pub async fn get_top_n_providers(&self, n: usize) -> Vec<Arc<Provider<Http>>> {
        let pool = self.rpc_pool.read().await;
        let mut scored_providers: Vec<(f32, Arc<Provider<Http>>)> = Vec::new();

        for (_, metrics) in pool.iter() {
            if metrics.health.is_healthy {
                let latency_factor = 1.0 - (metrics.health.current_latency_ms as f32 / metrics.config.max_latency_ms as f32).min(1.0);
                let weight_factor = metrics.config.weight as f32 / 255.0;
                let reliability_factor = 1.0 / (metrics.health.consecutive_failures as f32 + 1.0);
                let geo_bonus = if metrics.config.region == self.local_region { 0.3 } else { 0.0 };
                
                let total_score = (latency_factor * 0.4) + (weight_factor * 0.2) + (reliability_factor * 0.1) + geo_bonus;
                scored_providers.push((total_score, metrics.provider.clone()));
            }
        }

        scored_providers.sort_by(|a, b| b.0.partial_cmp(&a.0).unwrap_or(std::cmp::Ordering::Equal));

        scored_providers.into_iter()
            .take(n)
            .map(|(_, provider)| provider)
            .collect()
    }

    /// Returns a report for the Dashboard UI
    pub async fn generate_health_report(&self) -> HashMap<String, RpcHealth> {
        let pool = self.rpc_pool.read().await;
        pool.iter()
            .map(|(id, m)| (id.clone(), m.health.clone()))
            .collect()
    }
}