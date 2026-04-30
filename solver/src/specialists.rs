pub mod profitability;
pub mod risk;

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
