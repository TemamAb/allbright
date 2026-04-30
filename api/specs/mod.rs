pub mod profitability;
pub mod risk;

use brightsky_solver::SubsystemSpecialist;
use std::sync::Arc;

pub struct SpecialistRegistry {
    pub specialists: Vec<Arc<dyn SubsystemSpecialist>>,
}

impl SpecialistRegistry {
    pub fn new() -> Self {
        Self {
            specialists: vec![],
        }
    }
}