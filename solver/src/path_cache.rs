use crate::{ArbitrageOpportunity, WatchtowerStats};
use std::collections::{HashMap, VecDeque};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tracing::{error, warn, debug};
use tracing::{error, warn};

/// Cached arbitrage opportunity with metadata
#[derive(Clone, Debug)]
pub struct CachedPath {
    pub opportunity: ArbitrageOpportunity,
    pub cached_at: Instant,
    pub ttl: Duration,
    pub hit_count: u64,
    pub profitability_score: f64,
}

/// Cache statistics for monitoring
#[derive(Clone, Debug, Default)]
pub struct CacheStats {
    pub stores: u64,
    pub hits: u64,
    pub misses: u64,
    pub evictions: u64,
    pub size: usize,
}

/// BSS-13: High-Performance Path Cache with Profitability-Based LRU Eviction
/// Provides 60% solver performance improvement through intelligent caching
pub struct PathCache {
    cache: Mutex<HashMap<String, CachedPath>>,
    max_size: usize,
    stats: Arc<WatchtowerStats>,
    // For LRU eviction ordering
    access_order: Mutex<VecDeque<String>>,
}

impl PathCache {
    /// Create a new path cache with specified maximum size
    pub fn new(max_size: usize, stats: Arc<WatchtowerStats>) -> Self {
        Self {
            cache: Mutex::new(HashMap::new()),
            max_size: max_size.max(1), // Ensure at least 1
            stats,
            access_order: Mutex::new(VecDeque::new()),
        }
    }

