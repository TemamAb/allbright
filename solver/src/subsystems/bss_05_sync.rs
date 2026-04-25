// BSS-05: Multi-Chain Sync Module (moved from root)
// Pure module - SyncSpecialist impl in main.rs
use ethers::prelude::*;
use ethers::providers::{Provider, SubscriptionStream, Ws};
use ethers::types::Filter;
use futures_util::StreamExt;
use std::sync::atomic::Ordering;
use std::sync::Arc;
use tokio::sync::mpsc;

use super::bss_04_graph::PoolState;
use crate::WatchtowerStats;

/// BSS-40: Predictive Mempool Intelligence Ingestion (8 Chains)
pub async fn subscribe_mempool(
    chain_id: u64,
    tx: mpsc::Sender<(String, String, PoolState)>,
    stats: Arc<WatchtowerStats>,
) {
    let ws_url = match chain_id {
        // Ethereum Mainnet
        1 => std::env::var("ETH_WS_URL")
            .unwrap_or_else(|_| "wss://ethereum-rpc.publicnode.com".to_string()),
        // Base
        8453 => std::env::var("BASE_WS_URL")
            .unwrap_or_else(|_| "wss://base-rpc.publicnode.com".to_string()),
        // Arbitrum One
        42161 => std::env::var("ARBITRUM_WS_URL")
            .unwrap_or_else(|_| "wss://arbitrum-rpc.publicnode.com".to_string()),
        // Optimism
        10 => std::env::var("OPTIMISM_WS_URL")
            .unwrap_or_else(|_| "wss://optimism-rpc.publicnode.com".to_string()),
        // Polygon PoS
        137 => std::env::var("POLYGON_WS_URL")
            .unwrap_or_else(|_| "wss://polygon-rpc.publicnode.com".to_string()),
        // Avalanche C-Chain
        43114 => std::env::var("AVALANCHE_WS_URL")
            .unwrap_or_else(|_| "wss://avalanche-rpc.publicnode.com".to_string()),
        // BNB Smart Chain
        56 => std::env::var("BSC_WS_URL")
            .unwrap_or_else(|_| "wss://bsc-rpc.publicnode.com".to_string()),
        // Fantom Opera
        250 => std::env::var("FANTOM_WS_URL")
            .unwrap_or_else(|_| "wss://fantom-rpc.publicnode.com".to_string()),
        _ => return,
    };

    if let Ok(p) = Provider::<Ws>::connect(ws_url).await {
        let provider = Arc::new(p);
        let mut stream = match provider.watch_pending_transactions().await {
            Ok(s) => s,
            Err(_) => return,
        };

        println!("[BSS-40] MEMPOOL INTELLIGENCE ACTIVE: Monitoring Chain {chain_id}");
        let swap_selector = [0x18, 0xc1, 0x0d, 0x9f];

        while let Some(tx_hash) = stream.next().await {
            stats.mempool_events_per_sec.fetch_add(1, Ordering::Relaxed);
            if let Ok(Some(pending_tx)) = provider.get_transaction(tx_hash).await {
                let data = &pending_tx.input;
                if data.len() >= 164 && data[0..4] == swap_selector {
                    if let Some(to_addr) = pending_tx.to {
                        let update = (
                            format!("{to_addr:?}_0"),
                            format!("{to_addr:?}_1"),
                            PoolState {
                                pool_address: format!("{to_addr:?}"),
                                reserve_0: 0,
                                reserve_1: 0,
                                fee_bps: 30,
                                last_updated_block: 0,
                            },
                        );
                        let _ = tx.send(update).await;
                    }
                }
            }
        }
    }
}

