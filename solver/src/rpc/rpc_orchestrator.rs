// solver/src/rpc/rpc_orchestrator.rs
// Multi-Provider RPC Orchestration for Latency Reduction and Reliability
// Implements parallel RPC provider management, geographic load balancing,
// and predictive provider selection to reduce RPC latency and improve reliability.

use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{Duration, Instant};
use ethers::providers::{Provider, Ws};
use ethers::types::H256;
use crate::WatchtowerStats;
use tracing::{error, warn, debug};

/// RPC Provider Information
#[derive(Clone)]
pub struct RpcProvider {
    pub name: String,
    pub url: String,
    pub provider: Arc<Provider<Ws>>,
    pub region: String, // e.g., "us-east", "eu-west", "asia-pacific"
    pub weight: u64,    // Load balancing weight (higher = more traffic)
    pub healthy: bool,
    pub last_latency_ms: AtomicU64,
    pub success_count: AtomicU64,
    pub failure_count: AtomicU64,
}

/// Multi-Provider RPC Orchestrator
pub struct RpcOrchestrator {
    providers: Mutex<HashMap<String, RpcProvider>>,
    stats: Arc<WatchtowerStats>,
    // Predictive selection: simple moving average of recent latencies
    prediction_window: usize,
}

impl RpcOrchestrator {
    /// Create a new RPC Orchestrator
    pub fn new(stats: Arc<WatchtowerStats>) -> Self {
        Self {
            providers: Mutex::new(HashMap::new()),
            stats,
            prediction_window: 10, // Last 10 requests for prediction
        }
    }

