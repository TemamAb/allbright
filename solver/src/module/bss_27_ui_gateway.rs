// BSS-27: UI Gateway Connection Specialist
use crate::{HealthStatus, SubsystemSpecialist, WatchtowerStats};
use serde_json::Value;
use std::sync::atomic::{AtomicBool, AtomicU64, AtomicUsize, Ordering};
use std::sync::Arc;
use tracing::{error, info, warn};

/// Helper: safely get current Unix timestamp (seconds), with fallback on clock errors
fn now_secs() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_else(|e| {
            error!(target: "bss_27", error = ?e, "System clock error, using epoch fallback");
            std::time::Duration::from_secs(0)
        })
        .as_secs()
}
use tracing::{error, info, warn};

/// Helper: safely get current Unix timestamp (seconds), with fallback on clock errors
fn now_secs() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_else(|e| {
            error!(target: "bss_27", error = ?e, "System clock error, using epoch fallback");
            std::time::Duration::from_secs(0)
        })
        .as_secs()
}

pub struct UIGatewaySpecialist {
    pub stats: Arc<WatchtowerStats>,
    pub ui_connections: AtomicUsize,
    pub last_heartbeat: AtomicU64,
    pub connection_timeout_secs: u64,
}

impl UIGatewaySpecialist {
    pub fn new(stats: Arc<WatchtowerStats>) -> Self {
        Self {
            stats,
            ui_connections: AtomicUsize::new(0),
            last_heartbeat: AtomicU64::new(0),
            connection_timeout_secs: 30, // 30 second timeout
        }
    }
}

impl SubsystemSpecialist for UIGatewaySpecialist {
    fn subsystem_id(&self) -> &'static str {
        "BSS-27"
    }
    fn check_health(&self) -> HealthStatus {
        let now = now_secs();
        let last_heartbeat = self.last_heartbeat.load(Ordering::Relaxed);
        let ui_connections = self.ui_connections.load(Ordering::Relaxed);
        
        // Check if we've had a heartbeat recently
        let heartbeat_age = now.saturating_sub(last_heartbeat);
        
        if ui_connections == 0 {
            HealthStatus::Degraded("No active UI clients connected to Gateway".to_string())
        } else if heartbeat_age > self.connection_timeout_secs {
            HealthStatus::Degraded(format!("UI Gateway heartbeat stale: {}s", heartbeat_age))
        } else {
            HealthStatus::Optimal
        }
    }
    fn upgrade_strategy(&self) -> &'static str {
        "Architecture: Implement WebSocket connection pooling with automatic reconnect."
    }
    fn testing_strategy(&self) -> &'static str {
        "Stress: Simulate concurrent UI clients with intermittent connectivity."
    }
    fn run_diagnostic(&self) -> Value {
        let now = now_secs();
        let last_heartbeat = self.last_heartbeat.load(Ordering::Relaxed);
        let heartbeat_age = now.saturating_sub(last_heartbeat);
        let ui_connections = self.ui_connections.load(Ordering::Relaxed);
        
        serde_json::json!({
            "ui_connections": ui_connections,
            "last_heartbeat_ago": heartbeat_age,
            "connection_timeout_secs": self.connection_timeout_secs,
            "gateway_status": if ui_connections > 0 && heartbeat_age <= self.connection_timeout_secs {
                "connected"
            } else {
                "disconnected"
            }
        })
    }
    fn execute_remediation(&self, command: &str) -> Result<(), String> {
        match command {
            "RESET_CONNECTION_STATS" => {
                self.ui_connections.store(0, Ordering::Relaxed);
                self.last_heartbeat.store(0, Ordering::Relaxed);
                Ok(())
            }
            "UPDATE_HEARTBEAT" => {
                let now = now_secs();
                self.last_heartbeat.store(now, Ordering::Relaxed);
                Ok(())
            }
            "INCREMENT_UI_CONNECTIONS" => {
                self.ui_connections.fetch_add(1, Ordering::Relaxed);
                Ok(())
            }
            "DECREMENT_UI_CONNECTIONS" => {
                let current = self.ui_connections.load(Ordering::Relaxed);
                if current > 0 {
                    self.ui_connections.fetch_sub(1, Ordering::Relaxed);
                }
                Ok(())
            }
            _ => Err(format!("Unknown command: {}", command)),
        }
    }
    fn ai_insight(&self) -> Option<String> {
        let now = now_secs();
        let last_heartbeat = self.last_heartbeat.load(Ordering::Relaxed);
        let heartbeat_age = now.saturating_sub(last_heartbeat);
        let ui_connections = self.ui_connections.load(Ordering::Relaxed);
        
        if ui_connections == 0 {
            Some("BSS-27: No active UI clients connected to Gateway".to_string())
        } else if heartbeat_age > self.connection_timeout_secs {
            Some(format!(
                "BSS-27: UI Gateway heartbeat stale: {}s (timeout: {}s)", 
                heartbeat_age, self.connection_timeout_secs
            ))
        } else {
            Some(format!(
                "BSS-27: UI Gateway healthy with {} active connection(s)", 
                ui_connections
            ))
        }
    }
    fn get_performance_kpi(&self) -> Value {
        // KPI for UI Gateway connectivity
        let now = now_secs();
        let last_heartbeat = self.last_heartbeat.load(Ordering::Relaxed);
        let heartbeat_age = now.saturating_sub(last_heartbeat);
        let ui_connections = self.ui_connections.load(Ordering::Relaxed);
        let connectivity_score = if ui_connections > 0 && heartbeat_age <= self.connection_timeout_secs {
            100.0
        } else if ui_connections > 0 {
            50.0 // Partial credit for having connections but stale heartbeat
        } else {
            0.0
        };
        serde_json::json!({
            "kpi": "UI Gateway Connectivity",
            "target": 100.0,
            "actual": connectivity_score,
            "unit": "%"
        })
    }
}