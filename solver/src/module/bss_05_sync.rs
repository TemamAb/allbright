// BSS-05: Multi-Chain Sync Module
// Fixed compilation: removed duplicates, fixed braces/indentation, defined BatchRpcClient
use ethers::prelude::*;
use ethers::providers::{Provider, SubscriptionStream, Ws};
use ethers::types::{Filter, Log, Transaction};
use futures_util::StreamExt;
use std::collections::HashMap;
use std::sync::atomic::Ordering;
use std::sync::Arc;
use std::time::Instant;
use tokio::sync::mpsc;

use super::bss_04_graph::PoolState;
use crate::WatchtowerStats;

/// Get providers for chain
fn get_providers(chain_id: u64) -> Vec<String> {
    match chain_id {
        1 => vec![
            std::env::var("ETH_WS_URL").unwrap_or_default(),
            "wss://ethereum-rpc.publicnode.com".to_string(),
        ],
        8453 => vec![
            std::env::var("BASE_WS_URL").unwrap_or_default(),
            "wss://base-rpc.publicnode.com".to_string(),
        ],
        42161 => vec![
            std::env::var("ARBITRUM_WS_URL").unwrap_or_default(),
            "wss://arbitrum-rpc.publicnode.com".to_string(),
        ],
        10 => vec![
            std::env::var("OPTIMISM_WS_URL").unwrap_or_default(),
            "wss://optimism-rpc.publicnode.com".to_string(),
        ],
        137 => vec![
            std::env::var("POLYGON_WS_URL").unwrap_or_default(),
            "wss://polygon-rpc.publicnode.com".to_string(),
        ],
        43114 => vec![
            std::env::var("AVALANCHE_WS_URL").unwrap_or_default(),
            "wss://avalanche-rpc.publicnode.com".to_string(),
        ],
        56 => vec![
            std::env::var("BSC_WS_URL").unwrap_or_default(),
            "wss://bsc-rpc.publicnode.com".to_string(),
        ],
        250 => vec![
            std::env::var("FANTOM_WS_URL").unwrap_or_default(),
            "wss://fantom-rpc.publicnode.com".to_string(),
        ],
        _ => vec![],
    }
}

pub async fn subscribe_mempool(
    chain_id: u64,
    tx: mpsc::Sender<(String, String, PoolState)>,
    stats: Arc<WatchtowerStats>,
) {
    let providers = get_providers(chain_id);
    for ws_url in providers.into_iter().filter(|s| !s.is_empty()) {
        if let Ok(p) = Provider::<Ws>::connect(&ws_url).await {
            println!("[BSS-05] Mempool connected: {} Chain {}", ws_url, chain_id);
            let mempool_tx = tx.clone();
            let mempool_stats = stats.clone();
            tokio::spawn(async move {
                monitor_mempool_pending(Arc::new(p), chain_id, mempool_tx, mempool_stats).await;
            });
            break;
        }
    }
}

async fn monitor_mempool_pending(
    provider: Arc<Provider<Ws>>,
    chain_id: u64,
    tx: mpsc::Sender<(String, String, PoolState)>,
    stats: Arc<WatchtowerStats>,
) {
    let mut stream = match provider.subscribe_pending_txs().await {
        Ok(s) => s,
        Err(e) => {
            eprintln!("[BSS-05] Mempool sub failed: {}", e);
            return;
        }
    };

    println!("[BSS-05] Mempool monitor active: Chain {}", chain_id);

    while let Some(tx_hash) = stream.next().await {
        stats.mempool_events_per_sec.fetch_add(1, Ordering::Relaxed);
        
        if let Ok(Some(transaction)) = provider.get_transaction(tx_hash).await {
            if transaction.to.is_some() && transaction.input.len() >= 4 {
                let selector = &transaction.input[0..4];
                // Uniswap V2 swap: 0x18c10d9f
                if selector == &[0x18, 0xc1, 0x0d, 0x9f] && transaction.input.len() >= 68 {
                    let token_a = Address::from_slice(&transaction.input[4..36]);
                    let token_b = Address::from_slice(&transaction.input[36..68]);
                    let to_addr = transaction.to.unwrap();
                    
                    let pool_state = PoolState {
                        pool_address: format!("{:?}", to_addr),
                        reserve_0: 0,
                        reserve_1: 0,
                        fee_bps: 30,
                        last_updated_block: 0,
                    };
                    
                    let update = (
                        format!("{:?}_0", token_a),
                        format!("{:?}_1", token_b),
                        pool_state,
                    );
                    
                    let _ = tx.send(update).await;
                }
            }
        }
    }
}