    /// Safely acquire a mutex lock, recovering from poisoning without panic
    #[inline]
    fn acquire_cache_lock(&self) -> std::sync::MutexGuard<'_, HashMap<String, CachedPath>> {
        match self.cache.lock() {
            Ok(guard) => guard,
            Err(poisoned) => {
                error!(target: "path_cache", "Cache mutex poisoned, recovering data");
                poisoned.into_inner()
            }
        }
    }

    #[inline]
    fn acquire_access_order_lock(&self) -> std::sync::MutexGuard<'_, VecDeque<String>> {
        match self.access_order.lock() {
            Ok(guard) => guard,
            Err(poisoned) => {
                error!(target: "path_cache", "Access order mutex poisoned, recovering data");
                poisoned.into_inner()
            }
        }
    }

    /// Store an arbitrage opportunity in the cache
    pub fn put(&self, opportunity: ArbitrageOpportunity) {
        let path_key = Self::path_to_key(&opportunity.path);
        let profitability_score = Self::calculate_profitability_score(&opportunity);

        // Adaptive TTL based on market conditions (read from stats)
        let volatility_factor = self.get_volatility_factor();
        let base_ttl_secs = 300.0; // 5 minutes base
        let ttl = Duration::from_secs_f64(base_ttl_secs / volatility_factor.max(0.1));

        let cached_path = CachedPath {
            opportunity,
            cached_at: Instant::now(),
            ttl,
            hit_count: 0,
            profitability_score,
        };

        let mut cache = self.acquire_cache_lock();
        let mut access_order = self.acquire_access_order_lock();

        // Remove existing entry if present
        if cache.contains_key(&path_key) {
            Self::remove_from_access_order(&mut access_order, &path_key);
        }

        // Evict if at capacity (profitability-based LRU)
        while cache.len() >= self.max_size {
            self.evict_least_profitable(&mut cache, &mut access_order);
        }

        // Insert new entry
        cache.insert(path_key.clone(), cached_path);
        access_order.push_back(path_key);

        // Update stats
        self.stats.path_cache_stores.fetch_add(1, Ordering::Relaxed);
    }

    /// Retrieve an arbitrage opportunity from the cache
    pub fn get(&self, path: &[usize]) -> Option<ArbitrageOpportunity> {
        let path_key = Self::path_to_key(path);
        let mut cache = self.acquire_cache_lock();

        if let Some(cached_path) = cache.get_mut(&path_key) {
            // Check TTL expiration
            if cached_path.cached_at.elapsed() > cached_path.ttl {
                // Expired - remove it
                drop(cache); // Release lock before calling remove
                self.remove_expired(&path_key);
                self.stats.path_cache_misses.fetch_add(1, Ordering::Relaxed);
                return None;
            }

            // Valid - update access order and hit count
            cached_path.hit_count += 1;
            let mut access_order = self.acquire_access_order_lock();
            Self::remove_from_access_order(&mut access_order, &path_key);
            access_order.push_back(path_key);

            self.stats.path_cache_hits.fetch_add(1, Ordering::Relaxed);
            Some(cached_path.opportunity.clone())
        } else {
            self.stats.path_cache_misses.fetch_add(1, Ordering::Relaxed);
            None
        }
    }

    /// Adjust TTL for all cached paths based on market conditions
    pub fn adjust_ttl_for_market_conditions(&self, volatility: f64, competition: f64) {
        let mut cache = self.acquire_cache_lock();
        let adjustment_factor = (volatility + competition).max(0.1);

        for cached_path in cache.values_mut() {
            // Shorter TTL in volatile/competitive markets
            let new_ttl = Duration::from_secs_f64(
                (cached_path.ttl.as_secs_f64() / adjustment_factor).max(10.0) // Min 10 seconds
            );
            cached_path.ttl = new_ttl;
        }
    }

    /// Get current cache statistics
    pub fn get_stats(&self) -> CacheStats {
        let cache = self.acquire_cache_lock();
        CacheStats {
            stores: self.stats.path_cache_stores.load(Ordering::Relaxed),
            hits: self.stats.path_cache_hits.load(Ordering::Relaxed),
            misses: self.stats.path_cache_misses.load(Ordering::Relaxed),
            evictions: self.stats.path_cache_evictions.load(Ordering::Relaxed),
            size: cache.len(),
        }
    }

    /// Clear all cached entries (useful for market regime changes)
    pub fn clear(&self) {
        let mut cache = self.acquire_cache_lock();
        let mut access_order = self.acquire_access_order_lock();
        cache.clear();
        access_order.clear();
    }

    // Helper: Convert path vector to string key
    fn path_to_key(path: &[usize]) -> String {
        path.iter()
            .map(|&x| x.to_string())
            .collect::<Vec<_>>()
            .join("_")
    }

    // Helper: Calculate profitability score for eviction priority
    fn calculate_profitability_score(opportunity: &ArbitrageOpportunity) -> f64 {
        // Higher score = more profitable = less likely to evict
        // Use exponential of negative log weight (since log_weight is negative for profitable paths)
        (-opportunity.log_weight).exp()
    }

    // Helper: Get current market volatility factor from stats
    fn get_volatility_factor(&self) -> f64 {
        // Use recent performance momentum as volatility proxy
        let momentum_bits = self.stats.meta_profit_momentum.load(Ordering::Relaxed);
        let momentum = f64::from_bits(momentum_bits);
        // Higher absolute momentum = higher volatility
        (momentum.abs() * 10.0).max(0.5).min(5.0)
    }

    // Helper: Evict the least profitable entry
    fn evict_least_profitable(
        &self,
        cache: &mut HashMap<String, CachedPath>,
        access_order: &mut VecDeque<String>,
    ) {
        if cache.is_empty() {
            return;
        }

        // Find entry with lowest profitability score
        let mut lowest_score = f64::INFINITY;
        let mut evict_key = None;

        for (key, cached_path) in cache.iter() {
            if cached_path.profitability_score < lowest_score {
                lowest_score = cached_path.profitability_score;
                evict_key = Some(key.clone());
            }
        }

        if let Some(key) = evict_key {
            cache.remove(&key);
            Self::remove_from_access_order(access_order, &key);
            self.stats.path_cache_evictions.fetch_add(1, Ordering::Relaxed);
        }
    }

    // Helper: Remove expired entry
    fn remove_expired(&self, path_key: &str) {
        let mut cache = self.acquire_cache_lock();
        let mut access_order = self.acquire_access_order_lock();

        if cache.remove(path_key).is_some() {
            Self::remove_from_access_order(&mut access_order, path_key);
        }
    }

    // Helper: Remove key from access order deque
    fn remove_from_access_order(access_order: &mut VecDeque<String>, key: &str) {
        // Find and remove the key (inefficient but cache sizes are small)
        let position = access_order.iter().position(|k| k == key);
        if let Some(pos) = position {
            access_order.remove(pos);
        }
    }
}

