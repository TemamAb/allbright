use crate::strategy::Strategy;
use crate::simulator::SimulationResult;

/// Debug configuration for flash loan arbitrage
#[derive(Clone, Debug)]
pub struct DebugConfig {
    pub enable_trace: bool,
    pub trace_depth: usize,
    pub log_memory: bool,
    pub log_storage: bool,
    pub checkpoint_frequency: usize,
}

impl Default for DebugConfig {
    fn default() -> Self {
        DebugConfig {
            enable_trace: true,
            trace_depth: 10,
            log_memory: true,
            log_storage: true,
            checkpoint_frequency: 100,
        }
    }
}

/// Debug checkpoint for state capture
#[derive(Clone, Debug)]
pub struct Checkpoint {
    pub step: usize,
    pub pc: usize,
    pub gas_remaining: u64,
    pub stack_depth: usize,
    pub local_vars: Vec<(String, String)>,
}

/// Debug issue with severity and fix suggestion
#[derive(Clone, Debug)]
pub struct DebugIssue {
    pub severity: IssueSeverity,
    pub description: String,
    pub location: Option<String>,
    pub suggested_fix: Option<String>,
}

#[derive(Clone, Debug, PartialOrd, PartialEq)]
pub enum IssueSeverity {
    Info,
    Warning,
    Error,
    Critical,
}

/// Flash Loan Arbitrage Debugger
/// Provides comprehensive debugging for arbitrage strategies
pub struct ArbitrageDebugger {
    config: DebugConfig,
    checkpoints: Vec<Checkpoint>,
    issues: Vec<DebugIssue>,
    step_count: usize,
}

impl ArbitrageDebugger {
    /// Create a new debugger with configuration
    pub fn new(config: DebugConfig) -> Self {
        ArbitrageDebugger {
            config,
            checkpoints: Vec::new(),
            issues: Vec::new(),
            step_count: 0,
        }
    }

    /// Create with default configuration
    pub fn new_default() -> Self {
        ArbitrageDebugger::new(DebugConfig::default())
    }

    /// Debug a strategy and return issues
    pub fn debug(&mut self, strategy: &Strategy) -> Vec<DebugIssue> {
        self.issues.clear();
        
        // Check strategy parameters
        self.check_failure_rate(strategy);
        self.check_gas_efficiency(strategy);
        self.check_profit_efficiency(strategy);
        self.check_risk_factors(strategy);
        self.check_flash_loan_invariants(strategy);
        
        self.issues.clone()
    }

    /// Run full diagnostic on strategy
    pub fn run_diagnostic(&mut self, strategy: &Strategy) -> DiagnosticReport {
        self.debug(strategy);
        
        let critical_count = self.issues.iter()
            .filter(|i| i.severity == IssueSeverity::Critical)
            .count();
        let error_count = self.issues.iter()
            .filter(|i| i.severity == IssueSeverity::Error)
            .count();
        
        let score = if self.issues.is_empty() {
            100
        } else {
            100 - (critical_count * 20) - (error_count * 10)
        }.max(0);

        DiagnosticReport {
            score,
            issue_count: self.issues.len(),
            critical_count,
            error_count,
            issues: self.issues.clone(),
        }
    }

    /// Check failure rate
    fn check_failure_rate(&mut self, strategy: &Strategy) {
        if strategy.failure_rate > 0.5 {
            self.issues.push(DebugIssue {
                severity: IssueSeverity::Critical,
                description: format!("Critical: Failure rate {}% exceeds 50% threshold", strategy.failure_rate * 100.0),
                location: Some("Strategy.failure_rate".to_string()),
                suggested_fix: Some("Review arbitrage path selection and oracle freshness".to_string()),
            });
        } else if strategy.failure_rate > 0.3 {
            self.issues.push(DebugIssue {
                severity: IssueSeverity::Error,
                description: format!("High failure rate {}%", strategy.failure_rate * 100.0),
                location: Some("Strategy.failure_rate".to_string()),
                suggested_fix: Some("Optimize entry conditions and slippage parameters".to_string()),
            });
        } else if strategy.failure_rate > 0.15 {
            self.issues.push(DebugIssue {
                severity: IssueSeverity::Warning,
                description: format!("Elevated failure rate {}%", strategy.failure_rate * 100.0),
                location: Some("Strategy.failure_rate".to_string()),
                suggested_fix: Some("Monitor and adjust parameters".to_string()),
            });
        }
    }