pub async fn subscribe_chain(
    chain_id: u64,
    tx: mpsc::Sender<(String, String, PoolState)>,
    stats: Arc<WatchtowerStats>,
) {
    let providers = get_providers(chain_id);
    for ws_url in providers.into_iter().filter(|s| !s.is_empty()) {
        if let Ok(p) = Provider::<Ws>::connect(&ws_url).await {
            println!("[BSS-05] Chain sync connected: {} Chain {}", ws_url, chain_id);
            run_subscription_loop(Arc::new(p), chain_id, tx, stats).await;
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
    let mut stream = match provider.subscribe(filter).await {
        Ok(s) => s,
        Err(_) => return,
    };

    println!("[BSS-05] Sync stream active: Chain {}", chain_id);

    let batch_client = BatchRpcClient::new(Arc::clone(&provider), 25);

    let mut pending_pools = Vec::new();
    let mut last_batch_time = Instant::now();

    while let Some(log) = stream.next().await {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        stats.last_heartbeat_bss05.store(now, Ordering::Relaxed);
        stats.msg_throughput_sec.fetch_add(1, Ordering::Relaxed);

        if log.data.len() >= 64 {
            let reserve_0 = u128::from_be_bytes(log.data[16..32].try_into().unwrap_or([0u8; 16]));
            let reserve_1 = u128::from_be_bytes(log.data[48..64].try_into().unwrap_or([0u8; 16]));
            let block_number = log.block_number.unwrap_or_default().as_u64();

            let pool_state = PoolState {
                pool_address: format!("{:?}", log.address),
                reserve_0,
                reserve_1,
                fee_bps: estimate_fee_bps(&format!("{:?}", log.address)),
                last_updated_block: block_number,
            };

            let update = (
                format!("{:?}_0", log.address),
                format!("{:?}_1", log.address),
                pool_state.clone(),
            );
            let _ = tx.send(update).await;

            if pending_pools.len() < 100 {
                pending_pools.push(PendingPoolInfo {
                    address: log.address,
                    reserve_0,
                    reserve_1,
                    block_number,
                });
            }
        }

        if last_batch_time.elapsed() > std::time::Duration::from_millis(100) && !pending_pools.is_empty() {
            let pool_addresses: Vec<_> = pending_pools.iter().map(|p| p.address).collect();
            if let Ok(reserves) = batch_client.batch_get_pool_reserves(pool_addresses, &stats).await {
                for (addr, (r0, r1)) in reserves {
                    if let Some(idx) = pending_pools.iter().position(|p| p.address == addr) {
                        let pool = &mut pending_pools[idx];
                        let current_total = pool.reserve_0 + pool.reserve_1;
                        let new_total = r0.as_u128() + r1.as_u128();
                        if (current_total as f64 - new_total as f64).abs() / current_total.max(1) as f64 > 0.01 {
                            let update = (
                                format!("{:?}_0", addr),
                                format!("{:?}_1", addr),
                                PoolState {
                                    pool_address: format!("{:?}", addr),
                                    reserve_0: r0.as_u128(),
                                    reserve_1: r1.as_u128(),
                                    fee_bps: estimate_fee_bps(&format!("{:?}", addr)),
                                    last_updated_block: pool.block_number,
                                },
                            );
                            let _ = tx.send(update).await;
                        }
                    }
                }
            }
            pending_pools.clear();
            last_batch_time = Instant::now();
        }
    }
}

#[derive(Clone)]
struct PendingPoolInfo {
    address: Address,
    reserve_0: u128,
    reserve_1: u128,
    block_number: u64,
}

pub fn estimate_fee_bps(_pool_address: &str) -> u32 {
    30
}

pub struct BatchRpcClient {
    provider: Arc<Provider<Ws>>,
    batch_size: usize,
    request_timeout_ms: u64,
}

impl BatchRpcClient {
    pub fn new(provider: Arc<Provider<Ws>>, batch_size: usize) -> Self {
        Self {
            provider,
            batch_size: batch_size.max(1).min(100),
            request_timeout_ms: 5000,
        }
    }

    pub async fn batch_get_pool_reserves(
        &self,
        pool_addresses: Vec<Address>,
        stats: &Arc<WatchtowerStats>,
    ) -> Result<HashMap<Address, (U256, U256)>, Box<dyn std::error::Error>> {
        if pool_addresses.is_empty() {
            return Ok(HashMap::new());
        }

        let get_reserves_sig = "0x0902f1ac"; // getReserves()
        let mut results = HashMap::new();

        for chunk in pool_addresses.chunks(self.batch_size) {
            let calls: Vec<_> = chunk.iter().map(|addr| {
                ethers::types::TransactionRequest::new()
                    .to(*addr)
                    .data(get_reserves_sig)
            }).collect();

            let batch_results = futures::future::join_all(
                calls.iter().map(|call| {
                    let provider = Arc::clone(&self.provider);
                    async move {
                        tokio::time::timeout(
                            std::time::Duration::from_millis(self.request_timeout_ms),
                            provider.call(call.clone(), None)
                        ).await
                    }
                })
            ).await;

            for (i, result) in batch_results.into_iter().enumerate() {
                let addr = chunk[i];
                match result {
                    Ok(Ok(bytes)) if bytes.len() >= 64 => {
                        let reserve_0 = U256::from_big_endian(&bytes[0..32]);
                        let reserve_1 = U256::from_big_endian(&bytes[32..64]);
                        results.insert(addr, (reserve_0, reserve_1));
                    }
                    _ => {}
                }
            }
        }

        Ok(results)
    }
}