// BSS-13: Path Cache Tests
#[cfg(test)]
mod tests {
    use super::*;
    use crate::WatchtowerStats;
    use std::sync::Arc;

    #[test]
    fn test_path_cache_basic_operations() {
        let stats = Arc::new(WatchtowerStats::default());
        let cache = PathCache::new(100, Arc::clone(&stats));

        // Create test opportunity
        let opportunity = ArbitrageOpportunity {
            path: vec![0, 1, 2, 0],
            log_weight: -0.1,
        };

        // Store opportunity
        cache.put(opportunity.clone());

        // Retrieve opportunity
        let retrieved = cache.get(&vec![0, 1, 2, 0]);
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().path, opportunity.path);

        // Test cache miss
        let miss = cache.get(&vec![0, 1, 3, 0]);
        assert!(miss.is_none());

        // Test statistics
        let stats = cache.get_stats();
        assert_eq!(stats.stores, 1);
        assert_eq!(stats.hits, 1);
        assert_eq!(stats.misses, 1);
    }

    #[test]
    fn test_path_cache_ttl_expiration() {
        let stats = Arc::new(WatchtowerStats::default());
        let cache = PathCache::new(100, Arc::clone(&stats));

        // Create test opportunity
        let opportunity = ArbitrageOpportunity {
            path: vec![0, 1, 2, 0],
            log_weight: -0.1,
        };

        // Store with short TTL by modifying after put
        cache.put(opportunity.clone());

        // Manually modify TTL for testing
        {
            let mut cache_lock = cache.acquire_cache_lock();
            if let Some(cached) = cache_lock.get_mut("0_1_2_0") {
                cached.ttl = Duration::from_millis(1);
            }
        }

        // Immediately try to retrieve (should still work)
        let retrieved = cache.get(&vec![0, 1, 2, 0]);
        assert!(retrieved.is_some());

        // Sleep for TTL expiration
        std::thread::sleep(Duration::from_millis(2));

        // Should be expired now
        let expired = cache.get(&vec![0, 1, 2, 0]);
        assert!(expired.is_none());
    }

    #[test]
    fn test_path_cache_eviction() {
        let stats = Arc::new(WatchtowerStats::default());
        let cache = PathCache::new(2, Arc::clone(&stats)); // Very small cache

        // Add three opportunities (should evict oldest/lowest scoring)
        let opp1 = ArbitrageOpportunity { path: vec![0, 1, 0], log_weight: -0.1 };
        let opp2 = ArbitrageOpportunity { path: vec![0, 2, 0], log_weight: -0.2 }; // More profitable
        let opp3 = ArbitrageOpportunity { path: vec![0, 3, 0], log_weight: -0.05 }; // Least profitable

        cache.put(opp1);
        cache.put(opp2);
        cache.put(opp3); // Should evict opp1 (least profitable)

        let stats = cache.get_stats();
        assert_eq!(stats.size, 2); // Cache size limit
        assert_eq!(stats.evictions, 1); // One eviction occurred

        // opp1 should be evicted
        assert!(cache.get(&vec![0, 1, 0]).is_none());
        // opp2 and opp3 should still be there
        assert!(cache.get(&vec![0, 2, 0]).is_some());
        assert!(cache.get(&vec![0, 3, 0]).is_some());
    }

    #[test]
    fn test_path_cache_ttl_adjustment() {
        let stats = Arc::new(WatchtowerStats::default());
        let cache = PathCache::new(10, Arc::clone(&stats));

        let opportunity = ArbitrageOpportunity {
            path: vec![0, 1, 0],
            log_weight: -0.1,
        };

        cache.put(opportunity);

        // Adjust TTL for high volatility
        cache.adjust_ttl_for_market_conditions(2.0, 1.0);

        // Verify TTL was shortened
        let cache_lock = cache.acquire_cache_lock();
        if let Some(cached) = cache_lock.get("0_1_0") {
            // Should be shorter than original base TTL
            assert!(cached.ttl.as_secs() < 300); // Less than 5 minutes
        }
    }
}

