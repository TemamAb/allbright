use std::sync::{MutexGuard, PoisonError};
use tracing::error;

/// Safe unwrap for tests - panics with descriptive message
pub fn test_unwrap<T>(option: Option<T>, msg: &str) -> T {
    option.expect(msg)
}

/// Safe lock acquisition for tests
pub fn test_lock<'a, T>(lock_result: Result<MutexGuard<'a, T>, PoisonError<MutexGuard<'a, T>>>) -> MutexGuard<'a, T> {
    match lock_result {
        Ok(guard) => guard,
        Err(poisoned) => {
            error!("Test lock poisoned, recovering");
            poisoned.into_inner()
        }
    }
}