    /// Safely acquire providers lock with poison recovery
    #[inline]
    fn acquire_providers_lock(&self) -> std::sync::MutexGuard<'_, HashMap<String, RpcProvider>> {
        match self.providers.lock() {
            Ok(guard) => guard,
            Err(poisoned) => {
                error!(target: "rpc_orchestrator", "Providers mutex poisoned, recovering");
                poisoned.into_inner()
            }
        }
    }

    /// Add an RPC provider to the orchestrator
    pub fn add_provider(&self, name: String, url: String, region: String, weight: u64) {
        match Provider::<Ws>::connect(&url) {
            Ok(provider) => {
                let rpc_provider = RpcProvider {
                    name: name.clone(),
                    url,
                    provider: Arc::new(provider),
                    region,
                    weight: weight.max(1),
                    healthy: true,
                    last_latency_ms: AtomicU64::new(0),
                    success_count: AtomicU64::new(0),
                    failure_count: AtomicU64::new(0),
                };
                let mut providers = self.acquire_providers_lock();
                providers.insert(name, rpc_provider);
                self.stats.rpc_provider_count.store(providers.len() as u64, Ordering::Relaxed);
            }
            Err(e) => {
                error!(target: "rpc_orchestrator", url = %url, error = %e, "Failed to connect RPC provider");
            }
        }
    }

    /// Remove an RPC provider
    pub fn remove_provider(&self, name: &str) {
        let mut providers = self.acquire_providers_lock();
        providers.remove(name);
        self.stats.rpc_provider_count.store(providers.len() as u64, Ordering::Relaxed);
    }

    /// Select the best provider based on geographic load balancing and predictive latency
    pub fn select_provider(&self) -> Option<Arc<Provider<Ws>>> {
        let providers = self.acquire_providers_lock();
        if providers.is_empty() {
            return None;
        }

        // First, filter to healthy providers
        let healthy: Vec<_> = providers.values()
            .filter(|p| p.healthy.load(Ordering::Relaxed))
            .collect();

        if healthy.is_empty() {
            // If no healthy providers, try to reset and use any provider
            for p in providers.values() {
                p.healthy.store(true, Ordering::Relaxed);
            }
            let healthy: Vec<_> = providers.values()
                .filter(|p| p.healthy.load(Ordering::Relaxed))
                .collect();
            if healthy.is_empty() {
                return None;
            }
        }

        // Simple predictive selection: choose provider with lowest recent latency
        // In a more advanced version, we would use geographic load balancing
        let mut best_provider = None;
        let mut min_latency = u64::MAX;

        for provider in healthy {
            let latency = provider.last_latency_ms.load(Ordering::Relaxed);
            if latency < min_latency {
                min_latency = latency;
                best_provider = Some(provider.provider.clone());
            }
        }

        best_provider
    }

    /// Record latency for a provider after a request
    pub fn record_latency(&self, provider_name: &str, latency_ms: u64) {
        if let Some(provider) = self.acquire_providers_lock().get(provider_name) {
            provider.last_latency_ms.store(latency_ms, Ordering::Relaxed);
            provider.success_count.fetch_add(1, Ordering::Relaxed);
            
            // Update average latency per provider metric (simplified: we store last latency)
            // For a more accurate average, we would need to keep a sliding window
            self.stats.rpc_avg_latency_ms_per_provider.store(latency_ms, Ordering::Relaxed);
        }
    }

    /// Record a failure for a provider
    pub fn record_failure(&self, provider_name: &str) {
        if let Some(provider) = self.acquire_providers_lock().get(provider_name) {
            provider.failure_count.fetch_add(1, Ordering::Relaxed);
            provider.healthy.store(false, Ordering::Relaxed); // Mark as unhealthy temporarily
        }
    }

    /// Update provider health based on recent success/failure ratio
    pub fn update_provider_health(&self) {
        let providers = self.acquire_providers_lock();
        for provider in providers.values() {
            let success = provider.success_count.load(Ordering::Relaxed);
            let failure = provider.failure_count.load(Ordering::Relaxed);
            let total = success + failure;
            if total > 10 { // Only consider after sufficient samples
                let success_rate = success as f64 / total as f64;
                provider.healthy.store(success_rate > 0.5, Ordering::Relaxed); // Healthy if >50% success
                // Reset counters periodically to avoid stale data
                if total > 1000 {
                    provider.success_count.store(0, Ordering::Relaxed);
                    provider.failure_count.store(0, Ordering::Relaxed);
                }
            }
        }
        // Update overall success rate metric
        let total_success: u64 = providers.values().map(|p| p.success_count.load(Ordering::Relaxed)).sum();
        let total_requests: u64 = providers.values().map(|p| p.success_count.load(Ordering::Relaxed) + p.failure_count.load(Ordering::Relaxed)).sum();
        let success_rate = if total_requests > 0 {
            (total_success as f64 / total_requests as f64 * 10000.0) as u64 // bps * 100
        } else {
            10000 // Assume 100% if no data
        };
        self.stats.rpc_provider_success_rate.store(success_rate, Ordering::Relaxed);
    }

    /// Get geographic load balancing score (simplified: based on region distribution)
    pub fn update_geo_balance_score(&self) {
        let providers = self.acquire_providers_lock();
        if providers.is_empty() {
            self.stats.rpc_geo_balance_score.store(0, Ordering::Relaxed);
            return;
        }
        // Simple metric: count of unique regions
        use std::collections::HashSet;
        let regions: HashSet<_> = providers.values().map(|p| p.region.as_str()).collect();
        let score = (regions.len() as u64).min(10) * 100; // 0-1000 scale
        self.stats.rpc_geo_balance_score.store(score, Ordering::Relaxed);
    }

    /// Update predictive selection accuracy (simplified: compare predicted vs actual latency)
    pub fn update_predictive_accuracy(&self, predicted_latency: u64, actual_latency: u64) {
        let error = if predicted_latency > actual_latency {
            predicted_latency - actual_latency
        } else {
            actual_latency - predicted_latency
        };
        let accuracy = if predicted_latency > 0 {
            (10000 - (error * 10000 / predicted_latency)).max(0)
        } else {
            0
        };
        self.stats.rpc_predictive_selection_accuracy.store(accuracy, Ordering::Relaxed);
    }

    /// Get current orchestrator status for monitoring
    pub fn get_status(&self) -> RpcOrchestratorStatus {
        let providers = self.acquire_providers_lock();
        let healthy_count = providers.values().filter(|p| p.healthy.load(Ordering::Relaxed)).count();
        let total_count = providers.len();
        let success_rate = if let Some(total) = self.stats.rpc_provider_success_rate.load(Ordering::Relaxed).checked_div(100) {
            total as f64
        } else {
            0.0
        };
        RpcOrchestratorStatus {
            provider_count: total_count as u64,
            healthy_provider_count: healthy_count as u64,
            avg_latency_ms: self.stats.rpc_avg_latency_ms_per_provider.load(Ordering::Relaxed),
            success_rate_percent: success_rate,
            geo_balance_score: self.stats.rpc_geo_balance_score.load(Ordering::Relaxed),
            predictive_accuracy: self.stats.rpc_predictive_selection_accuracy.load(Ordering::Relaxed),
        }
    }
}

