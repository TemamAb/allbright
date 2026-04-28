// BSS-04: Token Graph Representation for Arbitrage Detection
// Represents liquidity pools as a graph where tokens are nodes and pools are edges
// Enables efficient arbitrage path detection using graph algorithms

use dashmap::DashMap;
use std::sync::RwLock;
use tracing::{error, warn};
use tracing::{error, warn};

/// State of a liquidity pool (Uniswap V2 style)
#[derive(Debug, Clone, Default)]
pub struct PoolState {
    pub pool_address: String,
    pub reserve_0: u128,
    pub reserve_1: u128,
    pub fee_bps: u32,
    pub last_updated_block: u64,
}

/// Directed edge in the token graph representing a pool
#[derive(Debug, Clone)]
pub struct PoolEdge {
    pub from: usize,      // Source token index
    pub to: usize,        // Destination token index
    pub reserve_in: u128, // Reserve of input token
    pub reserve_out: u128, // Reserve of output token
    pub fee_bps: u32,     // Fee in basis points (e.g., 30 = 0.3%)
    pub pool_address: String, // Pool contract address for reference
}

/// Persistent token graph structure with thread-safe concurrent access
pub struct GraphPersistence {
    /// Maps token address to stable numeric index for efficient array access
    pub token_to_index: DashMap<String, usize>,
    /// Maps numeric index back to token address
    pub index_to_token: RwLock<Vec<String>>,
    /// Adjacency list: for each token index, vector of outgoing PoolEdges
    pub adjacency_list: RwLock<Vec<Vec<PoolEdge>>>,
}

impl Default for GraphPersistence {
    fn default() -> Self {
        Self::new()
    }
}

impl GraphPersistence {
    /// Creates a new empty graph persistence structure
    pub fn new() -> Self {
        Self {
            token_to_index: DashMap::new(),
            index_to_token: RwLock::new(Vec::new()),
            adjacency_list: RwLock::new(Vec::new()),
        }
    }

    /// Safely acquire read lock with poison recovery
    #[inline]
    fn acquire_adj_read(&self) -> std::sync::RwLockReadGuard<'_, Vec<Vec<PoolEdge>>> {
        match self.adjacency_list.read() {
            Ok(guard) => guard,
            Err(poisoned) => {
                error!(target: "bss_04_graph", "Adjacency list RwLock poisoned, recovering");
                poisoned.into_inner()
            }
        }
    }

    /// Safely acquire write lock with poison recovery
    #[inline]
    fn acquire_adj_write(&self) -> std::sync::RwLockWriteGuard<'_, Vec<Vec<PoolEdge>>> {
        match self.adjacency_list.write() {
            Ok(guard) => guard,
            Err(poisoned) => {
                error!(target: "bss_04_graph", "Adjacency list RwLock poisoned (write), recovering");
                poisoned.into_inner()
            }
        }
    }

    /// Safely acquire index_to_token read lock with poison recovery
    #[inline]
    fn acquire_index_read(&self) -> std::sync::RwLockReadGuard<'_, Vec<String>> {
        match self.index_to_token.read() {
            Ok(guard) => guard,
            Err(poisoned) => {
                error!(target: "bss_04_graph", "Index token RwLock poisoned (read), recovering");
                poisoned.into_inner()
            }
        }
    }

    /// Safely acquire index_to_token write lock with poison recovery
    #[inline]
    fn acquire_index_write(&self) -> std::sync::RwLockWriteGuard<'_, Vec<String>> {
        match self.index_to_token.write() {
            Ok(guard) => guard,
            Err(poisoned) => {
                error!(target: "bss_04_graph", "Index token RwLock poisoned (write), recovering");
                poisoned.into_inner()
            }
        }
    }

    /// Maps a token address string to a stable usize index.
    /// Creates new index if token not seen before.
    pub fn get_or_create_index(&self, token: &str) -> usize {
        // Fast path: check if token already exists (lock-free read)
        if let Some(idx) = self.token_to_index.get(token) {
            return *idx;
        }
        
        // Slow path: need to add new token (requires write locks)
        let mut tokens = self.acquire_index_write();
        let mut adj = self.acquire_adj_write();
        
        // Double-check after acquiring locks to avoid race conditions
        if let Some(idx) = self.token_to_index.get(token) {
            return *idx;
        }
        
        // Actually add the new token
        let new_idx = tokens.len();
        tokens.push(token.to_string());
        adj.push(Vec::new()); // Initialize empty adjacency list for new token
        self.token_to_index.insert(token.to_string(), new_idx);
        new_idx
    }

    /// Updates or adds a pool edge in both directions (A->B and B->A)
    pub fn update_edge(&self, token_a: String, token_b: String, state: PoolState) {
        // Get or create indices for both tokens
        let idx_a = self.get_or_create_index(&token_a);
        let idx_b = self.get_or_create_index(&token_b);
        
        // Get write access to adjacency list
        let mut adj = self.acquire_adj_write();
        
        // Create edge A -> B (reserve_0 is input, reserve_1 is output)
        let edge_ab = PoolEdge {
            from: idx_a,
            to: idx_b,
            reserve_in: state.reserve_0,
            reserve_out: state.reserve_1,
            fee_bps: state.fee_bps,
            pool_address: state.pool_address.clone(),
        };
        
        // Update or add edge in A's adjacency list
        let list_a = &mut adj[idx_a];
        if let Some(pos) = list_a
            .iter()
            .position(|e| e.pool_address == state.pool_address)
        {
            // Replace existing edge for this pool
            list_a[pos] = edge_ab;
        } else {
            // Add new edge
            list_a.push(edge_ab);
        }
        
        // Create edge B -> A (reserve_1 is input, reserve_0 is output)
        let edge_ba = PoolEdge {
            from: idx_b,
            to: idx_a,
            reserve_in: state.reserve_1,
            reserve_out: state.reserve_0,
            fee_bps: state.fee_bps,
            pool_address: state.pool_address,
        };
        
        // Update or add edge in B's adjacency list
        let list_b = &mut adj[idx_b];
        if let Some(pos) = list_b
            .iter()
            .position(|e| e.pool_address == state.pool_address)
        {
            // Replace existing edge for this pool
            list_b[pos] = edge_ba;
        } else {
            // Add new edge
            list_b.push(edge_ba);
        }
    }

    /// Retrieves all outgoing edges for a given token index
    pub fn get_edges(&self, node_idx: usize) -> Vec<PoolEdge> {
        let adj = self.acquire_adj_read();
        adj.get(node_idx).cloned().unwrap_or_default()
    }

    /// Validates basic data integrity for the arbitrage engine.
    /// Returns Some(error_message) if validation fails, None if valid.
    pub fn validate_global_invariants(&self) -> Option<String> {
        let adj = self.acquire_adj_read();
        for edges in adj.iter() {
            for edge in edges {
                // Check for zero reserves (invalid pool state)
                if edge.reserve_in == 0 || edge.reserve_out == 0 {
                    return Some(format!(
                        "Zero reserve detected in pool {}",
                        edge.pool_address
                    ));
                }
                // Check for invalid fee values (should be 0-10000 bps)
                if edge.fee_bps > 10000 {
                    return Some(format!(
                        "Invalid fee ({} bps) in pool {}",
                        edge.fee_bps, edge.pool_address
                    ));
                }
            }
        }
        None
    }
}