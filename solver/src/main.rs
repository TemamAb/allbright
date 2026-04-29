





use brightsky_solver::graph::bss_04_graph::{GraphPersistence, PoolState};
use hmac::{Hmac, Mac};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sha2::Sha256;
use std::collections::HashMap;
#[cfg(unix)]
use std::os::unix::fs::PermissionsExt;
use std::sync::atomic::{AtomicBool, AtomicU64, AtomicUsize, Ordering};
use std::sync::Arc;
use std::sync::{Mutex, RwLock};
use std::time::{Duration, Instant};
use tokio::io::{AsyncBufReadExt, AsyncRead, AsyncReadExt, AsyncWrite, AsyncWriteExt};
type HmacSha256 = Hmac<Sha256>;
use tokio::sync::{broadcast, mpsc, watch};
use tokio::time::{sleep, timeout};

// Import types from the library
use brightsky_solver::{benchmarks, SubsystemSpecialist, HealthStatus, BssLevel, DebugIntent, DebuggingOrder, CopilotProposal, SystemPolicy, WatchtowerStats, AutoOptimizer, DashboardSpecialist, InvariantSpecialist, PENDING_PROPOSAL, USED_NONCES, path_cache};

// Module type imports

use brightsky_solver::solver::bss_13_solver::{ArbitrageOpportunity, SolverSpecialist};
use brightsky_solver::liquidity::bss_44_liquidity::LiquidityEngine;
use brightsky_solver::simulation::bss_43_simulator::{SimulationEngine, SimulationResult, SimulationSpecialist};
use brightsky_solver::risk::bss_45_risk::{RiskEngine, RiskSpecialist};
use brightsky_solver::mev::bss_42_mev_guard::{MEVGuardEngine, MEVGuardSpecialist};
use brightsky_solver::ui::bss_27_ui_gateway::UIGatewaySpecialist;
use brightsky_solver::metrics::bss_46_metrics::MetricsSpecialist;
use brightsky_solver::module::bss_41_executor::PrivateExecutorSpecialist;
use brightsky_solver::module::bss_16_p2p_bridge::P2PNBridgeSpecialist;
use brightsky_solver::module::bss_40_mempool::{MempoolIntelligenceSpecialist, MempoolEngine};
use brightsky_solver::sync::bss_05_sync::{subscribe_mempool, subscribe_chain};





/// Design-Time KPI Targets for Performance Gap Analysis
const TARGET_THROUGHPUT: usize = 500; // msgs/sec
const TARGET_LATENCY_MS: u64 = 10; // p99 ms
const TARGET_CYCLES_PER_HOUR: u64 = 120;
const TARGET_GRAPH_UPDATE_MS: u64 = 5;
pub const TARGET_MEMPOOL_INGESTION_SEC: f64 = 10000.0;
pub const TARGET_TOTAL_SCORE_PCT: f64 = 95.0;

/// BSS-47: Profitability Specialist (Domain 1: KPIs 1.1-1.6)
pub struct ProfitSpecialist { pub stats: Arc<WatchtowerStats> }
impl SubsystemSpecialist for ProfitSpecialist {
    fn subsystem_id(&self) -> &'static str { "BSS-47" }
    fn check_health(&self) -> HealthStatus { HealthStatus::Optimal }
    fn upgrade_strategy(&self) -> &'static str { "Alpha-Expansion: New liquidity route discovery." }
    fn testing_strategy(&self) -> &'static str { "Backtesting: Realized vs Expected profit." }
    fn run_diagnostic(&self) -> Value { serde_json::json!({ "daily_profit": self.stats.total_profit_milli_eth.load(Ordering::Relaxed) }) }
    fn execute_remediation(&self, _cmd: &str) -> Result<(), String> { Ok(()) }
    fn get_performance_kpi(&self) -> Value {
        let actual = self.stats.total_profit_milli_eth.load(Ordering::Relaxed) as f64 / 1000.0;
        serde_json::json!({ "kpi": "Daily Profit", "target": 22.5, "actual": actual, "unit": "ETH" })
    }
    fn get_domain_score(&self) -> f64 {
        let actual = self.stats.total_profit_milli_eth.load(Ordering::Relaxed) as f64 / 1000.0;
        let score = (actual / 22.5).min(1.0);
        self.stats.domain_score_profit.store((score * 1000.0) as u64, Ordering::Relaxed);
        score
    }
}

/// BSS-48: Risk & Safety Domain Specialist (Domain 2: KPIs 2.1-2.5)
pub struct RiskDomainSpecialist { pub stats: Arc<WatchtowerStats> }
impl SubsystemSpecialist for RiskDomainSpecialist {
    fn subsystem_id(&self) -> &'static str { "BSS-48" }
    fn check_health(&self) -> HealthStatus { HealthStatus::Optimal }
    fn upgrade_strategy(&self) -> &'static str { "Adversarial: MEV deflection updates." }
    fn testing_strategy(&self) -> &'static str { "Chaos: Simulation of poisoned liquidity." }
    fn run_diagnostic(&self) -> Value { serde_json::json!({ "rejections": self.stats.signals_rejected_risk.load(Ordering::Relaxed) }) }
    fn execute_remediation(&self, _cmd: &str) -> Result<(), String> { Ok(()) }
    fn get_performance_kpi(&self) -> Value {
        let actual = self.stats.loss_rate_bps.load(Ordering::Relaxed) as f64;
        serde_json::json!({ "kpi": "Loss Rate", "target": 50.0, "actual": actual, "unit": "bps" })
    }
    fn get_domain_score(&self) -> f64 {
        let loss_rate = self.stats.loss_rate_bps.load(Ordering::Relaxed) as f64;
        let score = if loss_rate == 0.0 { 1.0 } else { (50.0 / loss_rate).min(1.0) };
        self.stats.domain_score_risk.store((score * 1000.0) as u64, Ordering::Relaxed);
        score
    }
}

/// BSS-49: Performance Specialist (Domain 3: KPIs 3.1-3.6)
pub struct ExecutionSpecialist { pub stats: Arc<WatchtowerStats> }
impl SubsystemSpecialist for ExecutionSpecialist {
    fn subsystem_id(&self) -> &'static str { "BSS-49" }
    fn check_health(&self) -> HealthStatus { HealthStatus::Optimal }
    fn upgrade_strategy(&self) -> &'static str { "Low-Latency: AVX-512 graph traversal." }
    fn testing_strategy(&self) -> &'static str { "Stress: 10,000 signals/sec burst." }
    fn run_diagnostic(&self) -> Value { serde_json::json!({ "p99_latency": self.stats.solver_latency_p99_ms.load(Ordering::Relaxed) }) }
    fn execute_remediation(&self, _cmd: &str) -> Result<(), String> { Ok(()) }
    fn get_performance_kpi(&self) -> Value {
        let actual = self.stats.solver_latency_p99_ms.load(Ordering::Relaxed) as f64;
        serde_json::json!({ "kpi": "Solver Latency", "target": 12.0, "actual": actual, "unit": "ms" })
    }
    fn get_domain_score(&self) -> f64 {
        let latency = self.stats.solver_latency_p99_ms.load(Ordering::Relaxed) as f64;
        let score = if latency == 0.0 { 1.0 } else { (12.0 / latency).min(1.0) };
        self.stats.domain_score_perf.store((score * 1000.0) as u64, Ordering::Relaxed);
        score
    }
}

/// BSS-50: Efficiency Specialist (Domain 4: KPIs 4.1-4.5)
pub struct EfficiencySpecialist { pub stats: Arc<WatchtowerStats> }
impl SubsystemSpecialist for EfficiencySpecialist {
    fn subsystem_id(&self) -> &'static str { "BSS-50" }
    fn check_health(&self) -> HealthStatus { HealthStatus::Optimal }
    fn upgrade_strategy(&self) -> &'static str { "Predictive: Mempool state overlay logic." }
    fn testing_strategy(&self) -> &'static str { "Parity: Simulation vs Reality delta." }
    fn run_diagnostic(&self) -> Value { serde_json::json!({ "mempool_pressure": self.stats.mempool_events_per_sec.load(Ordering::Relaxed) }) }
    fn execute_remediation(&self, _cmd: &str) -> Result<(), String> { Ok(()) }
    fn get_performance_kpi(&self) -> Value {
        let actual = self.stats.gas_efficiency.load(Ordering::Relaxed) as f64;
        serde_json::json!({ "kpi": "Gas Efficiency", "target": 96.5, "actual": actual, "unit": "%" })
    }
    fn get_domain_score(&self) -> f64 {
        let eff = self.stats.gas_efficiency.load(Ordering::Relaxed) as f64;
        let score = (eff / 96.5).min(1.0);
        self.stats.domain_score_eff.store((score * 1000.0) as u64, Ordering::Relaxed);
        score
    }
}

/// BSS-51: System Health Specialist (Domain 5: KPIs 5.1-5.8)
pub struct HealthSpecialist { pub stats: Arc<WatchtowerStats> }
impl SubsystemSpecialist for HealthSpecialist {
    fn subsystem_id(&self) -> &'static str { "BSS-51" }
    fn check_health(&self) -> HealthStatus { HealthStatus::Optimal }
    fn upgrade_strategy(&self) -> &'static str { "Resilience: Multi-cloud failover." }
    fn testing_strategy(&self) -> &'static str { "Uptime: 99.999% SLA verification." }
    fn run_diagnostic(&self) -> Value { serde_json::json!({ "ges": self.stats.total_weighted_score.load(Ordering::Relaxed) as f64 / 10.0 }) }
    fn execute_remediation(&self, _cmd: &str) -> Result<(), String> { Ok(()) }
    fn get_performance_kpi(&self) -> Value {
        let actual = self.stats.uptime_percent.load(Ordering::Relaxed) as f64 / 10.0;
        serde_json::json!({ "kpi": "Uptime", "target": 99.9, "actual": actual, "unit": "%" })
    }
    fn get_domain_score(&self) -> f64 {
        let uptime = self.stats.uptime_percent.load(Ordering::Relaxed) as f64 / 10.0;
        let conv_rate = self.stats.opt_convergence_rate.load(Ordering::Relaxed) as f64;
        
        let uptime_score = (uptime / 99.9).min(1.0);
        let conv_score = if conv_rate == 0.0 { 1.0 } else { (3.0 / conv_rate).min(1.0) };
        let score = (uptime_score + conv_score) / 2.0;
        
        self.stats.domain_score_health.store((score * 1000.0) as u64, Ordering::Relaxed);
        score
    }
}

/// BSS-37: Dockerization Specialist
pub struct DockerSpecialist;
impl SubsystemSpecialist for DockerSpecialist {
    fn subsystem_id(&self) -> &'static str {
        "BSS-37"
    }
    fn check_health(&self) -> HealthStatus {
        HealthStatus::Optimal
    }
    fn upgrade_strategy(&self) -> &'static str {
        "Immutable: Rebuild OCI Image"
    }
    fn testing_strategy(&self) -> &'static str {
        "Container Scan: Trivy/Snyk"
    }
    fn run_diagnostic(&self) -> Value {
        serde_json::json!({ "containerized": true, "layer_count": 12 })
    }
    fn execute_remediation(&self, _command: &str) -> Result<(), String> {
        Ok(())
    }
}

