use brightsky_solver::specialists::{SpecialistRegistry, profitability::ProfitabilitySpecialist, risk::RiskSpecialist};
use brightsky_solver::benchmarks::load_benchmarks;
use brightsky_solver::{WatchtowerStats, SubsystemSpecialist, GES_WEIGHTS};
use std::env;
use std::sync::Mutex;
use std::sync::Arc;
use tokio::net::TcpListener;
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
    
    // Register Core Specialists
    registry.specialists.push(Arc::new(ProfitabilitySpecialist::new(Arc::clone(&watchtower_stats))));
    registry.specialists.push(Arc::new(RiskSpecialist::new(Arc::clone(&watchtower_stats))));

    info!("Specialist Registry initialized with {} agents", registry.specialists.len());

    // BSS-43: Pre-Deployment Simulation Gate
    info!("Executing Pre-Deployment Validation Gate...");
let mut total_ges = 0.0;
    for (i, specialist) in registry.specialists.iter().enumerate() {
        let result = specialist.tune_kpis(&serde_json::Value::Null)?;
        // Use the centralized GES_WEIGHTS from lib.rs
        let weight = GES_WEIGHTS.get(i).unwrap_or(&0.1);
        total_ges += *weight * result.tuned as i32 as f64; 
    }


    info!("Simulation GES: {:.2}%", total_ges * 100.0);
    if total_ges < GATE_THRESHOLD {
        warn!("CRITICAL: Global Efficiency Score (GES) ({:.2}%) below threshold ({}%)", total_ges * 100.0, GATE_THRESHOLD * 100.0);
        
        let override_token = env::var("GATE_OVERRIDE_TOKEN").unwrap_or_default();
        if env::var("SKIP_GATE").unwrap_or_default() == "true" || !override_token.is_empty() {
            warn!("USER OVERRIDE ACTIVE: System starting despite performance gap. (Token: {})", override_token);
        } else {
            return Err("Deployment gate failed: System performance below Elite Grade requirements. Set GATE_OVERRIDE_TOKEN to bypass.".into());
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
    
    // BSS-26: Spawn the Nexus Orchestrator loop here to manage the 46 subsystems
    let registry_arc = Arc::new(registry); // Wrap registry in Arc for the orchestrator task
    let watchtower_stats_arc = Arc::clone(&watchtower_stats);

    tokio::spawn(async move {
        info!("Nexus Orchestrator started.");
        let mut cycle_count = 0;
        loop {
            {
                let mut stats_guard = watchtower_stats_arc.lock().unwrap();
                // Simulate external updates to some stats for specialists to react to
                // In a real system, these would come from various data sources
                stats_guard.current_nrp_eth_per_day = (stats_guard.current_nrp_eth_per_day + 0.1).min(25.0);
                stats_guard.current_competitive_collision_rate = (stats_guard.current_competitive_collision_rate - 0.05).max(0.5);
                
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
        let (socket, _) = listener.accept().await?;
        tokio::spawn(async move {
            let _ = socket.readable().await;
        });
    }
}