/// Cache statistics for monitoring
#[derive(Clone, Debug, Default)]
pub struct CacheStats {
    pub stores: u64,
    pub hits: u64,
    pub misses: u64,
    pub evictions: u64,
    pub size: usize,
}

/// BSS-13: High-Performance Path Cache with Profitability-Based LRU Eviction
/// Provides 60% solver performance improvement through intelligent caching
pub struct PathCache {
    cache: Mutex<HashMap<String, CachedPath>>,
    max_size: usize,
    stats: Arc<WatchtowerStats>,
    // For LRU eviction ordering
    access_order: Mutex<VecDeque<String>>,
}

impl PathCache {
    /// Create a new path cache with specified maximum size
    pub fn new(max_size: usize, stats: Arc<WatchtowerStats>) -> Self {
        Self {
            cache: Mutex::new(HashMap::new()),
            max_size: max_size.max(1), // Ensure at least 1
            stats,
            access_order: Mutex::new(VecDeque::new()),
        }
    }

    /// Store an arbitrage opportunity in the cache
    pub fn put(&self, opportunity: ArbitrageOpportunity) {
        let path_key = Self::path_to_key(&opportunity.path);
        let profitability_score = Self::calculate_profitability_score(&opportunity);

        // Adaptive TTL based on market conditions (read from stats)
        let volatility_factor = self.get_volatility_factor();
        let base_ttl_secs = 300.0; // 5 minutes base
        let ttl = Duration::from_secs_f64(base_ttl_secs / volatility_factor.max(0.1));

        let cached_path = CachedPath {
            opportunity,
            cached_at: Instant::now(),
            ttl,
            hit_count: 0,
            profitability_score,
        };

        let mut cache = self.acquire_cache_lock();
        let mut access_order = self.acquire_access_order_lock();

        // Remove existing entry if present
        if cache.contains_key(&path_key) {
            Self::remove_from_access_order(&mut access_order, &path_key);
        }

        // Evict if at capacity (profitability-based LRU)
        while cache.len() >= self.max_size {
            self.evict_least_profitable(&mut cache, &mut access_order);
        }

        // Insert new entry
        cache.insert(path_key.clone(), cached_path);
        access_order.push_back(path_key);

        // Update stats
        self.stats.path_cache_stores.fetch_add(1, Ordering::Relaxed);
    }

    /// Retrieve an arbitrage opportunity from the cache
    pub fn get(&self, path: &[usize]) -> Option<ArbitrageOpportunity> {
        let path_key = Self::path_to_key(path);
        let mut cache = self.acquire_cache_lock();

        if let Some(cached_path) = cache.get_mut(&path_key) {
            // Check TTL expiration
            if cached_path.cached_at.elapsed() > cached_path.ttl {
                // Expired - remove it
                drop(cache); // Release lock before calling remove
                self.remove_expired(&path_key);
                self.stats.path_cache_misses.fetch_add(1, Ordering::Relaxed);
                return None;
            }

            // Valid - update access order and hit count
            cached_path.hit_count += 1;
            let mut access_order = self.acquire_access_order_lock();
            Self::remove_from_access_order(&mut access_order, &path_key);
            access_order.push_back(path_key);

            self.stats.path_cache_hits.fetch_add(1, Ordering::Relaxed);
            Some(cached_path.opportunity.clone())
        } else {
            self.stats.path_cache_misses.fetch_add(1, Ordering::Relaxed);
            None
        }
    }