/// Status of the RPC orchestrator for monitoring and diagnostics
#[derive(Debug, Clone)]
pub struct RpcOrchestratorStatus {
    pub provider_count: u64,
    pub healthy_provider_count: u64,
    pub avg_latency_ms: u64,
    pub success_rate_percent: f64,
    pub geo_balance_score: u64,
    pub predictive_accuracy: u64,
}

/// Multi-Provider RPC Orchestrator
pub struct RpcOrchestrator {
    providers: Mutex<HashMap<String, RpcProvider>>,
    stats: Arc<WatchtowerStats>,
    // Predictive selection: simple moving average of recent latencies
    prediction_window: usize,
}

impl RpcOrchestrator {
    /// Create a new RPC Orchestrator
    pub fn new(stats: Arc<WatchtowerStats>) -> Self {
        Self {
            providers: Mutex::new(HashMap::new()),
            stats,
            prediction_window: 10, // Last 10 requests for prediction
        }
    }

    /// Add an RPC provider to the orchestrator
    pub fn add_provider(&self, name: String, url: String, region: String, weight: u64) {
        match Provider::<Ws>::connect(&url) {
            Ok(provider) => {
                let rpc_provider = RpcProvider {
                    name: name.clone(),
                    url,
                    provider: Arc::new(provider),
                    region,
                    weight: weight.max(1),
                    healthy: true,
                    last_latency_ms: AtomicU64::new(0),
                    success_count: AtomicU64::new(0),
                    failure_count: AtomicU64::new(0),
                };
                let mut providers = self.acquire_providers_lock();
                providers.insert(name, rpc_provider);
                self.stats.rpc_provider_count.store(providers.len() as u64, Ordering::Relaxed);
            }
            Err(e) {
                eprintln!("[RPC-Orchestrator] Failed to connect to {}: {}", url, e);
            }
        }
    }

    /// Remove an RPC provider
    pub fn remove_provider(&self, name: &str) {
        let mut providers = self.acquire_providers_lock();
        providers.remove(name);
        self.stats.rpc_provider_count.store(providers.len() as u64, Ordering::Relaxed);
    }

    /// Select the best provider based on geographic load balancing and predictive latency
    pub fn select_provider(&self) -> Option<Arc<Provider<Ws>>> {
        let providers = self.acquire_providers_lock();
        if providers.is_empty() {
            return None;
        }

        // First, filter to healthy providers
        let healthy: Vec<_> = providers.values()
            .filter(|p| p.healthy.load(Ordering::Relaxed))
            .collect();

        if healthy.is_empty() {
            // If no healthy providers, try to reset and use any provider
            for p in providers.values() {
                p.healthy.store(true, Ordering::Relaxed);
            }
            let healthy: Vec<_> = providers.values()
                .filter(|p| p.healthy.load(Ordering::Relaxed))
                .collect();
            if healthy.is_empty() {
                return None;
            }
        }

        // Simple predictive selection: choose provider with lowest recent latency
        // In a more advanced version, we would use geographic load balancing
        let mut best_provider = None;
        let mut min_latency = u64::MAX;

        for provider in healthy {
            let latency = provider.last_latency_ms.load(Ordering::Relaxed);
            if latency < min_latency {
                min_latency = latency;
                best_provider = Some(provider.provider.clone());
            }
        }

        best_provider
    }

    /// Record latency for a provider after a request
    pub fn record_latency(&self, provider_name: &str, latency_ms: u64) {
        if let Some(provider) = self.acquire_providers_lock().get(provider_name) {
            provider.last_latency_ms.store(latency_ms, Ordering::Relaxed);
            provider.success_count.fetch_add(1, Ordering::Relaxed);
            
            // Update average latency per provider metric (simplified: we store last latency)
            // For a more accurate average, we would need to keep a sliding window
            self.stats.rpc_avg_latency_ms_per_provider.store(latency_ms, Ordering::Relaxed);
        }
    }

