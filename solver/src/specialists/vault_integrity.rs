use std::error::Error;
use crate::{SubsystemSpecialist, SpecialistResult, GateTriggerResult};
use serde_json::json;
use std::sync::{Arc, Mutex};
use crate::WatchtowerStats;

/// VaultIntegritySpecialist: Audit-trail for multi-chain balances and compliance.
pub struct VaultIntegritySpecialist {
    pub stats: Arc<Mutex<WatchtowerStats>>,
}

impl SubsystemSpecialist for VaultIntegritySpecialist {
    fn name(&self) -> &str { "VaultIntegritySpecialist" }
    fn category(&self) -> &str { "Vault-Integrity" }

    fn tune_kpis(&self, _data: &serde_json::Value) -> Result<SpecialistResult, Box<dyn Error>> {
        let stats = self.stats.lock().unwrap();
        
        // BSS-F: Quantitative Audit of Vault Health
        let tuned = stats.withdrawal_policy_violations == 0 && stats.multi_chain_variance_usd < 100.0;
        
        Ok(SpecialistResult {
            name: self.name().to_string(),
            category: self.category().to_string(),
            tuned,
            metrics: json!({
                "total_vault_balance_usd": stats.total_vault_balance_usd,
                "pending_withdrawals": stats.pending_withdrawals_count,
                "policy_violations": stats.withdrawal_policy_violations,
                "multi_chain_variance": stats.multi_chain_variance_usd,
                "last_action": "Vault reconciliation audit",
                "impact": format!("{} violations detected", stats.withdrawal_policy_violations)
            }),
            gate_trigger: GateTriggerResult::default(),
        })
    }

    fn status(&self) -> serde_json::Value {
        let stats = self.stats.lock().unwrap();
        json!({ "status": "synced", "violations": stats.violations_count })
    }
}