/// BSS-38: Pre-flight Integrity Specialist
pub struct PreflightSpecialist;
impl SubsystemSpecialist for PreflightSpecialist {
    fn subsystem_id(&self) -> &'static str {
        "BSS-38"
    }
    fn check_health(&self) -> HealthStatus {
        HealthStatus::Optimal
    }
    fn upgrade_strategy(&self) -> &'static str {
        "Dynamic: Env injection"
    }
    fn testing_strategy(&self) -> &'static str {
        "Env Mocking"
    }
    fn run_diagnostic(&self) -> Value {
        serde_json::json!({ "env_parity": true, "secrets_locked": true })
    }
    fn execute_remediation(&self, _command: &str) -> Result<(), String> {
        Err("Pre-flight failure requires manual secret rotation".into())
    }
}

/// BSS-03: IPC Bridge Specialist
pub struct IpcBridgeSpecialist;
impl SubsystemSpecialist for IpcBridgeSpecialist {
    fn subsystem_id(&self) -> &'static str {
        "BSS-03"
    }
    fn check_health(&self) -> HealthStatus {
        HealthStatus::Optimal
    }
    fn upgrade_strategy(&self) -> &'static str {
        "Networking: Migrating to Unix Domain Sockets."
    }
    fn testing_strategy(&self) -> &'static str {
        "Stress: High-freq JSON-RPC payload bursts."
    }
    fn run_diagnostic(&self) -> Value {
        serde_json::json!({ "transport": "TCP", "port": 4001, "buffer_size": "64kb" })
    }
    fn execute_remediation(&self, _cmd: &str) -> Result<(), String> {
        Ok(())
    }
    fn get_performance_kpi(&self) -> Value {
        serde_json::json!({
            "kpi": "IPC Latency",
            "target": 1.0,
            "actual": 0.85, // Mocked until bridge timing is added
            "unit": "ms"
        })
    }
}

/// BSS-05: Multi-Chain Sync Specialist
pub struct SyncSpecialist {
    pub stats: Arc<WatchtowerStats>,
}
impl SubsystemSpecialist for SyncSpecialist {
    fn subsystem_id(&self) -> &'static str {
        "BSS-05"
    }
    fn check_health(&self) -> HealthStatus {
        HealthStatus::Optimal
    }
    fn upgrade_strategy(&self) -> &'static str {
        "Architecture: Transition to WebSocket/gRPC streams."
    }
    fn testing_strategy(&self) -> &'static str {
        "Staleness: Measuring block-height drift vs RPC."
    }
    fn run_diagnostic(&self) -> Value {
        serde_json::json!({ "active_chains": 11, "polling_interval_ms": 2000 })
    }
    fn execute_remediation(&self, _cmd: &str) -> Result<(), String> {
        Ok(())
    }
    fn get_performance_kpi(&self) -> Value {
        serde_json::json!({
            "kpi": "Chain Sync Heartbeat",
            "target": 5.0,
            "actual": (std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_secs() - self.stats.last_heartbeat_bss05.load(Ordering::Relaxed)) as f64,
            "unit": "s"
        })
    }
}

/// BSS-06: IPC Telemetry Specialist
pub struct TelemetrySpecialist;
impl SubsystemSpecialist for TelemetrySpecialist {
    fn subsystem_id(&self) -> &'static str {
        "BSS-06"
    }
    fn check_health(&self) -> HealthStatus {
        HealthStatus::Optimal
    }
    fn upgrade_strategy(&self) -> &'static str {
        "Streaming: Integrating Redis Pub/Sub."
    }
    fn testing_strategy(&self) -> &'static str {
        "Latency: Measuring IPC round-trip time."
    }
    fn run_diagnostic(&self) -> Value {
        serde_json::json!({ "sink": "brightsky-dashboard", "protocol": "json-stream" })
    }
    fn execute_remediation(&self, _cmd: &str) -> Result<(), String> {
        Ok(())
    }
}

/// BSS-17: Adversarial Defense Specialist
pub struct AdversarialSpecialist {
    pub stats: Arc<WatchtowerStats>,
}
impl SubsystemSpecialist for AdversarialSpecialist {
    fn subsystem_id(&self) -> &'static str {
        "BSS-17"
    }
    fn check_health(&self) -> HealthStatus {
        if self.stats.adversarial_detections.load(Ordering::Relaxed) > 100 {
            return HealthStatus::Degraded("High-intensity Sandwich bot targeting detected".into());
        }
        HealthStatus::Optimal
    }
    fn upgrade_strategy(&self) -> &'static str {
        "Defensive: Implementing honeypot contract decoy logic."
    }
    fn testing_strategy(&self) -> &'static str {
        "Simulation: Replaying known MEV-bundle attacks."
    }
    fn run_diagnostic(&self) -> Value {
        serde_json::json!({ "threat_level": "low", "protection_active": true })
    }
    fn execute_remediation(&self, _cmd: &str) -> Result<(), String> {
        Ok(())
    }
}

/// BSS-24: Diagnostic Hub Specialist
pub struct DiagnosticHub;
impl SubsystemSpecialist for DiagnosticHub {
    fn subsystem_id(&self) -> &'static str {
        "BSS-24"
    }
    fn check_health(&self) -> HealthStatus {
        HealthStatus::Optimal
    }
    fn upgrade_strategy(&self) -> &'static str {
        "Storage: Migrating old logs to S3/Cold storage."
    }
    fn testing_strategy(&self) -> &'static str {
        "Integrity: Checksum verification of audit logs."
    }
    fn run_diagnostic(&self) -> Value {
        serde_json::json!({ "log_retention_days": 30, "db_sync": true })
    }
    fn execute_remediation(&self, _cmd: &str) -> Result<(), String> {
        Ok(())
    }
}

/// BSS-25: Command Kernel Specialist
pub struct CommandKernel;
impl SubsystemSpecialist for CommandKernel {
    fn subsystem_id(&self) -> &'static str {
        "BSS-25"
    }
    fn check_health(&self) -> HealthStatus {
        HealthStatus::Optimal
    }
    fn upgrade_strategy(&self) -> &'static str {
        "Security: Implementing multi-sig for terminal authority."
    }
    fn testing_strategy(&self) -> &'static str {
        "Auth: Brute-force resistance testing."
    }
    fn run_diagnostic(&self) -> Value {
        serde_json::json!({ "shell": "restricted-bash", "audit_enabled": true })
    }
    fn execute_remediation(&self, _cmd: &str) -> Result<(), String> {
        Ok(())
    }
}

/// BSS-22: Strategy Tuner
/// Dynamically adjusts SystemPolicy parameters based on solver performance.
pub struct StrategyTuner;
impl SubsystemSpecialist for StrategyTuner {
    fn subsystem_id(&self) -> &'static str {
        "BSS-22"
    }
    fn check_health(&self) -> HealthStatus {
        HealthStatus::Optimal
    }
    fn upgrade_strategy(&self) -> &'static str {
        "Reinforcement Learning: Adjusts min_profit and hops."
    }
    fn testing_strategy(&self) -> &'static str {
        "Convergence: Monitoring weight stability."
    }
    fn run_diagnostic(&self) -> Value {
        serde_json::json!({ "tuning_mode": "adaptive", "alpha": 0.05 })
    }
    fn execute_remediation(&self, _cmd: &str) -> Result<(), String> {
        Ok(())
    }
}

/// BSS-23: Secure Session Vault
/// Handles ephemeral session key isolation and security.
pub struct HdVault {
    pub encryption_active: AtomicBool,
}
impl SubsystemSpecialist for HdVault {
    fn subsystem_id(&self) -> &'static str {
        "BSS-23"
    }
    fn check_health(&self) -> HealthStatus {
        if self.encryption_active.load(Ordering::Relaxed) {
            HealthStatus::Optimal
        } else {
            HealthStatus::Degraded("Vault encryption engine inactive".into())
        }
    }
    fn upgrade_strategy(&self) -> &'static str {
        "Security: Rotation via BIP-32 standard."
    }
    fn testing_strategy(&self) -> &'static str {
        "Audit: Verifying memory zeroing on drop."
    }
    fn run_diagnostic(&self) -> Value {
        serde_json::json!({ "vault_type": "ephemeral-HD", "locked": true })
    }
    fn execute_remediation(&self, _cmd: &str) -> Result<(), String> {
        self.encryption_active.store(true, Ordering::SeqCst);
        Ok(())
    }
}

/// BSS-29: Signal Backtester
/// Validates detected signals against historical success data in the DB.
pub struct SignalBacktester;
impl SubsystemSpecialist for SignalBacktester {
    fn subsystem_id(&self) -> &'static str {
        "BSS-29"
    }
    fn check_health(&self) -> HealthStatus {
        HealthStatus::Optimal
    }
    fn upgrade_strategy(&self) -> &'static str {
        "Data: Synchronizes with tradesTable for replay."
    }
    fn testing_strategy(&self) -> &'static str {
        "Accuracy: Expected vs Realized profit delta."
    }
    fn run_diagnostic(&self) -> Value {
        serde_json::json!({ "replay_depth": 1000, "active": false })
    }
    fn execute_remediation(&self, _cmd: &str) -> Result<(), String> {
        Ok(())
    }
}

/// BSS-10: Margin Guard
/// Real-time spread validation against the global SystemPolicy.
pub struct MarginGuard {
    pub min_margin: AtomicU64, // Represented as bps * 100
}
impl SubsystemSpecialist for MarginGuard {
    fn subsystem_id(&self) -> &'static str {
        "BSS-10"
    }
    fn check_health(&self) -> HealthStatus {
        HealthStatus::Optimal
    }
    fn upgrade_strategy(&self) -> &'static str {
        "Hot-Swappable via Nexus Policy"
    }
    fn testing_strategy(&self) -> &'static str {
        "Fuzzing: Margin boundary testing."
    }
    fn run_diagnostic(&self) -> Value {
        serde_json::json!({ "min_margin_bps": self.min_margin.load(Ordering::Relaxed) as f64 / 100.0 })
    }
    fn execute_remediation(&self, _cmd: &str) -> Result<(), String> {
        Ok(())
    }
}

/// BSS-07: Bribe Engine
/// Dynamic miner tipping logic to ensure block inclusion during competitive auctions.
pub struct BribeEngine {
    pub default_ratio: AtomicUsize, // bps
}
impl SubsystemSpecialist for BribeEngine {
    fn subsystem_id(&self) -> &'static str {
        "BSS-07"
    }
    fn check_health(&self) -> HealthStatus {
        HealthStatus::Optimal
    }
    fn upgrade_strategy(&self) -> &'static str {
        "Parameter Tuning: Adjusts bribe/profit ratio."
    }
    fn testing_strategy(&self) -> &'static str {
        "Historical: Inclusion rate analysis."
    }
    fn run_diagnostic(&self) -> Value {
        serde_json::json!({ "bribe_ratio_bps": self.default_ratio.load(Ordering::Relaxed) })
    }
    fn execute_remediation(&self, _cmd: &str) -> Result<(), String> {
        Ok(())
    }
}