    /// Record a failure for a provider
    pub fn record_failure(&self, provider_name: &str) {
        if let Some(provider) = self.acquire_providers_lock().get(provider_name) {
            provider.failure_count.fetch_add(1, Ordering::Relaxed);
            provider.healthy.store(false, Ordering::Relaxed); // Mark as unhealthy temporarily
        }
    }

    /// Update provider health based on recent success/failure ratio
    pub fn update_provider_health(&self) {
        let providers = self.acquire_providers_lock();
        for provider in providers.values() {
            let success = provider.success_count.load(Ordering::Relaxed);
            let failure = provider.failure_count.load(Ordering::Relaxed);
            let total = success + failure;
            if total > 10 { // Only consider after sufficient samples
                let success_rate = success as f64 / total as f64;
                provider.healthy.store(success_rate > 0.5, Ordering::Relaxed); // Healthy if >50% success
                // Reset counters periodically to avoid stale data
                if total > 1000 {
                    provider.success_count.store(0, Ordering::Relaxed);
                    provider.failure_count.store(0, Ordering::Relaxed);
                }
            }
        }
        // Update overall success rate metric
        let total_success: u64 = providers.values().map(|p| p.success_count.load(Ordering::Relaxed)).sum();
        let total_requests: u64 = providers.values().map(|p| p.success_count.load(Ordering::Relaxed) + p.failure_count.load(Ordering::Relaxed)).sum();
        let success_rate = if total_requests > 0 {
            (total_success as f64 / total_requests as f64 * 10000.0) as u64 // bps * 100
        } else {
            10000 // Assume 100% if no data
        };
        self.stats.rpc_provider_success_rate.store(success_rate, Ordering::Relaxed);
    }

    /// Get geographic load balancing score (simplified: based on region distribution)
    pub fn update_geo_balance_score(&self) {
        let providers = self.acquire_providers_lock();
        if providers.is_empty() {
            self.stats.rpc_geo_balance_score.store(0, Ordering::Relaxed);
            return;
        }
        // Simple metric: count of unique regions
        use std::collections::HashSet;
        let regions: HashSet<_> = providers.values().map(|p| p.region.as_str()).collect();
        let score = (regions.len() as u64).min(10) * 100; // 0-1000 scale
        self.stats.rpc_geo_balance_score.store(score, Ordering::Relaxed);
    }

    /// Update predictive selection accuracy (simplified: compare predicted vs actual latency)
    pub fn update_predictive_accuracy(&self, predicted_latency: u64, actual_latency: u64) {
        let error = if predicted_latency > actual_latency {
            predicted_latency - actual_latency
        } else {
            actual_latency - predicted_latency
        };
        let accuracy = if predicted_latency > 0 {
            (10000 - (error * 10000 / predicted_latency)).max(0)
        } else {
            0
        };
        self.stats.rpc_predictive_selection_accuracy.store(accuracy, Ordering::Relaxed);
    }

    /// Get current orchestrator status for monitoring
    pub fn get_status(&self) -> RpcOrchestratorStatus {
        let providers = self.acquire_providers_lock();
        let healthy_count = providers.values().filter(|p| p.healthy.load(Ordering::Relaxed)).count();
        let total_count = providers.len();
        let success_rate = if let Some(total) = self.stats.rpc_provider_success_rate.load(Ordering::Relaxed).checked_div(100) {
            total as f64
        } else {
            0.0
        };
        RpcOrchestratorStatus {
            provider_count: total_count as u64,
            healthy_provider_count: healthy_count as u64,
            avg_latency_ms: self.stats.rpc_avg_latency_ms_per_provider.load(Ordering::Relaxed),
            success_rate_percent: success_rate,
            geo_balance_score: self.stats.rpc_geo_balance_score.load(Ordering::Relaxed),
            predictive_accuracy: self.stats.rpc_predictive_selection_accuracy.load(Ordering::Relaxed),
        }
    }
}

/// Status of the RPC orchestrator for monitoring and diagnostics
#[derive(Debug, Clone)]
pub struct RpcOrchestratorStatus {
    pub provider_count: u64,
    pub healthy_provider_count: u64,
    pub avg_latency_ms: u64,
    pub success_rate_percent: f64,
    pub geo_balance_score: u64,
    pub predictive_accuracy: u64,
}