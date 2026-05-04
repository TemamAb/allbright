use std::sync::Arc;
use std::time::Duration;
use tokio::time::timeout;
use futures::future::join_all;
use ethers::providers::Middleware;

use crate::rpc::RpcOrchestrator;

/// Configuration for the Block State Synchronizer.
#[derive(Debug, Clone)]
pub struct SyncConfig {
    pub sync_interval_ms: u64, // How often to attempt to sync
    pub rpc_timeout_ms: u64,   // Max time to wait for an RPC response
    pub num_racing_rpcs: usize, // How many top RPCs to query concurrently
}

/// Manages the synchronization of the local block state with the blockchain.
pub struct BlockStateSynchronizer {
    orchestrator: Arc<RpcOrchestrator>,
    config: SyncConfig,
    // In a real implementation, this would update a shared state
    // e.g., `Arc<RwLock<u64>>` for the latest block number
    pub latest_synced_block: Arc<tokio::sync::RwLock<u64>>,
}

impl BlockStateSynchronizer {
    pub fn new(orchestrator: Arc<RpcOrchestrator>, config: SyncConfig) -> Self {
        Self {
            orchestrator,
            config,
            latest_synced_block: Arc::new(tokio::sync::RwLock::new(0)),
        }
    }

    /// Starts a background task to continuously synchronize the block state.
    pub async fn start_sync_loop(self: Arc<Self>) {
        let sync_interval = Duration::from_millis(self.config.sync_interval_ms);
        let rpc_timeout = Duration::from_millis(self.config.rpc_timeout_ms);
        let self_clone = Arc::clone(&self);

        tokio::spawn(async move {
            loop {
                tokio::time::sleep(sync_interval).await;

                let top_rpcs = self_clone.orchestrator.get_top_n_providers(self_clone.config.num_racing_rpcs).await;

                if top_rpcs.is_empty() {
                    eprintln!("BSS: No healthy RPCs available for racing sync.");
                    continue;
                }

                let futures: Vec<_> = top_rpcs.iter()
                    .map(|provider| timeout(rpc_timeout, provider.get_block_number()))
                    .collect();

                let results = join_all(futures).await;

                for result in results {
                    if let Ok(Ok(block_num)) = result {
                        let mut latest_block = self_clone.latest_synced_block.write().await;
                        if block_num.as_u64() > *latest_block {
                            *latest_block = block_num.as_u64();
                            // println!("BSS: Synced to block {}", *latest_block);
                        }
                        break; // We got a block, no need to wait for others
                    }
                }
            }
        });
    }
}