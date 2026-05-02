use brightsky_solver::specialists::{
    SpecialistRegistry, profitability::ProfitabilitySpecialist, risk::RiskSpecialist, 
    api::ApiSpecialist, kpi::KpiSpecialist, performance::PerformanceSpecialist,
    efficiency::EfficiencySpecialist, health::HealthSpecialist, auto_optimization::AutoOptimizationSpecialist};
use brightsky_solver::benchmarks::load_benchmarks;
use brightsky_solver::timing::sub_block_timing::SubBlockTiming;
use brightsky_solver::rpc::rpc_orchestrator::RpcOrchestrator;
use brightsky_solver::{WatchtowerStats, SubsystemSpecialist, GES_WEIGHTS};
use std::env;
use std::sync::Mutex;
use std::sync::Arc;
use tokio::net::TcpListener;
use tokio::io::AsyncReadExt;
use serde_json::Value;
use tracing::{info, warn};

const GATE_THRESHOLD: f64 = 0.825; // Elite Grade Requirement

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let startup_time = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    println!("==================================================");
    println!("BRIGHTSKY SOLVER V2 - STARTING UP");
    println!("TIMESTAMP: {}", startup_time);
    println!("==================================================");
    
    // BSS-43: Load Benchmark Targets
    let _benchmarks = load_benchmarks("docs/benchmark-36-kpis.md");

    // Initialize shared WatchtowerStats
    let watchtower_stats = Arc::new(Mutex::new(WatchtowerStats::new()));
    let mut registry = SpecialistRegistry::new();
    
    // Register Specialists in GES order: [Profit, Risk, Performance, Efficiency, Health, Auto-Opt]
    registry.specialists.push(Arc::new(ProfitabilitySpecialist::new(Arc::clone(&watchtower_stats))));
    registry.specialists.push(Arc::new(RiskSpecialist::new(Arc::clone(&watchtower_stats))));
    registry.specialists.push(Arc::new(PerformanceSpecialist));
    registry.specialists.push(Arc::new(EfficiencySpecialist));
    registry.specialists.push(Arc::new(HealthSpecialist));
    registry.specialists.push(Arc::new(AutoOptimizationSpecialist { last_ges: 0.0 }));

    // Register Auxiliary Specialists (Not weighted in GES)
    registry.specialists.push(Arc::new(ApiSpecialist));
    registry.specialists.push(Arc::new(KpiSpecialist));

    info!("Specialist Registry initialized with {} agents", registry.specialists.len());

    // BSS-43: Pre-Deployment Simulation Gate
    info!("Executing Pre-Deployment Validation Gate...");
    let mut total_ges = 0.0;
    for (i, specialist) in registry.specialists.iter().enumerate().take(6) {
        let result = specialist.tune_kpis(&serde_json::Value::Null)?;
        // Use the centralized GES_WEIGHTS from lib.rs
        total_ges += GES_WEIGHTS[i] * (if result.tuned { 1.0 } else { 0.0 });
    }


    info!("Simulation GES: {:.2}%", total_ges * 100.0);
    if total_ges < GATE_THRESHOLD {
        warn!("CRITICAL: Global Efficiency Score (GES) ({:.2}%) below threshold ({}%). RenderCloud bypass active.", total_ges * 100.0, GATE_THRESHOLD * 100.0);
        if env::var("SKIP_GATE").unwrap_or_default() == "true" {
            warn!("SKIP_GATE active: Proceeding with degraded performance.");
            println!("✅ Deployment gate bypassed for production (local GES: {:.2}%)", total_ges * 100.0);
        } else {
            eprintln!("FATAL: System failed deployment gate and SKIP_GATE is false. Aborting start.");
            std::process::exit(1);
        }
    }

    // Prioritize PORT (Render's default) then INTERNAL_BRIDGE_PORT, then fallback to 4003
    let port = env::var("PORT")
        .or_else(|_| env::var("INTERNAL_BRIDGE_PORT"))
        .unwrap_or_else(|_| "4003".to_string());
    let addr = format!("0.0.0.0:{}", port);
    
    println!("Attempting to bind to {}...", addr);
    let listener = TcpListener::bind(&addr).await?;
    println!("SUCCESS: Listening on {}", addr);
    println!("BrightSky Solver - LIVE [TCP HEALTHCHECK ACTIVE]");
    
    // BSS-26: Spawn the BrightSky Orchestrator loop here to manage the 46 subsystems
    let registry_arc = Arc::new(registry); // Wrap registry in Arc for the orchestrator task
    let watchtower_stats_arc = Arc::clone(&watchtower_stats);
    let mut rpc_orchestrator = RpcOrchestrator::new(Arc::clone(&watchtower_stats));
    let mut sub_block_timing = SubBlockTiming::new();

    tokio::spawn(async move {
        info!("BrightSky Orchestrator started.");
        let mut cycle_count = 0;
        loop {
            {
                let mut stats_guard = watchtower_stats_arc.lock().unwrap();
                // Simulate external updates to some stats for specialists to react to
                // In a real system, these would come from various data sources
                stats_guard.current_nrp_eth_per_day = (stats_guard.current_nrp_eth_per_day + 0.1).min(25.0);
                stats_guard.current_competitive_collision_rate = (stats_guard.current_competitive_collision_rate - 0.05).max(0.5);
                stats_guard.msg_throughput_count += 500;

                // BSS-13: Integrate Sub-Block Timing for competitive collision prediction
                rpc_orchestrator.update_latencies();
                let current_rpc_latency = stats_guard.rpc_inclusion_latency_ms;
                let current_cycle_slot = cycle_count as u64; // Use cycle_count as a proxy for slot
                sub_block_timing.record_latency(current_cycle_slot, current_rpc_latency);
                let bribe_multiplier = sub_block_timing.estimate_bribe_multiplier(current_cycle_slot);
                
                info!("[SUB-BLOCK-TIMING] Current RPC Latency: {:.2}ms, Estimated Bribe Multiplier: {:.2}x", current_rpc_latency, bribe_multiplier);
                
                // Task 0.3: KPI Snapshot Persistence (every 5 minutes / 30 cycles)
                if cycle_count % 30 == 0 {
                    info!("[KPI-SNAPSHOT] NRP: {:.2} ETH/d | Collision: {:.2}% | Bribe: {} bps", 
                        stats_guard.current_nrp_eth_per_day, stats_guard.current_competitive_collision_rate, stats_guard.min_profit_bps);
                }
            }

            for specialist in &registry_arc.specialists {
                match specialist.tune_kpis(&serde_json::Value::Null) {
                    Ok(result) => {
                        if result.gate_trigger.should_trigger_gate {
                            warn!("Gate Triggered by {}: {} - Risk Level: {:?}", specialist.name(), result.gate_trigger.trigger_reason.unwrap_or_default(), result.gate_trigger.risk_level);
                        }
                    },
                    Err(e) => {
                        eprintln!("Error tuning KPI for {}: {}", specialist.name(), e);
                    }
                }
            }
            cycle_count += 1;
            tokio::time::sleep(tokio::time::Duration::from_secs(10)).await; // Run every 10 seconds
        }
    });

    loop {
        let (mut socket, _) = listener.accept().await?;
        let watchtower_stats_arc = Arc::clone(&watchtower_stats);

        tokio::spawn(async move {
            let mut buf = [0; 1024];
            match socket.read(&mut buf).await {
                Ok(n) if n > 0 => {
                    let msg = String::from_utf8_lossy(&buf[..n]);
                    if let Ok(json) = serde_json::from_str::<Value>(&msg) {
                        if json["type"] == "UPDATE_BRIBE_TUNING" {
                            let mut stats = watchtower_stats_arc.lock().unwrap();
                            if let Some(min_margin) = json["min_margin_bps"].as_u64() {
                                stats.min_margin_ratio_bps = min_margin;
                            }
                            if let Some(bribe) = json["bribe_bps"].as_u64() {
                                stats.bribe_ratio_bps = bribe;
                            }
                            info!("[IPC] Bribe tuning updated: margin={} bps, bribe={} bps", 
                                stats.min_margin_ratio_bps, stats.bribe_ratio_bps);
                        }
                    }
                }
                _ => {}
            }
        });
    }
}
