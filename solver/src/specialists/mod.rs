pub mod api;
pub mod kpi;
pub mod profitability;
pub mod risk;
pub mod performance;
pub mod efficiency;
pub mod health;
pub mod auto_optimization;

use std::sync::Arc;
use crate::SubsystemSpecialist;

pub struct SpecialistRegistry {
    pub specialists: Vec<Arc<dyn SubsystemSpecialist>>,
}

impl SpecialistRegistry {
    pub fn new() -> Self {
        Self {
            specialists: Vec::new(),
        }
    }
}