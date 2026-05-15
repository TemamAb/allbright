mod strategy;
mod simulator;
mod debugger;
mod report;

use strategy::*;
use simulator::*;
use debugger::*;
use report::*;

fn main() {
    // Create baseline strategy
    let current = baseline_strategy();
    let upgraded = upgraded_strategy(&current);

    // Run diagnostic
    let mut arb_debugger = ArbitrageDebugger::new_default();
    let diagnostic = arb_debugger.run_diagnostic(&current);

    // Run simulation
    let sim = FlashLoanSimulator::new_default();
    let result = sim.simulate(&current, 100000.0); // 100k loan amount
    
    // Generate report
    let rep = generate(&current, &upgraded);

    println!("========================================");
    println!("   ALLBRIGHT FLASH LOAN ARBITRAGE DEBUG   ");
    println!("========================================");

    // Diagnostic results
    println!("\n[DIAGNOSTIC REPORT]");
    println!("Score: {}/100 - {}", diagnostic.score, diagnostic.status());
    println!("Issues Found: {}", diagnostic.issue_count);
    println!("  Critical: {}", diagnostic.critical_count);
    println!("  Errors: {}", diagnostic.error_count);
    
    if !diagnostic.issues.is_empty() {
        println!("\n[ISSUES]");
        for issue in &diagnostic.issues {
            println!("  [{}] {}", format!("{:?}", issue.severity).to_uppercase(), issue.description);
            if let Some(ref fix) = issue.suggested_fix {
                println!("    → Fix: {}", fix);
            }
        }
    }

    // Simulation results
    println!("\n[SIMULATION - 100k Flash Loan]");
    println!("Flash Loan Fee: {} ({} bps)", result.flash_loan_fee, sim.flash_loan_fee_bps);
    println!("Gas Spent: {} ETH", result.gas_spent);
    println!("Expected Profit: ${:.2}", result.profit);
    println!("Expected Loss: ${:.2}", result.loss);
    println!("Net Result: ${:.2}", result.net_result);
    println!("Status: {}", if result.success { "PROFITABLE" } else { "LOSS" });

    // Report
    println!("\n[PROFIT ANALYSIS]");
    println!("Current Profit: ${}/day", rep.current_profit);
    println!("Upgraded Profit: ${}/day", rep.upgraded_profit);
    println!("Delta: ${}/day (+{:.1}%)", rep.delta, (rep.delta / rep.current_profit) * 100.0);

    println!("\n========================================");
    println!("COMMANDER APPROVAL REQUIRED FOR DEPLOY");
    println!("========================================");
}