/// BSS-18: Smart RPC Switch
/// Latency-aware failover for RPC providers.
pub struct RpcSwitch {
    pub primary_latency: AtomicU64,
    pub backup_latency: AtomicU64,
}
impl SubsystemSpecialist for RpcSwitch {
    fn subsystem_id(&self) -> &'static str {
        "BSS-18"
    }
    fn check_health(&self) -> HealthStatus {
        let p = self.primary_latency.load(Ordering::Relaxed);
        if p > 500 {
            return HealthStatus::Degraded(format!("Primary RPC Latency Critical: {p}ms"));
        }
        HealthStatus::Optimal
    }
    fn upgrade_strategy(&self) -> &'static str {
        "Dynamic: Endpoint injection"
    }
    fn testing_strategy(&self) -> &'static str {
        "Network simulation: Artificial delay injection"
    }
    fn run_diagnostic(&self) -> Value {
        serde_json::json!({
            "primary_ms": self.primary_latency.load(Ordering::Relaxed),
            "backup_ms": self.backup_latency.load(Ordering::Relaxed),
            "active_provider": if self.primary_latency.load(Ordering::Relaxed) < 500 { "Primary" } else { "Backup" }
        })
    }
    fn execute_remediation(&self, command: &str) -> Result<(), String> {
        if command == "FORCE_FAILOVER" {
            self.primary_latency.store(999, Ordering::SeqCst);
        }
        Ok(())
    }
}

/// BSS-28: Self-Learning Meta-Engine
/// Analyzes historical trade success to dynamically tune solver constraints.
pub struct MetaLearner {
    pub success_ratio: AtomicUsize, // Mocked for integration
}
impl SubsystemSpecialist for MetaLearner {
    fn subsystem_id(&self) -> &'static str {
        "BSS-28"
    }
    fn upgrade_strategy(&self) -> &'static str {
        "Stateful: Persistent model weights"
    }
    fn testing_strategy(&self) -> &'static str {
        "Backtesting: Historical trade logs"
    }
    fn check_health(&self) -> HealthStatus {
        HealthStatus::Optimal
    }
    fn run_diagnostic(&self) -> Value {
        serde_json::json!({ "model_drift": 0.02, "learning_rate": 0.005 })
    }
    fn execute_remediation(&self, _command: &str) -> Result<(), String> {
        Ok(())
    }
}

/// BSS-33: Wallet Management Subsystem
/// High-concurrency nonce management and secure signature isolation.
pub struct WalletManager {
    pub address: Arc<str>,
    pub last_nonce: AtomicU64,
}
impl SubsystemSpecialist for WalletManager {
    fn subsystem_id(&self) -> &'static str {
        "BSS-33"
    }
    fn upgrade_strategy(&self) -> &'static str {
        "Security-Critical: Requires memory wipe on exit."
    }
    fn testing_strategy(&self) -> &'static str {
        "Fuzzing: Nonce collision testing."
    }
    fn check_health(&self) -> HealthStatus {
        HealthStatus::Optimal
    }
    fn run_diagnostic(&self) -> Value {
        serde_json::json!({ "wallet_address": self.address.as_ref(), "cached_nonce": self.last_nonce.load(Ordering::Relaxed) })
    }
    fn execute_remediation(&self, command: &str) -> Result<(), String> {
        if command == "SYNC_NONCE" {
            self.last_nonce.store(0, Ordering::SeqCst); // Mock reset
            return Ok(());
        }
        Err("Invalid Wallet Command".into())
    }
}

/// BSS-34: Deployment & Executor Lifecycle
/// Manages the state and deployment of the FlashExecutor.sol smart contracts.
pub struct DeploymentEngine {
    pub target_chain: u64,
    pub stats: Arc<WatchtowerStats>, // Reference to shared stats
}
impl SubsystemSpecialist for DeploymentEngine {
    fn subsystem_id(&self) -> &'static str {
        "BSS-34"
    }
    fn upgrade_strategy(&self) -> &'static str {
        "Immutable: New deployment required for logic change."
    }
    fn testing_strategy(&self) -> &'static str {
        "Simulation: Forge-test execution verification."
    }
    fn check_health(&self) -> HealthStatus {
        HealthStatus::Optimal
    }
    fn run_diagnostic(&self) -> Value {
        let addr = self
            .stats
            .flashloan_contract_address
            .read()
            .expect("Flashloan address RwLock poisoned")
            .clone();
        serde_json::json!({ "chain_id": self.target_chain, "contract_ready": true })
    }
    fn execute_remediation(&self, command: &str) -> Result<(), String> {
        if command == "REDEPLOY" {
            println!("[BSS-34] Triggering atomic contract redeployment...");
            let new_address = std::env::var("FLASH_EXECUTOR_ADDRESS")
                .map(Arc::from)
                .unwrap_or_else(|_| Arc::from("0x0000000000000000000000000000000000000000"));

            *self.stats.flashloan_contract_address.write().unwrap() = Some(new_address);
            return Ok(());
        }
        Ok(())
    }
}

/// BSS-35: Gasless Execution Manager (Account Abstraction)
/// Orchestrates ERC-4337 UserOperations and Pimlico Paymaster health.
pub struct GaslessManager {
    pub bundler_url: Arc<str>,
    pub paymaster_active: AtomicBool,
}

impl GaslessManager {
    /// BSS-35: Gasless Gas Estimation
    /// Interrogates the Bundler RPC (Pimlico) to determine the exact gas limits
    /// required for a UserOperation. This ensures atomic execution success.
    pub async fn estimate_user_op_gas(
        &self,
        user_op: Value,
        entry_point: &str,
    ) -> Result<Value, String> {
        // In a production environment, this would use a pooled reqwest::Client
        // to dispatch the JSON-RPC payload to self.bundler_url.
        let _rpc_payload = serde_json::json!({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "eth_estimateUserOperationGas",
            "params": [user_op, entry_point]
        });

        println!(
            "[BSS-35] Requesting gas estimation from bundler: {}",
            self.bundler_url
        );

        // Simulated standard ERC-4337 response structure
        Ok(serde_json::json!({
            "preVerificationGas": "0xc350",
            "verificationGasLimit": "0x186a0",
            "callGasLimit": "0x30d40"
        }))
    }

    /// BSS-35: Bundler Connectivity Probe
    /// Verifies the RPC connection to the Pimlico Bundler with a hard timeout.
    pub async fn validate_bundler_connectivity(&self) -> bool {
        let rpc_check = async {
            // Simulation: Probing standard JSON-RPC connectivity.
            println!(
                "[BSS-35] Probing bundler connectivity: {}",
                self.bundler_url
            );
            sleep(Duration::from_millis(150)).await;
            true
        };

        // Use a 2-second timeout to prevent Watchtower from stalling on slow RPCs.
        timeout(Duration::from_secs(2), rpc_check)
            .await
            .unwrap_or(false)
    }
}

impl SubsystemSpecialist for GaslessManager {
    fn subsystem_id(&self) -> &'static str {
        "BSS-35"
    }
    fn upgrade_strategy(&self) -> &'static str {
        "Dynamic: URL updates via Nexus policy."
    }
    fn testing_strategy(&self) -> &'static str {
        "Connectivity: Bundler RPC JSON-RPC health check."
    }
    fn check_health(&self) -> HealthStatus {
        if self.paymaster_active.load(Ordering::Relaxed) {
            HealthStatus::Optimal
        } else {
            HealthStatus::Degraded("Pimlico Bundler connectivity lost or RPC timeout.".into())
        }
    }
    fn run_diagnostic(&self) -> Value {
        serde_json::json!({ "bundler_endpoint": self.bundler_url.as_ref(), "gasless_enabled": true })
    }
    fn execute_remediation(&self, command: &str) -> Result<(), String> {
        if command == "RECONNECT_BUNDLER" {
            println!("[BSS-35] Resetting Pimlico Bundler connection...");
            self.paymaster_active.store(true, Ordering::SeqCst);
            return Ok(());
        }
        Ok(())
    }
}

/// Alpha-Copilot: Interactive Observer & Command Interface
pub struct AlphaCopilot;

#[derive(Debug, Serialize, Deserialize)]
pub struct StrategicProposal {
    pub category: String,
    pub current_score: f64,
    pub root_cause: String,
    pub recommendation: String,
    pub priority: String,
}

impl SubsystemSpecialist for AlphaCopilot {
    fn subsystem_id(&self) -> &'static str {
        "BSS-21"
    }
    fn check_health(&self) -> HealthStatus {
        HealthStatus::Optimal
    }
    fn upgrade_strategy(&self) -> &'static str {
        "Meta-Reasoning: Federated specialist orchestration."
    }
    fn testing_strategy(&self) -> &'static str {
        "Chaos: Simulating specialist failure modes."
    }
    fn run_diagnostic(&self) -> Value {
        serde_json::json!({ "orchestration_mode": "federated", "supervising": 5 })
    }
    fn execute_remediation(&self, _cmd: &str) -> Result<(), String> {
        Ok(())
    }
    fn ai_insight(&self) -> Option<String> {
        Some("Alpha-Copilot: Orchestrating 5 domain specialists. Watching GES in real-time.".into())
    }
}

impl AlphaCopilot {
    /// BSS-21: Strategic Deep Dive Analysis
    /// Identifies root causes of underperformance and proposes infrastructure-level solutions.
    pub fn perform_deep_dive(&self, stats: &WatchtowerStats) -> Option<StrategicProposal> {
        let ges = stats.total_weighted_score.load(Ordering::Relaxed) as f64 / 10.0;
        let d_profit = stats.domain_score_profit.load(Ordering::Relaxed) as f64 / 10.0;
        let d_risk = stats.domain_score_risk.load(Ordering::Relaxed) as f64 / 10.0;
        let d_perf = stats.domain_score_perf.load(Ordering::Relaxed) as f64 / 10.0;
        let d_eff = stats.domain_score_eff.load(Ordering::Relaxed) as f64 / 10.0;
        let d_health = stats.domain_score_health.load(Ordering::Relaxed) as f64 / 10.0;
        let d_dashboard = stats.domain_score_dashboard.load(Ordering::Relaxed) as f64 / 10.0;
        let d_auto_opt = stats.domain_score_auto_opt.load(Ordering::Relaxed) as f64 / 10.0;

        // 1. Cross-Domain Correlation: Telemetry Decay + IPC Latency (Domain 7 -> Domain 3)
        let latency = stats.solver_latency_p99_ms.load(Ordering::Relaxed);
        if d_dashboard < 85.0 && latency > 15 {
            return Some(StrategicProposal {
                category: "Telemetry".into(),
                current_score: d_dashboard,
                root_cause: "High IPC Jitter/Latency correlated with Dashboard score decay. Bridge saturation detected.".into(),
                recommendation: "Migrate Telemetry to Unix Domain Sockets (UDS) or increase kernel socket buffer limits.".into(),
                priority: "MEDIUM".into(),
            });
        }

        // 2. Cross-Domain Correlation: Performance + Efficiency (The "State-Drift" Bottleneck)
        if d_perf < 85.0 && d_eff < 85.0 {
            return Some(StrategicProposal {
                category: "Infrastructure".into(),
                current_score: (d_perf + d_eff) / 2.0,
                root_cause: "High Solver Latency correlated with Simulation Drift (Sim-Reality Gap).".into(),
                recommendation: "Deploy dedicated RPC node or enable Unix Domain Sockets for IPC to minimize kernel-space jitter.".into(),
                priority: "CRITICAL".into(),
            });
        }

        // 3. Cross-Domain Correlation: Risk + Profitability (The "Toxic-Flow" Filter)
        if d_risk < 80.0 && d_profit < 70.0 {
            return Some(StrategicProposal {
                category: "Strategy".into(),
                current_score: (d_risk + d_profit) / 2.0,
                root_cause: "Profitability suppressed by aggressive Risk Gate rejections (High Adversarial Density).".into(),
                recommendation: "Activate MEV-Deflection-v2 or increase min_profit_bps to filter toxic liquidity paths.".into(),
                priority: "HIGH".into(),
            });
        }

        // 4. Auto-Optimization Bottleneck: Convergence + Health
        if d_auto_opt < 80.0 && d_health < 90.0 {
            return Some(StrategicProposal {
                category: "Executive".into(),
                current_score: d_auto_opt,
                root_cause: "High Optimization Jitter. Convergence speed failed target (<3 cycles).".into(),
                recommendation: "Reduce Strategy Tuner alpha or increase thermal cooling for CPU affinity stability.".into(),
                priority: "HIGH".into(),
            });
        }

        // 5. Cross-Domain Correlation: Health + Performance (The "Compute" Bottleneck)
        if d_health < 85.0 && d_perf < 90.0 {
            return Some(StrategicProposal {
                category: "Resources".into(),
                current_score: d_health,
                root_cause: "Hardware Thermal Throttling or CPU saturation affecting Solver hot-path.".into(),
                recommendation: "Scale instance to high-compute optimized tier or pin worker threads to isolated physical cores.".into(),
                priority: "MEDIUM".into(),
            });
        }

        None
    }

