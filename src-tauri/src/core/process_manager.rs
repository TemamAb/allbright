// Allbright Desktop - Process Manager
// Manages system process lifecycle and monitoring

/// Process state enumeration
#[derive(Debug, Clone)]
pub enum ProcessState {
    Starting,
    Running,
    Stopping,
    Stopped,
    Error(String),
}

/// Process manager for system operations
pub struct ProcessManager {
    state: ProcessState,
}

impl ProcessManager {
    pub fn new() -> Self {
        ProcessManager {
            state: ProcessState::Starting,
        }
    }

    pub fn start(&mut self) {
        self.state = ProcessState::Running;
    }

    pub fn stop(&mut self) {
        self.state = ProcessState::Stopping;
    }

    pub fn get_state(&self) -> &ProcessState {
        &self.state
    }
}

impl Default for ProcessManager {
    fn default() -> Self {
        Self::new()
    }
}