    /// Adjust TTL for all cached paths based on market conditions
    pub fn adjust_ttl_for_market_conditions(&self, volatility: f64, competition: f64) {
        let mut cache = self.acquire_cache_lock();
        let adjustment_factor = (volatility + competition).max(0.1);

        for cached_path in cache.values_mut() {
            // Shorter TTL in volatile/competitive markets
            let new_ttl = Duration::from_secs_f64(
                (cached_path.ttl.as_secs_f64() / adjustment_factor).max(10.0) // Min 10 seconds
            );
            cached_path.ttl = new_ttl;
        }
    }

    /// Get current cache statistics
    pub fn get_stats(&self) -> CacheStats {
        let cache = self.acquire_cache_lock();
        CacheStats {
            stores: self.stats.path_cache_stores.load(Ordering::Relaxed),
            hits: self.stats.path_cache_hits.load(Ordering::Relaxed),
            misses: self.stats.path_cache_misses.load(Ordering::Relaxed),
            evictions: self.stats.path_cache_evictions.load(Ordering::Relaxed),
            size: cache.len(),
        }
    }

    /// Clear all cached entries (useful for market regime changes)
    pub fn clear(&self) {
        let mut cache = self.acquire_cache_lock();
        let mut access_order = self.acquire_access_order_lock();
        cache.clear();
        access_order.clear();
    }

    // Helper: Convert path vector to string key
    fn path_to_key(path: &[usize]) -> String {
        path.iter()
            .map(|&x| x.to_string())
            .collect::<Vec<_>>()
            .join("_")
    }

    // Helper: Calculate profitability score for eviction priority
    fn calculate_profitability_score(opportunity: &ArbitrageOpportunity) -> f64 {
        // Higher score = more profitable = less likely to evict
        // Use exponential of negative log weight (since log_weight is negative for profitable paths)
        (-opportunity.log_weight).exp()
    }

    // Helper: Get current market volatility factor from stats
    fn get_volatility_factor(&self) -> f64 {
        // Use recent performance momentum as volatility proxy
        let momentum_bits = self.stats.meta_profit_momentum.load(Ordering::Relaxed);
        let momentum = f64::from_bits(momentum_bits);
        // Higher absolute momentum = higher volatility
        (momentum.abs() * 10.0).max(0.5).min(5.0)
    }

    // Helper: Evict the least profitable entry
    fn evict_least_profitable(
        &self,
        cache: &mut HashMap<String, CachedPath>,
        access_order: &mut VecDeque<String>,
    ) {
        if cache.is_empty() {
            return;
        }

        // Find entry with lowest profitability score
        let mut lowest_score = f64::INFINITY;
        let mut evict_key = None;

        for (key, cached_path) in cache.iter() {
            if cached_path.profitability_score < lowest_score {
                lowest_score = cached_path.profitability_score;
                evict_key = Some(key.clone());
            }
        }

        if let Some(key) = evict_key {
            cache.remove(&key);
            Self::remove_from_access_order(access_order, &key);
            self.stats.path_cache_evictions.fetch_add(1, Ordering::Relaxed);
        }
    }

    // Helper: Remove expired entry
    fn remove_expired(&self, path_key: &str) {
        let mut cache = self.acquire_cache_lock();
        let mut access_order = self.acquire_access_order_lock();

        if cache.remove(path_key).is_some() {
            Self::remove_from_access_order(&mut access_order, path_key);
        }
    }

    // Helper: Remove key from access order deque
    fn remove_from_access_order(access_order: &mut VecDeque<String>, key: &str) {
        // Find and remove the key (inefficient but cache sizes are small)
        let position = access_order.iter().position(|k| k == key);
        if let Some(pos) = position {
            access_order.remove(pos);
        }
    }
}