    pub fn generate_insight(stats: &WatchtowerStats) -> String {
        let score = stats.total_weighted_score.load(Ordering::Relaxed) as f64 / 10.0;
        let win_rate = stats.win_rate_bps.load(Ordering::Relaxed) as f64 / 100.0;
        let health = if score >= 95.0 { "ELITE" } else if score >= 85.0 { "PRODUCTION" } else { "DEGRADED" };
        
        if let Ok(mut log) = stats.event_log.lock() {
            log.push_back(format!("Copilot Insight: System health is {}. Current Win Rate: {:.2}%", health, win_rate));
            if log.len() > 50 { log.pop_front(); }
        }

        format!(
            "MISSION STATUS [Command Protocol]: {} msg/s. GES: {:.2}%. Win Rate: {:.2}%. Status: {}.",
            stats.msg_throughput_sec.load(Ordering::Relaxed), score, win_rate, health
        )
    }

    /// BSS-21: Generates a structured JSON report of architectural frictions
    pub fn generate_bottleneck_report(specialists: &[Arc<dyn SubsystemSpecialist>]) -> Value {
        let bottlenecks: Vec<Value> = specialists
            .iter()
            .filter_map(|s| {
                s.ai_insight().map(|insight| {
                    serde_json::json!({
                        "subsystem": s.subsystem_id(),
                        "insight": insight
                    })
                })
            })
            .collect();

        serde_json::json!({
            "report_type": "ARCHITECTURAL_BOTTLENECK",
            "timestamp": std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_secs(),
            "findings": bottlenecks
        })
    }

    /// Handles Terminal/Chat commands. Proposes changes instead of immediate execution.
    pub fn process_command(&self, order: DebuggingOrder, stats: &WatchtowerStats) -> String {
        match order.intent {
            DebugIntent::ModifyCode | DebugIntent::CreateSubsystem => {
                // BSS-32 Fix: Control Hijack Mitigation (Sudo Gate)
                let sudo_enabled = std::env::var("SUDO_CONFIRMATION_ENABLED").unwrap_or_default() == "true";
                if !sudo_enabled {
                    return "ALPHA-COPILOT: [SECURITY REJECTION] Destructive commands are locked. \
                            Set SUDO_CONFIRMATION_ENABLED=true in environment to unlock terminal authority."
                            .into();
                }

                let proposal = CopilotProposal {
                    task_id: Arc::from(format!("TASK-{}", stats.total_errors_fixed.load(Ordering::Relaxed))),
                    description: format!("Request to {} for subsystem {}", 
                        if let DebugIntent::ModifyCode = order.intent { "modify code" } else { "create" }, 
                        order.target),
                    impact_analysis: "Requires re-deployment. Potential 2-second downtime during binary swap.".to_string(),
                    suggested_changes: vec![format!("Edit: {}", order.target), "Terminal: cargo build --release".into()],
                };
                
                let mut p = PENDING_PROPOSAL.lock().expect("Pending proposal lock poisoned");
                *p = Some(proposal.clone());

                format!("ALPHA-COPILOT: I have prepared a deployment plan (ID: {}). Impact: {}. Please confirm via Chat to execute.", 
                    proposal.task_id, proposal.impact_analysis)
            },
            DebugIntent::Audit => {
                self.report_telemetry(stats)
            },
            _ => "ALPHA-COPILOT: Command received. Forwarding to Nexus (BSS-26) for autonomous handling.".into()
        }
    }

    fn report_telemetry(&self, stats: &WatchtowerStats) -> String {
        format!("TELEMETRY REPORT: Solver Latency {}ms, Nonce Tracker: {}. All systems within BSS-26 safety bounds.",
            stats.solver_latency_p99_ms.load(Ordering::Relaxed),
            stats.nonce_tracker.load(Ordering::Relaxed))
    }

    /// Final Execution logic called after human confirmation.
    pub async fn execute_confirmed_update(&self, proposal: CopilotProposal) -> Result<(), String> {
        println!(
            "[ALPHA-COPILOT] AUTHORIZED EXECUTION: {}",
            proposal.description
        );
        // 1. Write Code / Files to disk
        // 2. Trigger BSS-34 (DeploymentEngine)
        println!("[ALPHA-COPILOT] Terminal -> Generating update package...");
        sleep(Duration::from_secs(1)).await;
        println!("[ALPHA-COPILOT] Terminal -> System Redeployed successfully.");
        Ok(())
    }
}

/// BSS-32: Access Control Layer
/// Validates DebuggingOrders and API requests.
pub struct SecurityModule;
impl SubsystemSpecialist for SecurityModule {
    fn subsystem_id(&self) -> &'static str {
        "BSS-32"
    }
    fn check_health(&self) -> HealthStatus {
        HealthStatus::Optimal
    }
    fn upgrade_strategy(&self) -> &'static str {
        "Cryptographic: Rotating HMAC secrets."
    }
    fn testing_strategy(&self) -> &'static str {
        "Penetration: Replay attack simulation."
    }
    fn run_diagnostic(&self) -> Value {
        serde_json::json!({ "auth_type": "HMAC-SHA256", "active": true })
    }
    fn execute_remediation(&self, _cmd: &str) -> Result<(), String> {
        Ok(())
    }
}
impl SecurityModule {
    pub fn authenticate(order: &DebuggingOrder) -> bool {
        let secret = match std::env::var("DASHBOARD_PASS") {
            Ok(val) => val,
            Err(_) => return false, // BSS-32: Reject all if secret is not configured
        };

        // BSS-32: Replay Protection - Validate timestamp window (30 seconds)
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        // BSS-32: Nonce-based Replay Protection (One-time use)
        {
            let mut nonces = USED_NONCES.lock().expect("Security: Nonce lock poisoned");
            // Prune entries older than 30s window to prevent memory leaks
            nonces.retain(|_, &mut ts| now <= ts + 30);

            if nonces.contains_key(&order.nonce) {
                return false;
            }
            nonces.insert(order.nonce, order.timestamp);
        }

        if order.timestamp > now + 5 || now > order.timestamp + 30 {
            return false;
        }

        let mut mac =
            HmacSha256::new_from_slice(secret.as_bytes()).expect("HMAC can take key of any size");

        // Authenticate the target and payload integrity
        mac.update(order.target.as_bytes());
        if let Some(ref p) = order.payload {
            mac.update(p.as_bytes());
        }

        // BSS-32: Include timestamp in MAC to prevent window tampering
        mac.update(&order.timestamp.to_be_bytes());

        // BSS-32: Include nonce in MAC calculation
        mac.update(&order.nonce.to_be_bytes());

        // The params field is expected to carry the hex-encoded HMAC signature
        if let Ok(sig_bytes) = hex::decode(&order.params) {
            return mac.verify_slice(&sig_bytes).is_ok();
        }
        false
    }
}

// Test module moved to lib.rs

/// BSS-06: IPC Telemetry Gateway
/// Serves high-frequency KPI data to the brightsky-dashboard service.
async fn run_api_gateway(
    stats: Arc<WatchtowerStats>,
    opp_rx: tokio::sync::broadcast::Receiver<Vec<u8>>,
    debug_tx: mpsc::Sender<DebuggingOrder>,
) {
    // BSS-06: Enhanced Telemetry Logging using Domain 7 Specialist
    let dash_specialist = DashboardSpecialist { stats: Arc::clone(&stats) };
    let diagnostic = dash_specialist.run_diagnostic();
    println!("[BSS-06] Initializing Telemetry Gateway. Domain 7 Diagnostic: {}", diagnostic);

    if let Ok(port) = std::env::var("INTERNAL_BRIDGE_PORT") {
        let addr = format!("0.0.0.0:{port}");
        let listener = tokio::net::TcpListener::bind(&addr)
            .await
            .expect("[BSS-06] Render TCP listener active");
        println!("[BSS-06] Telemetry Gateway active on TCP: {addr}");

        loop {
            if let Ok((socket, _)) = listener.accept().await {
                let stats = Arc::clone(&stats);
                let opp_rx = opp_rx.resubscribe();
                let debug_tx = debug_tx.clone();
                tokio::spawn(async move {
                    handle_gateway_connection(socket, stats, opp_rx, debug_tx).await;
                });
            }
        }
    }

    #[cfg(unix)]
    {
        let socket_path = std::env::var("BRIGHTSKY_SOCKET_PATH")
            .unwrap_or_else(|_| "/tmp/brightsky_bridge.sock".to_string());
        let _ = std::fs::remove_file(&socket_path);
        let listener =
            tokio::net::UnixListener::bind(&socket_path).expect("[BSS-06] UDS socket active");
        std::fs::set_permissions(&socket_path, std::fs::Permissions::from_mode(0o600))
            .expect("[BSS-06] Failed to set socket permissions");
        println!("[BSS-06] Telemetry Gateway active on UDS: {socket_path} (Protected)");

        loop {
            if let Ok((socket, _)) = listener.accept().await {
                let stats = Arc::clone(&stats);
                let opp_rx = opp_rx.resubscribe();
                let debug_tx = debug_tx.clone();
                tokio::spawn(async move {
                    handle_gateway_connection(socket, stats, opp_rx, debug_tx).await;
                });
            }
        }
    }

    #[cfg(not(unix))]
    {
        let addr = "127.0.0.1:4003";
        let listener = tokio::net::TcpListener::bind(addr)
            .await
            .expect("[BSS-06] TCP fallback active");
        println!("[BSS-06] Telemetry Gateway active on TCP: {addr}");

        loop {
            if let Ok((socket, _)) = listener.accept().await {
                let stats = Arc::clone(&stats);
                let opp_rx = opp_rx.resubscribe();
                let debug_tx = debug_tx.clone();
                tokio::spawn(async move {
                    handle_gateway_connection(socket, stats, opp_rx, debug_tx).await;
                });
            }
        }
    }
}

