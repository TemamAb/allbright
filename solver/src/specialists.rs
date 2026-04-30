//! Minimal specialists module to satisfy lib.rs declaration.
//! Will be expanded with actual specialist implementations.

/// Placeholder for specialist subsystem.
pub mod api;
pub mod kpi;
pub mod risk;

/// Empty struct for module presence.
pub struct Specialists;

impl Specialists {
    pub fn new() -> Self {
        Self
    }
}