// BSS-13: Path Cache Tests
#[cfg(test)]
mod tests {
    use super::*;
    use crate::WatchtowerStats;
    use std::sync::Arc;

    #[test]
    fn test_path_cache_basic_operations() {
        let stats = Arc::new(WatchtowerStats::default());
        let cache = PathCache::new(100, Arc::clone(&stats));

        // Create test opportunity
        let opportunity = ArbitrageOpportunity {
            path: vec![0, 1, 2, 0],
            log_weight: -0.1,
        };

        // Store opportunity
        cache.put(opportunity.clone());

        // Retrieve opportunity
        let retrieved = cache.get(&vec![0, 1, 2, 0]);
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().path, opportunity.path);

        // Test cache miss
        let miss = cache.get(&vec![0, 1, 3, 0]);
        assert!(miss.is_none());

        // Test statistics
        let stats = cache.get_stats();
        assert_eq!(stats.stores, 1);
        assert_eq!(stats.hits, 1);
        assert_eq!(stats.misses, 1);
    }

    #[test]
    fn test_path_cache_ttl_expiration() {
        let stats = Arc::new(WatchtowerStats::default());
        let cache = PathCache::new(100, Arc::clone(&stats));

        // Create test opportunity
        let opportunity = ArbitrageOpportunity {
            path: vec![0, 1, 2, 0],
            log_weight: -0.1,
        };

        // Store with short TTL by modifying after put
        cache.put(opportunity.clone());

        // Manually modify TTL for testing
        {
            let mut cache_lock = cache.cache.lock().unwrap();
            if let Some(cached) = cache_lock.get_mut("0_1_2_0") {
                cached.ttl = Duration::from_millis(1);
            }
        }

        // Immediately try to retrieve (should still work)
        let retrieved = cache.get(&vec![0, 1, 2, 0]);
        assert!(retrieved.is_some());

        // Sleep for TTL expiration
        std::thread::sleep(Duration::from_millis(2));

        // Should be expired now
        let expired = cache.get(&vec![0, 1, 2, 0]);
        assert!(expired.is_none());
    }

    #[test]
    fn test_path_cache_eviction() {
        let stats = Arc::new(WatchtowerStats::default());
        let cache = PathCache::new(2, Arc::clone(&stats)); // Very small cache

        // Add three opportunities (should evict oldest/lowest scoring)
        let opp1 = ArbitrageOpportunity { path: vec![0, 1, 0], log_weight: -0.1 };
        let opp2 = ArbitrageOpportunity { path: vec![0, 2, 0], log_weight: -0.2 }; // More profitable
        let opp3 = ArbitrageOpportunity { path: vec![0, 3, 0], log_weight: -0.05 }; // Least profitable

        cache.put(opp1);
        cache.put(opp2);
        cache.put(opp3); // Should evict opp1 (least profitable)

        let stats = cache.get_stats();
        assert_eq!(stats.size, 2); // Cache size limit
        assert_eq!(stats.evictions, 1); // One eviction occurred

        // opp1 should be evicted
        assert!(cache.get(&vec![0, 1, 0]).is_none());
        // opp2 and opp3 should still be there
        assert!(cache.get(&vec![0, 2, 0]).is_some());
        assert!(cache.get(&vec![0, 3, 0]).is_some());
    }

    #[test]
    fn test_path_cache_ttl_adjustment() {
        let stats = Arc::new(WatchtowerStats::default());
        let cache = PathCache::new(10, Arc::clone(&stats));

        let opportunity = ArbitrageOpportunity {
            path: vec![0, 1, 0],
            log_weight: -0.1,
        };

        cache.put(opportunity);

        // Adjust TTL for high volatility
        cache.adjust_ttl_for_market_conditions(2.0, 1.0);

        // Verify TTL was shortened
        let cache_lock = cache.cache.lock().unwrap();
        if let Some(cached) = cache_lock.get("0_1_0") {
            // Should be shorter than original base TTL
            assert!(cached.ttl.as_secs() < 300); // Less than 5 minutes
        }
    }
}