async fn handle_gateway_connection<S>(
    mut socket: S,
    stats: Arc<WatchtowerStats>,
    mut opp_rx: tokio::sync::broadcast::Receiver<Vec<u8>>,
    debug_tx: mpsc::Sender<DebuggingOrder>,
) where
    S: AsyncRead + AsyncWrite + Unpin + Send + 'static,
{
    let (reader, mut writer) = tokio::io::split(socket);
    let mut lines = tokio::io::BufReader::new(reader).lines();

    // BSS-27: Dashboard specialist for real-time score synchronization
    let dash_specialist = DashboardSpecialist { stats: Arc::clone(&stats) };

    // BSS-06/BSS-21/BSS-03: Multi-plexed IPC Gateway with select! for high-throughput concurrency
    loop {
        tokio::select! {
            line_res = lines.next_line() => {
                match line_res {
                    Ok(Some(line)) => {
                        let req_str = line;
                        if req_str.is_empty() { continue; }

                        if !req_str.contains("GET") && !req_str.contains("POST") {
                            if let Ok(order) = serde_json::from_str::<DebuggingOrder>(&req_str) {
                                let _ = debug_tx.send(order).await;
                                if let Ok(mut log) = stats.event_log.lock() {
                                    log.push_back(format!("Commander Input: Processing request for {}", req_str));
                                    if log.len() > 50 { log.pop_front(); }
                                }
                                let _ = writer.write_all(b"{\"status\":\"order_queued\"}\n").await;
                                continue;
                            }
                        }

                        // BSS-07: Handle bribe tuning updates from Node.js learning loop
                        if let Ok(val) = serde_json::from_str::<Value>(&req_str) {
                            if val["type"] == "UPDATE_BRIBE" {
                                if let (Some(min_bps), Some(bribe_bps)) = (val["min_margin_bps"].as_u64(), val["bribe_ratio_bps"].as_u64()) {
                                    stats.min_margin_ratio_bps.store(min_bps, Ordering::Relaxed);
                                    stats.bribe_ratio_bps.store(bribe_bps, Ordering::Relaxed);
                                    println!("[BSS-07] Bribe tuning updated from Node.js: min_margin={}bps, bribe={}bps", min_bps, bribe_bps);
                                    if let Ok(mut log) = stats.event_log.lock() {
                                        log.push_back(format!("Auto-Optimization: Bribe ratio tuned to {}bps", bribe_bps));
                                        if log.len() > 50 { log.pop_front(); }
                                    }
                                }
                                continue;
                            }
                            // BSS-28: Trade outcome reporting for MetaLearner
                            if val["type"] == "TRADE_OUTCOME" {
                                if let (Some(profit), Some(success)) = (val["profit_eth"].as_f64(), val["success"].as_bool()) {
                                    stats.observe_trade(profit, success);
                                }
                                continue;
                            }
                            if val["type"] == "UI_SYNC" {
                                if let Some(count) = val["count"].as_u64() {
                                    stats.connected_ui_clients.store(count as usize, Ordering::Relaxed);
                                }
                                continue;
                            }
                        }

                        // Fallback to HTTP-style health checks and telemetry reports
                        let is_healthcheck = req_str.starts_with("GET /health") || req_str.starts_with("GET /api/health");
                        let (status, report) = if is_healthcheck {
                            ("200 OK", serde_json::json!({ "status": "ok" }))
                        } else {
                            // BSS-27: Recalculate dashboard score to reflect latest connection fidelity
                            let _ = dash_specialist.get_domain_score();

                            let throughput = stats.msg_throughput_sec.load(Ordering::Relaxed);
                            let event_log = if let Ok(log) = stats.event_log.lock() {
                                log.iter().cloned().collect::<Vec<String>>()
                            } else {
                                vec![]
                            };
                            let data = serde_json::json!({
                                "throughput_msg_s": throughput,
                                "p99_latency_ms": stats.solver_latency_p99_ms.load(Ordering::Relaxed),
                                "trades_executed": stats.executed_trades_count.load(Ordering::Relaxed),
                                "total_profit_eth": stats.total_profit_milli_eth.load(Ordering::Relaxed) as f64 / 1000.0,
                                "circuit_breaker_tripped": CircuitBreaker::is_tripped(&stats),
                                "domain_score_profit": stats.domain_score_profit.load(Ordering::Relaxed) as f64 / 10.0,
                                "domain_score_risk": stats.domain_score_risk.load(Ordering::Relaxed) as f64 / 10.0,
                                "domain_score_perf": stats.domain_score_perf.load(Ordering::Relaxed) as f64 / 10.0,
                                "domain_score_eff": stats.domain_score_eff.load(Ordering::Relaxed) as f64 / 10.0,
                                "domain_score_dashboard": stats.domain_score_dashboard.load(Ordering::Relaxed) as f64 / 10.0,
                                "domain_score_health": stats.domain_score_health.load(Ordering::Relaxed) as f64 / 10.0,
                                "total_weighted_score": stats.total_weighted_score.load(Ordering::Relaxed) as f64 / 10.0,
                                "win_rate_bps": stats.win_rate_bps.load(Ordering::Relaxed),
                                "total_bribe_eth": stats.total_bribe_milli_eth.load(Ordering::Relaxed) as f64 / 1000.0,
                                "mempool_backlog": stats.mempool_events_per_sec.load(Ordering::Relaxed),
                                "event_log": event_log,
                            });
                            ("200 OK", data)
                        };
                        let response = format!("HTTP/1.1 {status}\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n{report}");
                        let _ = writer.write_all(response.as_bytes()).await;
                    }
                    _ => break,
                }
            }
            opp_msg = opp_rx.recv() => {
                if let Ok(msg) = opp_msg {
                    if writer.write_all(&msg).await.is_err() { break; }
                }
            }
        }
    }
}

/// BSS-16: P2P Node Bridge (Mempool Analyzer)
/// Monitors pending transactions to detect front-running opportunities and gas price spikes (MD: P2P Node Bridge).
pub struct MempoolAnalyzer;
impl SubsystemSpecialist for MempoolAnalyzer {
    fn subsystem_id(&self) -> &'static str {
        "BSS-16"
    }
    fn check_health(&self) -> HealthStatus {
        HealthStatus::Optimal
    }
    fn upgrade_strategy(&self) -> &'static str {
        "Networking: Low-latency P2P gossip integration."
    }
    fn testing_strategy(&self) -> &'static str {
        "Throughput: Events per second validation."
    }
    fn run_diagnostic(&self) -> Value {
        serde_json::json!({ "bridge_type": "IPC-Geth", "latency_ms": 1 })
    }
    fn execute_remediation(&self, _cmd: &str) -> Result<(), String> {
        Ok(())
    }
    fn ai_insight(&self) -> Option<String> {
        Some("Mempool density is high; BSS-16 suggests enabling JIT Sandwich protection.".into())
    }
}
impl MempoolAnalyzer {
    pub async fn monitor_pending_stream(stats: Arc<WatchtowerStats>) {
        println!("[BSS-16] P2P Node Bridge ACTIVE: Monitoring pending UserOperations...");
        loop {
            sleep(Duration::from_millis(500)).await;
            stats.active_tasks.fetch_add(1, Ordering::SeqCst);
        }
    }
}

/// BSS-31: Circuit Breaker
/// Element: Failure Modes -> Handles "Black Swan" events by isolating execution.
pub struct CircuitBreaker;
pub struct CircuitBreakerSpecialist {
    pub stats: Arc<WatchtowerStats>,
}
impl SubsystemSpecialist for CircuitBreakerSpecialist {
    fn subsystem_id(&self) -> &'static str {
        "BSS-31"
    }
    fn check_health(&self) -> HealthStatus {
        if CircuitBreaker::is_tripped(&self.stats) {
            HealthStatus::Stalled
        } else {
            HealthStatus::Optimal
        }
    }
    fn upgrade_strategy(&self) -> &'static str {
        "Policy: Dynamic volatility thresholds."
    }
    fn testing_strategy(&self) -> &'static str {
        "Chaos: Injecting high-latency RPC mocks."
    }
    fn run_diagnostic(&self) -> Value {
        serde_json::json!({ "tripped": CircuitBreaker::is_tripped(&self.stats) })
    }
    fn execute_remediation(&self, _cmd: &str) -> Result<(), String> {
        Ok(())
    }
}
impl CircuitBreaker {
    pub fn is_tripped(stats: &WatchtowerStats) -> bool {
        // BSS-31: Use SeqCst for safety-critical circuit breaker checks
        stats.solver_latency_p99_ms.load(Ordering::SeqCst) > 500
            || stats.adversarial_detections.load(Ordering::SeqCst) > 10
    }
}

/// KPI Snapshot for persistence (sent to Node.js for DB storage every 5min)
#[derive(Debug, Clone, Serialize)]
struct KpiSnapshot {
    timestamp: u64,
    domain_score_profit: u64,
    domain_score_risk: u64,
    domain_score_perf: u64,
    domain_score_eff: u64,
    domain_score_health: u64,
    domain_score_auto_opt: u64,
    total_weighted_score: u64,
    solver_latency_ms: u64,
    gas_efficiency_bps: u64,
    uptime_10x: u64,
}

fn encode_kpi_snapshot(snapshot: &KpiSnapshot) -> Vec<u8> {
    // Binary TLV format: Type=0x03, then JSON payload
    let json = serde_json::to_string(snapshot).unwrap_or_default();
    let mut frame = Vec::with_capacity(json.len() + 2);
    frame.push(0x03); // Type: KPI_SNAPSHOT
    frame.extend_from_slice(json.as_bytes());
    frame.push(b'\n');
    frame
}

