//! Core module re-exports

pub mod process_manager;

// Re-exports for external use
pub use process_manager::{AppState, UserRole, WorkflowStage, require_admin};