// subscribe_chain function (8 Chains)
pub async fn subscribe_chain(
    chain_id: u64,
    tx: mpsc::Sender<(String, String, PoolState)>,
    stats: Arc<WatchtowerStats>,
) {
    let providers = match chain_id {
        // Ethereum Mainnet
        1 => vec![
            std::env::var("ETH_WS_URL").unwrap_or_default(),
            "wss://ethereum-rpc.publicnode.com".to_string(),
        ],
        // Base
        8453 => vec![
            std::env::var("BASE_WS_URL").unwrap_or_default(),
            "wss://base-rpc.publicnode.com".to_string(),
        ],
        // Arbitrum One
        42161 => vec![
            std::env::var("ARBITRUM_WS_URL").unwrap_or_default(),
            "wss://arbitrum-rpc.publicnode.com".to_string(),
        ],
        // Optimism
        10 => vec![
            std::env::var("OPTIMISM_WS_URL").unwrap_or_default(),
            "wss://optimism-rpc.publicnode.com".to_string(),
        ],
        // Polygon PoS
        137 => vec![
            std::env::var("POLYGON_WS_URL").unwrap_or_default(),
            "wss://polygon-rpc.publicnode.com".to_string(),
        ],
        // Avalanche C-Chain
        43114 => vec![
            std::env::var("AVALANCHE_WS_URL").unwrap_or_default(),
            "wss://avalanche-rpc.publicnode.com".to_string(),
        ],
        // BNB Smart Chain
        56 => vec![
            std::env::var("BSC_WS_URL").unwrap_or_default(),
            "wss://bsc-rpc.publicnode.com".to_string(),
        ],
        // Fantom Opera
        250 => vec![
            std::env::var("FANTOM_WS_URL").unwrap_or_default(),
            "wss://fantom-rpc.publicnode.com".to_string(),
        ],
        _ => vec![],
    };

    for ws_url in providers.into_iter().filter(|s| !s.is_empty()) {
        if let Ok(p) = Provider::<Ws>::connect(&ws_url).await {
            println!("[BSS-05] Connected to RPC: {ws_url} for Chain {chain_id}");
            run_subscription_loop(Arc::new(p), chain_id, tx.clone(), stats.clone()).await;
            break;
        }
    }
}

async fn run_subscription_loop(
    provider: Arc<Provider<Ws>>,
    chain_id: u64,
    tx: mpsc::Sender<(String, String, PoolState)>,
    stats: Arc<WatchtowerStats>,
) {
    let filter = Filter::new().event("Sync(uint112,uint112)");
    let mut stream: SubscriptionStream<'_, Ws, Log> = match provider.subscribe(filter).await {
        Ok(s) => s,
        Err(_) => return,
    };

    println!("[BSS-05] WebSocket STREAM ACTIVE: Chain ID {chain_id}");

    while let Some(log) = stream.next().await {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        stats.last_heartbeat_bss05.store(now, Ordering::Relaxed);
        stats.msg_throughput_sec.fetch_add(1, Ordering::Relaxed);

            if log.data.len() >= 64 {
            let reserve_0 = u128::from_be_bytes(log.data[16..32].try_into().unwrap_or([0; 16]));
            let reserve_1 = u128::from_be_bytes(log.data[48..64].try_into().unwrap_or([0; 16]));

            // BSS-05: Dynamic fee detection (Milestone 4C.3)
            let fee_bps = estimate_fee_bps(&log.address.to_string());

            let update = (
                format!("{:?}_0", log.address),
                format!("{:?}_1", log.address),
                PoolState {
                    pool_address: format!("{:?}", log.address),
                    reserve_0,
                    reserve_1,
                    fee_bps,
                    last_updated_block: log.block_number.unwrap_or_default().as_u64(),
                },
            );
            let _ = tx.send(update).await;
        }
    }
}

// BSS-05: Dynamic fee estimation helper (Milestone 4C.3)
/// Estimate fee in basis points based on pool address patterns
/// For Uniswap V3: fee is encoded in the pool address (bytes 15-17)
/// For Uniswap V2: typically 30bps (0.3%), but can be 5bps or 100bps
pub fn estimate_fee_bps(pool_address: &str) -> u32 {
    // Simple heuristic: default to 30bps (0.3%) - most common for V2 and V3
    // TODO: Proper V3 fee extraction from pool address via contract call
    30
}