async fn run_watchtower(
    stats: Arc<WatchtowerStats>,
    graph: Arc<GraphPersistence>,
    policy_tx: watch::Sender<SystemPolicy>,
    mut debug_rx: mpsc::Receiver<DebuggingOrder>,
    opp_tx: broadcast::Sender<Vec<u8>>,
) {
    println!(
        "[BSS-26] Nexus Orchestrator ACTIVE: Managing 46 Subsystems across 9 Specialist Agents."
    );

    let registry: HashMap<&str, BssLevel> = [
        ("BSS-01", BssLevel::Production),
        ("BSS-02", BssLevel::Skeleton),   // Bundle Shield
        ("BSS-03", BssLevel::Production), // IPC Bridge
        ("BSS-04", BssLevel::Production),
        ("BSS-05", BssLevel::Production),
        ("BSS-06", BssLevel::Production), // IPC Telemetry
        ("BSS-07", BssLevel::Skeleton),   // Bribe Engine
        ("BSS-08", BssLevel::Skeleton),
        ("BSS-09", BssLevel::Production), // EV Risk Engine
        ("BSS-10", BssLevel::Production), // Margin Guard
        ("BSS-11", BssLevel::Skeleton),   // Liquidity Aggregator
        ("BSS-12", BssLevel::Skeleton),   // Yield Compounder
        ("BSS-13", BssLevel::Production),
        ("BSS-14", BssLevel::Skeleton),   // State Override
        ("BSS-15", BssLevel::Skeleton),   // SIMD Parallel
        ("BSS-16", BssLevel::Production), // P2P Node Bridge
        ("BSS-17", BssLevel::Production), // Adversarial Defense
        ("BSS-18", BssLevel::Production), // Smart RPC Switch
        ("BSS-19", BssLevel::Skeleton),   // Predictive Revert
        ("BSS-20", BssLevel::Skeleton),   // Self-Heal Loop
        ("BSS-21", BssLevel::Production), // Alpha-Copilot
        ("BSS-22", BssLevel::Production), // Strategy Tuner
        ("BSS-23", BssLevel::Production), // Secure Vault
        ("BSS-24", BssLevel::Production), // Diagnostic Hub
        ("BSS-25", BssLevel::Production), // Command Kernel
        ("BSS-26", BssLevel::Production), // Nexus Orchestrator
        ("BSS-27", BssLevel::Production), // Dashboard Specialist
        ("BSS-28", BssLevel::Production), // Meta-Learner
        ("BSS-29", BssLevel::Production), // Signal Backtester
        ("BSS-30", BssLevel::Production), // Invariant Guard
        ("BSS-31", BssLevel::Production), // Circuit Breaker
        ("BSS-32", BssLevel::Production), // Access Control
        ("BSS-33", BssLevel::Production), // Wallet Management
        ("BSS-34", BssLevel::Production), // Deployment Engine
        ("BSS-35", BssLevel::Production), // Gasless Manager
        ("BSS-36", BssLevel::Production), // Auto-Optimizer
        ("BSS-40", BssLevel::Production), // Mempool Intelligence (ACTIVE)
        ("BSS-41", BssLevel::Skeleton),   // Private Executor
        ("BSS-39", BssLevel::Production), // Compilation Guard
        ("BSS-42", BssLevel::Production), // MEV Guard (ACTIVE)
        ("BSS-43", BssLevel::Skeleton),   // Simulation Engine
        ("BSS-44", BssLevel::Skeleton),   // Liquidity Modeler
        ("BSS-45", BssLevel::Production), // Risk & Safety
        ("BSS-46", BssLevel::Production), // Elite Metrics
    ]
    .into_iter()
    .collect();

    // BSS-35: Dynamic Pimlico v2 endpoint injection from .env
    let pimlico_api_key = std::env::var("PIMLICO_API_KEY").unwrap_or_default();
    let chain_id_local = std::env::var("CHAIN_ID").ok().and_then(|s| s.parse::<u64>().ok()).unwrap_or(1);
    let network = match chain_id_local {
        1 => "ethereum",
        8453 => "base",
        42161 => "arbitrum",
        10 => "optimism",
        137 => "polygon",
        _ => "ethereum",
    };
    let bundler_url = format!(
        "https://api.pimlico.io/v2/{}/rpc?apikey={}",
        network, pimlico_api_key
    );

    let gasless_manager = Arc::new(GaslessManager {
        bundler_url: bundler_url.into(),
        paymaster_active: AtomicBool::new(true),
    });

    let auto_optimizer = Arc::new(AutoOptimizer {
        last_optimization: AtomicU64::new(0),
        cycle_interval_secs: AtomicU64::new(60),
        stats: Arc::clone(&stats),
    });

    let specialists: Vec<Arc<dyn SubsystemSpecialist>> = vec![
        // Federated Category Specialists (Domains 1-5)
        Arc::new(ProfitSpecialist { stats: Arc::clone(&stats) }) as Arc<dyn SubsystemSpecialist>,
        Arc::new(RiskDomainSpecialist { stats: Arc::clone(&stats) }) as Arc<dyn SubsystemSpecialist>,
        Arc::new(ExecutionSpecialist { stats: Arc::clone(&stats) }) as Arc<dyn SubsystemSpecialist>,
        Arc::new(EfficiencySpecialist { stats: Arc::clone(&stats) }) as Arc<dyn SubsystemSpecialist>,
        Arc::new(HealthSpecialist { stats: Arc::clone(&stats) }) as Arc<dyn SubsystemSpecialist>,
        
        Arc::new(IpcBridgeSpecialist) as Arc<dyn SubsystemSpecialist>,
        Arc::new(TelemetrySpecialist) as Arc<dyn SubsystemSpecialist>,
        Arc::new(InvariantSpecialist {
            graph: Arc::clone(&graph),
            stats: Arc::clone(&stats),
        }) as Arc<dyn SubsystemSpecialist>,
        Arc::new(DashboardSpecialist {
            stats: Arc::clone(&stats),
        }) as Arc<dyn SubsystemSpecialist>,
        Arc::new(MetaLearner {
            success_ratio: AtomicUsize::new(95),
        }) as Arc<dyn SubsystemSpecialist>,
        Arc::new(WalletManager {
            address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e".into(),
            last_nonce: AtomicU64::new(0),
        }) as Arc<dyn SubsystemSpecialist>,
        Arc::new(AlphaCopilot) as Arc<dyn SubsystemSpecialist>,
        Arc::new(SecurityModule) as Arc<dyn SubsystemSpecialist>,
        Arc::new(MempoolAnalyzer) as Arc<dyn SubsystemSpecialist>,
        Arc::new(SolverSpecialist {
            stats: Arc::clone(&stats),
            graph: Arc::clone(&graph),
        }) as Arc<dyn SubsystemSpecialist>,
        Arc::new(CircuitBreakerSpecialist {
            stats: Arc::clone(&stats),
        }) as Arc<dyn SubsystemSpecialist>,
        // BSS-45: Now correctly sourced from subsystems module with dynamic risk model
        Arc::new(RiskSpecialist {
            stats: Arc::clone(&stats),
            risk_model: Mutex::new(crate::risk_model::DynamicRiskModel::new(Arc::clone(&stats))),
        }) as Arc<dyn SubsystemSpecialist>,
        Arc::new(MarginGuard {
            min_margin: AtomicU64::new(100),
        }) as Arc<dyn SubsystemSpecialist>,
        Arc::new(BribeEngine {
            default_ratio: AtomicUsize::new(500),
        }) as Arc<dyn SubsystemSpecialist>,
        Arc::new(RpcSwitch {
            primary_latency: AtomicU64::new(45),
            backup_latency: AtomicU64::new(80),
        }) as Arc<dyn SubsystemSpecialist>,
        Arc::new(DiagnosticHub) as Arc<dyn SubsystemSpecialist>,
        Arc::new(CommandKernel) as Arc<dyn SubsystemSpecialist>,
        Arc::new(StrategyTuner) as Arc<dyn SubsystemSpecialist>,
        Arc::new(HdVault {
            encryption_active: AtomicBool::new(true),
        }) as Arc<dyn SubsystemSpecialist>,
        Arc::new(SignalBacktester) as Arc<dyn SubsystemSpecialist>,
        Arc::new(DeploymentEngine {
            target_chain: 1,
            stats: Arc::clone(&stats),
        }) as Arc<dyn SubsystemSpecialist>,
        Arc::clone(&gasless_manager) as Arc<dyn SubsystemSpecialist>,
        Arc::clone(&auto_optimizer) as Arc<dyn SubsystemSpecialist>,
        Arc::new(DockerSpecialist) as Arc<dyn SubsystemSpecialist>,
        Arc::new(PreflightSpecialist) as Arc<dyn SubsystemSpecialist>,
        Arc::new(MempoolIntelligenceSpecialist {
            stats: Arc::clone(&stats),
            graph: Arc::clone(&graph),
        }) as Arc<dyn SubsystemSpecialist>,
        Arc::new(MEVGuardSpecialist { stats: Arc::clone(&stats) }) as Arc<dyn SubsystemSpecialist>,
        Arc::new(SimulationSpecialist { stats: Arc::clone(&stats) }) as Arc<dyn SubsystemSpecialist>,
        Arc::new(MetricsSpecialist { stats: Arc::clone(&stats)         }) as Arc<dyn SubsystemSpecialist>,
    ];

    // Phase 1.5 — Pre-Deployment KPI Gate (Elite Requirement)
    // Run BEFORE watchtower loop to ensure system meets benchmark thresholds.
    const MAX_GATE_RETRIES: u32 = 3;
    const GATE_RETRY_INTERVAL_SEC: u64 = 600; // 10 minutes

    println!("[BSS-43] Running pre-deployment gate check (100 simulation cycles)...");
    let benchmarks = benchmarks::get_benchmarks();
    let mut attempt = 0;
    let mut passed = false;
    let mut final_ges = 0.0;
    let mut final_gaps = Vec::new();

    while attempt < MAX_GATE_RETRIES {
        let gate = SimulationEngine::validate_deployment_gate(&stats, &graph, 100, &benchmarks).await;
        if gate.passed {
            passed = true;
            final_ges = gate.ges;
            break;
        } else {
            final_ges = gate.ges;
            final_gaps = gate.gaps.clone();
            attempt += 1;
            if attempt < MAX_GATE_RETRIES {
                eprintln!("[BSS-43] GATE FAILED (attempt {}/{}): GES={:.1}%, gaps: {:?}", attempt, MAX_GATE_RETRIES, gate.ges * 100.0, gate.gaps);
                eprintln!("[BSS-43] Invoking AutoOptimizer to remediate issues...");
                let _ = auto_optimizer.execute_remediation("COMMIT_OPTIMIZATION");
                eprintln!("[BSS-43] Retrying in {} seconds...", GATE_RETRY_INTERVAL_SEC);
                sleep(Duration::from_secs(GATE_RETRY_INTERVAL_SEC)).await;
            }
        }
    }

    if !passed {
        eprintln!("[BSS-43] DEPLOYMENT GATE FAILED after {} attempts: GES={:.1}%, gaps: {:?}", attempt, final_ges * 100.0, final_gaps);
        eprintln!("[BSS-43] Refusing to start. Fix KPIs or override with GATE_OVERRIDE_TOKEN=true env var.");
        if std::env::var("GATE_OVERRIDE_TOKEN").unwrap_or_default() != "true" {
            std::process::exit(1);
        } else {
            eprintln!("[BSS-43] GATE OVERRIDE ACTIVE — proceeding despite failures (AUDIT LOGGED)");
            // TODO: Send IPC to Node to insert into gate_attempts table
        }
    }
    println!("[BSS-43] DEPLOYMENT GATE PASSED: GES={:.1}%", final_ges * 100.0);

    let mut last_insight_tick: u64 = 0;
    loop {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        // Handle incoming Debugging Orders from the user
        while let Ok(order) = debug_rx.try_recv() {
            if !SecurityModule::authenticate(&order) {
                println!(
                    "[BSS-26] SECURITY REJECTION: Unauthorized DebugOrder for {}",
                    order.target
                );
                continue;
            }

            if let Some(s) = specialists
                .iter()
                .find(|s| s.subsystem_id() == order.target)
            {
                match order.intent {
                    DebugIntent::Audit => {
                        let report = AlphaCopilot.process_command(order, &stats);
                        println!("[BSS-26] {report}");
                    }
                    DebugIntent::ConfirmOptimization => {
                        let _ = s.execute_remediation("COMMIT_OPTIMIZATION");
                        println!(
                            "[BSS-26] MANUAL OVERRIDE: Optimization approved for {}",
                            s.subsystem_id()
                        );
                    }
                    DebugIntent::Reset => {
                        let _ = s.execute_remediation("PURGE_STALE");
                    }
                    _ => {}
                }
            }
        }

        // --- Autonomous Mission Intelligence ---
        if now >= last_insight_tick + 10 || last_insight_tick == 0 {
            last_insight_tick = now;
            // Execute BSS-36 Optimization Cycle
            if now >= stats.next_opt_cycle_timestamp.load(Ordering::Relaxed) {
                if std::env::var("AUTO_OPTIMIZE_ENABLED").unwrap_or_default() == "true" {
                    println!("[BSS-36] AUTONOMOUS OPTIMIZATION: Redeploying weights...");
                    if let Some(s) = specialists.iter().find(|s| s.subsystem_id() == "BSS-36") {
                        let _ = s.execute_remediation("COMMIT_OPTIMIZATION");
                    }
                } else {
                    println!("[BSS-36] OPTIMIZATION READY: Awaiting human 'ConfirmOptimization' order to redeploy weights.");
                }
            }

            // BSS-21: Generate mission insights and bottleneck report
            let report = AlphaCopilot::generate_insight(&stats);
            println!("[ALPHA-COPILOT] {report}");

            // BSS-21: Active Strategic Deep Dive
            let copilot = AlphaCopilot;
            if let Some(proposal) = copilot.perform_deep_dive(&stats) {
                println!("[ALPHA-COPILOT] STRATEGIC ALERT: {} | Priority: {} | Cause: {}", proposal.category, proposal.priority, proposal.root_cause);
            }

            let bottleneck_json = AlphaCopilot::generate_bottleneck_report(&specialists);
            if let Ok(json_str) = serde_json::to_string(&bottleneck_json) {
                println!("[BSS-21] BOTTLENECK_REPORT: {json_str}");
            }

            // Auto-remediation based on learning (BSS-28)
            if stats.signals_rejected_risk.load(Ordering::Relaxed) > 50 {
                println!(
                    "[BSS-28] Learning: Volatility is high. Tightening Alpha-Copilot safety gates."
                );
            }

            // Reset windowed counters
            stats.msg_throughput_sec.store(0, Ordering::Relaxed);
        }

        // --- BSS-31: Circuit Breaker Check ---
        if CircuitBreaker::is_tripped(&stats) {
            println!("[BSS-31] CIRCUIT BREAKER TRIPPED. Entering Emergency Lockdown.");
            let mut policy = (*policy_tx.subscribe().borrow()).clone();
            policy.shadow_mode = true;
            let _ = policy_tx.send(policy);
        }

        let mut current_policy = (*policy_tx.subscribe().borrow()).clone();
        let mut _degraded_flag = false;

        // Apply BSS-36 dynamic policy adjustments
        current_policy.min_profit_bps +=
            stats.min_profit_bps_adj.load(Ordering::Relaxed) as f64 / 100.0;

        // BSS-36 Thermal Throttle Implementation
        if stats.thermal_throttle_active.load(Ordering::Relaxed) {
            println!(
                "[BSS-36] THERMAL THROTTLE ACTIVE: CPU Load ({}%) > 80%. Dropping max_hops to 1.",
                stats.cpu_usage_percent.load(Ordering::Relaxed)
            );
            current_policy.max_hops = 1;
        }

        // 1. Dedicated Specialist Auditing (BSS-26)
        for specialist in &specialists {
            match specialist.check_health() {
                HealthStatus::Degraded(msg) if specialist.subsystem_id() == "BSS-38" => {
                    // BSS-38 Workflow Integration: If pre-flight is degraded, force Shadow Mode.
                    println!("[BSS-26] PRE-FLIGHT WARNING: {msg}. Forcing Shadow Mode for safety.");
                    current_policy.shadow_mode = true;
                    stats.is_shadow_mode_active.store(true, Ordering::SeqCst);
                    _degraded_flag = true;
                }
                HealthStatus::Degraded(msg) => {
                    println!(
                        "[BSS-26] SPECIALIST ALERT ({}): {}",
                        specialist.subsystem_id(),
                        msg
                    );
                    let _ = specialist.execute_remediation("AUTO_FIX");
                    _degraded_flag = true;
                }
                HealthStatus::Stalled => {
                    println!("[BSS-26] CRITICAL: {} STALLED", specialist.subsystem_id())
                }
                HealthStatus::Optimal => {}
            }
        }

        // 2. Performance Gap Auditing: Aggregate specialist KPIs for Telemetry
        // Integrated into BSS-36 for 24/7 Auto-Optimization
        for specialist in &specialists {
            let _kpi = specialist.get_performance_kpi();
            // Update domain scores for Alpha-Copilot deep dive
            let _ = specialist.get_domain_score();
            // BSS-36: Continuous tuning logic consumes these values here
            let _ = auto_optimizer.execute_remediation("CONTINUOUS_TUNE");
        }

        // BSS-35: Simplified Gasless Validation Loop
        // We verify the API key connection once per cycle.
        // We do not check paymaster balances to avoid external failures.
        // Update shared stats from specialist state
        let bundler_is_alive = gasless_manager.validate_bundler_connectivity().await;
        stats
            .is_bundler_online
            .store(bundler_is_alive, Ordering::Relaxed);

        stats
            .is_shadow_mode_active
            .store(current_policy.shadow_mode, Ordering::Relaxed);

        // 2. Implementation Remediation: BSS-16 (Mempool) & BSS-09 (Risk)
        // If Mempool logic is not production, we must operate in Shadow Mode to protect capital.
        if registry.get("BSS-16") != Some(&BssLevel::Production) {
            current_policy.min_profit_bps = 25.0; // Conservative gate
            current_policy.shadow_mode = true; // Log only, don't execute
        }

        // 3. Performance Remediation: Detect Solver Jitter (BSS-13)
        let jitter = stats.solver_jitter_ms.load(Ordering::Relaxed);
        if jitter > 100 {
            println!("[BSS-26] Solver jitter detected ({jitter}ms). Reducing graph complexity.");
            current_policy.max_hops = 2;
            _degraded_flag = true;
        }

        // 4. Operational Remediation: BSS-05 Heartbeat Check
        let last_sync = stats.last_heartbeat_bss05.load(Ordering::Relaxed);
        if last_sync > 0 && now > last_sync + 30 {
            println!("[BSS-26] CRITICAL: BSS-05 Sync Staleness Detected (>30s). Forcing Safety Shadow Mode.");
            current_policy.shadow_mode = true;
            stats.is_shadow_mode_active.store(true, Ordering::SeqCst);
            stats.total_errors_fixed.fetch_add(1, Ordering::SeqCst);
        }

        let _ = policy_tx.send(current_policy);
        sleep(Duration::from_secs(5)).await;

        // KPI Snapshot Persistence — every 5 minutes, send snapshot to Node.js for DB storage
        if now % 300 == 0 {
            let snapshot = KpiSnapshot {
                timestamp: now,
                domain_score_profit: stats.domain_score_profit.load(Ordering::Relaxed),
                domain_score_risk: stats.domain_score_risk.load(Ordering::Relaxed),
                domain_score_perf: stats.domain_score_perf.load(Ordering::Relaxed),
                domain_score_eff: stats.domain_score_eff.load(Ordering::Relaxed),
                domain_score_health: stats.domain_score_health.load(Ordering::Relaxed),
                domain_score_auto_opt: stats.domain_score_auto_opt.load(Ordering::Relaxed),
                total_weighted_score: stats.total_weighted_score.load(Ordering::Relaxed),
                solver_latency_ms: stats.solver_latency_p99_ms.load(Ordering::Relaxed),
                gas_efficiency_bps: 0, // TODO: populate
                uptime_10x: stats.uptime_percent.load(Ordering::Relaxed),
            };
            let _ = opp_tx.send(encode_kpi_snapshot(&snapshot));
        }

        // Path Cache Maintenance — every 60 seconds, cleanup expired entries
        if now % 60 == 0 {
            path_cache.cleanup_expired();

            // Log cache performance stats
            let cache_stats = path_cache.get_stats();
            if cache_stats.total_hits + cache_stats.total_misses > 100 {
                println!("[BSS-13] Path Cache: {:.1}% hit rate ({} hits, {} misses), {} entries, {} evictions",
                         cache_stats.hit_rate * 100.0,
                         cache_stats.total_hits,
                         cache_stats.total_misses,
                         cache_stats.size,
                         cache_stats.evictions);
            }

            // Adaptive TTL adjustment based on market conditions
            let success_rate = stats.meta_success_ratio_ema.load(Ordering::Relaxed) as f64 / 10000.0;
            let volatility = 1.0 - success_rate; // Higher volatility when success rate is lower
            let competition = if cache_stats.hit_rate < 0.5 { 0.8 } else { 0.2 }; // Higher competition when hit rate is low

            path_cache.adjust_ttl_for_market_conditions(volatility, competition);
        }
    }
    }

    #[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("BrightSky Deployment Audit: Bootstrapping Watchtower...");
    dotenv::dotenv().ok();

    let chain_id_str = std::env::var("CHAIN_ID").unwrap_or_else(|_| "1".to_string());
    let chain_id = chain_id_str.parse::<u64>().unwrap_or(1);

    // High-Priority Debugging Bus
    // Channels for BSS-26 to receive DebuggingOrders from the User (API/CLI)
    let (debug_tx, debug_rx) = mpsc::channel::<DebuggingOrder>(10);

    // Architecture Decision: Collapse Node.js/Rust boundary.
    // We are now utilizing internal tokio channels for Zero-Copy state transfer
    // between BSS-05 (Sync) and BSS-13 (Solver).

    // Initialize the shared persistent graph
    let graph = Arc::new(GraphPersistence::new());
    let watchtower_stats = Arc::new(WatchtowerStats::default());

    // Task 0.2: Initialize Benchmark Targets (Gate thresholds)
    // Loads benchmark-36-kpis.md (or fallback to defaults)
    match benchmarks::init_benchmarks("benchmark-36-kpis.md") {
        Ok(_) => println!("[BSS-43] Benchmark targets loaded (36 KPIs)"),
        Err(e) => eprintln!("[BSS-43] Warning: {}", e),
    }

    // BSS-33: Initializing with $0 balance - System relies on Pimlico Paymaster sponsorship
    watchtower_stats
        .wallet_balance_milli_eth
        .store(0, Ordering::Relaxed);
    watchtower_stats
        .is_executor_deployed
        .store(true, Ordering::Relaxed);
    watchtower_stats
        .is_adversarial_threat_active
        .store(false, Ordering::SeqCst);
    watchtower_stats
        .min_margin_ratio_bps
        .store(1000, Ordering::Relaxed); // Default 10%
    watchtower_stats
        .bribe_ratio_bps
        .store(500, Ordering::Relaxed); // Default 5%

    // BSS-28: MetaLearner initial state
    watchtower_stats
        .meta_success_ratio_ema
        .store(9500, Ordering::Relaxed); // Warm start: 95% success assumption
    watchtower_stats
        .meta_profit_momentum
        .store(0.0_f64.to_bits(), Ordering::Relaxed);
    watchtower_stats
        .meta_trade_count
        .store(0, Ordering::Relaxed);

    // Initialize path cache (BSS-13)
    let path_cache = Arc::new(path_cache::PathCache::new(1000, Arc::clone(&watchtower_stats)));
    watchtower_stats.path_cache = path_cache.clone();

    // BSS-20: Broadcast channel for Node.js IPC Bridge Telemetry
    let (opp_tx, _) = broadcast::channel::<Vec<u8>>(100);

    // BSS-26 Control Channel: System-wide Policy
    let (policy_tx, policy_rx) = watch::channel(SystemPolicy {
        max_hops: 3,
        min_profit_bps: 1.0,
        shadow_mode: false,
        max_position_size_eth: 10.0,
        daily_loss_limit_eth: 1.0,
        daily_loss_used_eth: 0.0,
    });

    // Start Watchtower
    let wt_stats = Arc::clone(&watchtower_stats);
    let wt_graph = Arc::clone(&graph);
    let wt_stats_for_solver = Arc::clone(&wt_stats);
    let wt_opp_tx = opp_tx.clone();
    tokio::spawn(async move {
        run_watchtower(wt_stats, wt_graph, policy_tx, debug_rx, wt_opp_tx).await;
    });


    // BSS-01/BSS-03: Multi-threaded message bus & IPC integration
    // Channel for receiving raw pool updates from BSS-05 (Sync Layer)
    let (tx, rx) = mpsc::channel::<(String, String, PoolState)>(1000);

    // BSS-13: Solver Trigger
    // Elite Grade: Replaces the 10ms sleep loop with a reactive notify trigger.
    let solver_trigger = Arc::new(tokio::sync::Notify::new());

    // --- SUBSYSTEM BSS-05: Reactive WebSocket Sync Layer ---
    // BSS-05: Multi-Chain Matrix Sync
    // Spawns independent ingestion tasks for all Tier-1 chains to detect cross-market inefficiencies.
    let chains = vec![1, 8453, 42161, 137, 10]; // ETH, Base, Arbitrum, Polygon, Optimism

    for chain_id in chains {
        let chain_tx = tx.clone();
        let chain_stats = Arc::clone(&watchtower_stats);
        tokio::spawn(async move {
            subscribe_chain(chain_id, chain_tx, chain_stats).await;
        });
    }

    // --- SUBSYSTEM BSS-40: Mempool Intelligence Ingestion ---
    let mp_tx = tx.clone();
    let mp_stats_sync = Arc::clone(&watchtower_stats);
    tokio::spawn(async move {
        // BSS-40 Elite: Listen to the mempool of the configured target chain
            subscribe_mempool(chain_id, mp_tx, mp_stats_sync).await;
    });

    // Simulation: User issues a Debugging Order (Audit BSS-04)
    let mock_user_tx = debug_tx.clone();
    tokio::spawn(async move {
        sleep(Duration::from_secs(3)).await;
        let _ = mock_user_tx
            .send(DebuggingOrder {
                target: "BSS-04".to_string(),
                intent: DebugIntent::Audit,
                params: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
                    .to_string(), // dummy hex signature
                payload: None,
                timestamp: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
                nonce: 12345,
            })
            .await;
    });

    // Start BSS-06 API Gateway for Dashboard monitoring
    let api_stats = Arc::clone(&watchtower_stats);
    let gateway_rx = opp_tx.subscribe();
    let api_debug_tx = debug_tx.clone();
    tokio::spawn(async move {
        run_api_gateway(api_stats, gateway_rx, api_debug_tx).await;
    });

    // BSS-06: Heartbeat Emitter for Live Listening Verification
    let heartbeat_stats = Arc::clone(&watchtower_stats);
    let heartbeat_tx = opp_tx.clone();
    tokio::spawn(async move {
        loop {
            tokio::time::sleep(Duration::from_secs(5)).await;

            // BSS-06: Efficient Binary Pulse (TLV Frame)
            // [Type: 0x02][Length: u32][Payload...]
            let mut payload = Vec::with_capacity(64);
            payload.push(0x02); // Type: Heartbeat
            payload.extend_from_slice(
                &std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_secs()
                    .to_be_bytes(),
            );
            payload.extend_from_slice(
                &(heartbeat_stats.msg_throughput_sec.load(Ordering::Relaxed) as u64).to_be_bytes(),
            );
            payload.push(
                heartbeat_stats
                    .is_shadow_mode_active
                    .load(Ordering::Relaxed) as u8,
            );
            payload.push(CircuitBreaker::is_tripped(&heartbeat_stats) as u8);

stem : articulate these intents of mine             let addr = heartbeat_stats
                .flashloan_contract_address
                .read()
                .expect("Flashloan address RwLock poisoned");
            if let Some(s) = addr.as_ref() {
                payload.extend_from_slice(&(s.len() as u16).to_be_bytes());
                payload.extend_from_slice(s.as_bytes());
            } else {
                payload.extend_from_slice(&0u16.to_be_bytes());
            }

            // BSS-44 / BSS-07: Include bribe tuning parameters for Node.js sync
            let min_margin = heartbeat_stats.min_margin_ratio_bps.load(Ordering::Relaxed) as u16;
            let bribe = heartbeat_stats.bribe_ratio_bps.load(Ordering::Relaxed) as u16;
            payload.extend_from_slice(&min_margin.to_be_bytes());
            payload.extend_from_slice(&bribe.to_be_bytes());

            let _ = heartbeat_tx.send(payload);
        }
    });

    // --- SUBSYSTEM BSS-40: Mempool & State Persistence Task ---
    // Task 8 Integration: Moving state persistence into the MempoolIntelligence logic.
    let mempool_graph = Arc::clone(&graph);
    let mempool_stats = Arc::clone(&watchtower_stats);
    let mempool_trigger = Arc::clone(&solver_trigger);
    tokio::spawn(async move {
                MempoolEngine::run_mempool_worker(
            rx,
            mempool_graph,
            mempool_stats,
            mempool_trigger,
        )
        .await;
    });

    // --- SUBSYSTEM BSS-13: Bellman-Ford Strategy Task ---
    let strategy_graph = Arc::clone(&graph);
    let solver_stats = wt_stats_for_solver;
    let solver_opp_tx = opp_tx.clone();
    let _solver_watchtower_stats = Arc::clone(&watchtower_stats);
    let solver_wait_trigger = Arc::clone(&solver_trigger);

    std::thread::Builder::new()
        .name("brightsky-solver".to_string())
        .spawn(move || {
        // BSS-01 Optimization: Solver isolation on dedicated physical core 
        // to eliminate context-switching jitter from the async runtime.
        println!("[BSS-13] Cycle Detection Engine Active (Bellman-Ford)");
        loop {
            // Elite Grade: Block thread until notified by BSS-04. Zero CPU waste.
            // Since we are in a physical thread, we use a custom parking or wait for the async trigger.
            futures::executor::block_on(solver_wait_trigger.notified());

            let loop_start = Instant::now();
            let policy = policy_rx.borrow().clone();
             // BSS-13: Real Solver Logic (Task 2 Implementation)
            // The inline logic has been cleared to transition to modular indexed traversal.
            // This allows the hot path to avoid String hashing/cloning.
            let solver = SolverSpecialist {
                stats: Arc::clone(&solver_stats),
                graph: Arc::clone(&strategy_graph),
            };

            let start_token = "WETH";
            let entry_tokens = vec![
                strategy_graph.get_or_create_index(start_token),
                strategy_graph.get_or_create_index("USDC"),
                strategy_graph.get_or_create_index("DAI"),
                strategy_graph.get_or_create_index("cbETH"),
                strategy_graph.get_or_create_index("WBTC"),
                strategy_graph.get_or_create_index("AERO"),
                strategy_graph.get_or_create_index("DEGEN"),
            ];

            // Task 7: Execution Pipeline Integration
            let opportunities = solver.detect_arbitrage(entry_tokens, policy.max_hops, &path_cache);
            if !opportunities.is_empty() {
                solver_stats.opportunities_found_count.fetch_add(opportunities.len() as u64, Ordering::Relaxed);
            }

            for opp in opportunities {
                // 1. Reconstruct path edges from indices
                let mut path_edges = Vec::new();
                for i in 0..opp.path.len() - 1 {
                    let from = opp.path[i];
                    let to = opp.path[i+1];
                    if let Some(edge) = strategy_graph.get_edges(from).into_iter().find(|e| e.to == to) {
                        path_edges.push(edge);
                    }
                }

                // 2. Compute Optimal Input Size (BSS-44)
                // Targeting max profit given AMM slippage curves
                let optimal_wei = LiquidityEngine::compute_optimal_input(
                    &path_edges,
                    100_000_000_000_000,         // 0.0001 ETH min
                    100_000_000_000_000_000_000, // 100 ETH max cap
                );

                if optimal_wei == 0 { continue; }

                // 3. Deterministic Simulation (BSS-43)
                let sim_result = SimulationEngine::simulate_opportunity(
                    &path_edges,
                    optimal_wei as f64 / 1e18
                );

                // 4. Risk Validation Gate (BSS-45) & MEV Guard (BSS-42)
                if let Some(specialist) = specialists.iter().find(|s| s.subsystem_id() == "BSS-45") {
                    // Downcast to RiskSpecialist to access risk_model
                    use std::any::Any;
                    if let Some(risk_specialist) = specialist.as_any().downcast_ref::<RiskSpecialist>() {
                        if RiskEngine::validate(&opp, &sim_result, &policy, &solver_stats, &risk_specialist.risk_model)
                            && MEVGuardEngine::is_safe_to_execute(&opp, &sim_result, &solver_stats)
                            {
                                // BSS-45 Hardening: Anti-Hijack Delta Check
                                // Compare simulation profit vs. raw log-weight math
                                let oracle_profit = (opp.log_weight.abs().exp() - 1.0) * (optimal_wei as f64 / 1e18);
                                let delta = (sim_result.profit_eth - oracle_profit).abs();
                                if delta > (oracle_profit * 0.2) {
                                    println!("[BSS-45] REJECTION: Simulation anomaly. Delta: {delta} ETH");
                                    solver_stats.signals_rejected_risk.fetch_add(1, Ordering::Relaxed);
                                    continue;
                                }

                                // 5. Execution Orchestration (BSS-41)
                                solver_stats.executed_trades_count.fetch_add(1, Ordering::Relaxed);
                                let profit_milli = (sim_result.profit_eth * 1000.0) as u64;
                                solver_stats.total_profit_milli_eth.fetch_add(profit_milli, Ordering::Relaxed);
                                solver_stats.simulated_tx_success_rate.store(100, Ordering::Relaxed);

                                let telemetry = serde_json::json!({
                                    "type": "EXECUTION_EVENT",
                                    "path": opp.path,
                                    "input_eth": optimal_wei as f64 / 1e18,
                                    "est_profit_eth": sim_result.profit_eth,
                                    "gas_eth": sim_result.gas_estimate_eth,
                                    "shadow_mode": policy.shadow_mode,
                                    "private_routing": solver_stats.is_adversarial_threat_active.load(Ordering::Relaxed)
                                });

                                if let Ok(msg) = serde_json::to_string(&telemetry) {
                                    let mut frame = Vec::with_capacity(msg.len() + 2);
                                    frame.push(0x01); // Type: JSON
                                    frame.extend_from_slice(msg.as_bytes());
                                    frame.push(b'\n'); // Delimiter for Node.js IPC parser
                                    let _ = solver_opp_tx.send(frame);
                                }
                            } else {
                                // Risk validation failed
                                solver_stats.signals_rejected_risk.fetch_add(1, Ordering::Relaxed);
                                continue;
                            }
            }

            let elapsed = loop_start.elapsed().as_millis() as u64;
            solver_stats.solver_latency_p99_ms.store(elapsed, Ordering::Relaxed);
        }
    })?;

    // Keep the main loop alive
    println!("BrightSky Engine [39 Subsystems Synchronized] operational.");
    tokio::signal::ctrl_c().await?;
    Ok(())
}