    /// Check gas efficiency
    fn check_gas_efficiency(&mut self, strategy: &Strategy) {
        if strategy.gas_cost > 50.0 {
            self.issues.push(DebugIssue {
                severity: IssueSeverity::Critical,
                description: format!("Critical gas cost: {} gwei", strategy.gas_cost),
                location: Some("Strategy.gas_cost".to_string()),
                suggested_fix: Some("Optimize contract code and bundle size".to_string()),
            });
        } else if strategy.gas_cost > 25.0 {
            self.issues.push(DebugIssue {
                severity: IssueSeverity::Warning,
                description: format!("High gas cost: {} gwei", strategy.gas_cost),
                location: Some("Strategy.gas_cost".to_string()),
                suggested_fix: Some("Consider gas optimization".to_string()),
            });
        }
    }

    /// Check profit efficiency
    fn check_profit_efficiency(&mut self, strategy: &Strategy) {
        if strategy.expected_profit < 10.0 {
            self.issues.push(DebugIssue {
                severity: IssueSeverity::Critical,
                description: format!("Insufficient profit: ${}", strategy.expected_profit),
                location: Some("Strategy.expected_profit".to_string()),
                suggested_fix: Some("Review arbitrage opportunities".to_string()),
            });
        } else if strategy.expected_profit < 50.0 {
            self.issues.push(DebugIssue {
                severity: IssueSeverity::Warning,
                description: format!("Low profit: ${}", strategy.expected_profit),
                location: Some("Strategy.expected_profit".to_string()),
                suggested_fix: Some("Expand token pairs".to_string()),
            });
        }
    }

    /// Check risk factors
    fn check_risk_factors(&mut self, strategy: &Strategy) {
        // Reentrancy risk
        if strategy.failure_rate > 0.4 && strategy.gas_cost > 30.0 {
            self.issues.push(DebugIssue {
                severity: IssueSeverity::Critical,
                description: "High risk: slow execution with high failure rate".to_string(),
                location: Some("Strategy parameters".to_string()),
                suggested_fix: Some("Circuit breaker recommended".to_string()),
            });
        }
        
        // Flash loan specific risk
        if strategy.expected_profit < strategy.gas_cost * 2.0 {
            self.issues.push(DebugIssue {
                severity: IssueSeverity::Error,
                description: "Flash loan unprofitable after gas".to_string(),
                location: Some("Strategy.expected_profit".to_string()),
                suggested_fix: Some("Profit should exceed 2x gas cost".to_string()),
            });
        }
    }

    /// Check flash loan invariants
    fn check_flash_loan_invariants(&mut self, strategy: &Strategy) {
        // Invariant: profit must exceed flash loan fee + gas
        if strategy.expected_profit <= strategy.gas_cost {
            self.issues.push(DebugIssue {
                severity: IssueSeverity::Critical,
                description: "Flash loan invariant violated: profit <= gas".to_string(),
                location: Some("Strategy".to_string()),
                suggested_fix: Some("Do not execute flash loan".to_string()),
            });
        }
    }

    /// Take a checkpoint
    pub fn checkpoint(&mut self, pc: usize, gas_remaining: u64, stack_depth: usize, locals: Vec<(String, String)>) {
        if self.step_count % self.config.checkpoint_frequency == 0 {
            self.checkpoints.push(Checkpoint {
                step: self.step_count,
                pc,
                gas_remaining,
                stack_depth,
                local_vars: locals,
            });
        }
        self.step_count += 1;
    }

    /// Get checkpoints
    pub fn get_checkpoints(&self) -> &[Checkpoint] {
        &self.checkpoints
    }

    /// Clear checkpoints
    pub fn clear_checkpoints(&mut self) {
        self.checkpoints.clear();
        self.step_count = 0;
    }

    /// Get issues by severity
    pub fn get_issues(&self, severity: IssueSeverity) -> Vec<&DebugIssue> {
        self.issues.iter()
            .filter(|i| i.severity == severity)
            .collect()
    }
}

/// Diagnostic report
#[derive(Debug)]
pub struct DiagnosticReport {
    pub score: usize,
    pub issue_count: usize,
    pub critical_count: usize,
    pub error_count: usize,
    pub issues: Vec<DebugIssue>,
}

impl DiagnosticReport {
    /// Get status string
    pub fn status(&self) -> &str {
        if self.score >= 90 {
            "HEALTHY"
        } else if self.score >= 70 {
            "DEGRADED"
        } else if self.score >= 50 {
            "WARNING"
        } else {
            "CRITICAL"
        }
    }
}

/// Legacy function for backwards compatibility
pub fn debug(strategy: &Strategy) -> Vec<String> {
    let mut debugger = ArbitrageDebugger::new_default();
    let issues = debugger.debug(strategy);
    issues.into_iter().map(|i| i.description).collect()
}
