mod strategy;
mod simulator;
mod debugger;
mod report;

use strategy::*;
use report::*;

fn main() {
    let current = baseline_strategy();
    let upgraded = upgraded_strategy(&current);

    let issues = debugger::debug(&current);
    let rep = generate(&current, &upgraded);

    println!("=== ALLBRIGHT DEBUG REPORT ===");

    println!("\nCURRENT STRATEGY ISSUES:");
    for i in issues {
        println!("- {}", i);
    }

    println!("\nPROFIT ANALYSIS:");
    println!("Current Profit: {}", rep.current_profit);
    println!("Upgraded Profit: {}", rep.upgraded_profit);
    println!("Δ Profit/Day: {}", rep.delta);

    println!("\nCOMMANDER APPROVAL REQUIRED");
}
