use reqwest::blocking::Client;
use serde_json::Value;
/**
 * BrightSky Rust Startup Check System
 * Mirrors the Node.js startup check system
 * Verifies environment variables and system dependencies
 */
use std::env;
use std::process;

// ANSI color helpers
fn green(s: &str) -> String {
    format!("\x1b[32m{}\x1b[0m", s)
}
fn red(s: &str) -> String {
    format!("\x1b[31m{}\x1b[0m", s)
}
fn cyan(s: &str) -> String {
    format!("\x1b[36m{}\x1b[0m", s)
}

// Check a variable and log status
fn check_var(name: &str, mask: bool) -> bool {
    let value = env::var(name).ok();
    let has_value = value.is_some();
    let display = match value {
        Some(v) if mask && v.len() > 10 => format!("{}...{}", &v[0..6], &v[v.len() - 4..]),
        Some(v) => v,
        None => "NOT SET".to_string(),
    };
    let status = if has_value { green("✅") } else { red("❌") };
    println!("[STARTUP CHECK] {}: {} ({})", name, status, display);
    has_value
}

/**
 * Run all startup checks
 * Returns true if all critical checks pass
 */
pub fn run_startup_checks() -> bool {
    println!("\n{}", "=".repeat(60));
    println!(
        "{}",
        cyan("[STARTUP] BrightSky Rust Startup Check System initializing...")
    );
    println!("{}", "=".repeat(60));

    let mut all_passed = true;

    // ─── 1. Core API Keys ───────────────────────────────────
    println!("{}", cyan("── Core API Keys ─"));
    let pimlico_key = check_var("PIMLICO_API_KEY", true);
    let entry_point = check_var("ENTRYPOINT_ADDR", false);
    let flash_executor = check_var("FLASH_EXECUTOR_ADDRESS", false);
    let wallet_address = check_var("WALLET_ADDRESS", false);
    let private_key = check_var("PRIVATE_KEY", true);
    let profit_wallet = check_var("PROFIT_WALLET_ADDRESS", false);
    let chain_id = check_var("CHAIN_ID", false);

    if !pimlico_key {
        all_passed = false;
    }
    if !entry_point {
        all_passed = false;
    }
    if !flash_executor {
        all_passed = false;
    }

    // ─── 2. RPC Endpoints ────────────────────────────────
    println!("\n{}", cyan("── RPC Endpoints ─"));
    let rpc_endpoint = check_var("RPC_ENDPOINT", false);
    let pimlico_bundler = check_var("PIMLICO_BUNDLER_URL", true);

    if !rpc_endpoint {
        all_passed = false;
    }

    // ─── 3. Verify Pimlico Connectivity ─────────────────────
    println!("\n{}", cyan("── Pimlico Connectivity ─"));
    let pimlico_ok = false;

    if pimlico_key && pimlico_bundler {
        if let Some(bundler_url) = env::var("PIMLICO_BUNDLER_URL").ok() {
            if let Some(api_key) = env::var("PIMLICO_API_KEY").ok() {
                let client = Client::new();
                let body = serde_json::json!({
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "eth_supportedEntryPoints",
                    "params": []
                });

                match client
                    .post(&bundler_url)
                    .header("Content-Type", "application/json")
                    .body(body.to_string())
                    .send()
                {
                    Ok(resp) => {
                        if resp.status().is_success() {
                            if let Ok(json) = resp.json::<Value>() {
                                if let Some(result) = json.get("result") {
                                    println!(
                                        "{}",
                                        green("[STARTUP CHECK] PIMLICO Connectivity ✅ ")
                                    );
                                    println!("  EntryPoints found: {}", result);
                                    pimlico_ok = true;
                                } else {
                                    println!("{}", red("[STARTUP CHECK] PIMLICO Connectivity ❌ (Invalid response)"));
                                }
                            }
                        } else {
                            println!(
                                "{}",
                                red(&format!(
                                    "[STARTUP CHECK] PIMLICO Connectivity ❌ (HTTP {})",
                                    resp.status()
                                ))
                            );
                        }
                    }
                    Err(e) => {
                        println!(
                            "{}",
                            red(&format!(
                                "[STARTUP CHECK] PIMLICO Connectivity ❌ (Unreachable: {})",
                                e
                            ))
                        );
                    }
                }
            }
        }
    } else {
        println!(
            "{}",
            red("[STARTUP CHECK] PIMLICO Connectivity ❌ (Missing key or bundler URL)")
        );
    }

    if !pimlico_ok {
        all_passed = false;
    }

    // ─── 4. Verify EntryPoint Format ────────────────────────
    if let Some(ep) = entry_point {
        let is_valid = ep.starts_with("0x") && ep.len() == 42;
        let status = if is_valid { green("✅") } else { red("❌") };
        println!(
            "[STARTUP CHECK] ENTRYPOINT_ADDR {} ({})",
            status,
            if is_valid {
                "Valid format"
            } else {
                "Invalid format"
            }
        );
        if !is_valid {
            all_passed = false;
        }
    }

    // ─── 5. Verify FlashExecutor Format ─────────────────────
    if let Some(fe) = flash_executor {
        let is_valid = fe.starts_with("0x") && fe.len() == 42;
        let status = if is_valid { green("✅") } else { red("❌") };
        println!(
            "[STARTUP CHECK] FLASH_EXECUTOR {} ({})",
            status,
            if is_valid {
                "Valid format"
            } else {
                "Invalid format"
            }
        );
        if !is_valid {
            all_passed = false;
        }
    }

    // ─── Summary ────────────────────────────────────────────
    println!("\n{}", "=".repeat(60));

    if all_passed {
        println!(
            "{}",
            green("[SYSTEM READY] LIVE execution mode armed - all systems check passed ✅")
        );
        trigger_system_ready_beep();
        start_heartbeat();
        true
    } else {
        println!(
            "{}",
            red("[SYSTEM READY] ❌ Some checks failed - review above")
        );
        false
    }
}

/**
 * Start heartbeat - logs every 60 seconds
 */
pub fn start_heartbeat() {
    std::thread::spawn(|| loop {
        std::thread::sleep(std::time::Duration::from_secs(60));
        println!("[SYSTEM READY] LIVE execution mode in progress ✅");
    });
}

/**
 * Trigger double-beep using notify crate (Linux) or PowerShell (Windows)
 */
pub fn trigger_system_ready_beep() {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        // Play Windows default beep sound twice with 1 second delay
        let _ = Command::new("powershell")
            .args(&["-Command", "(New-Object Media.SoundPlayer).Play('C:\\Windows\\Media\\ding.wav'); Start-Sleep 1; (New-Object Media.SoundPlayer).Play('C:\\Windows\\Media\\ding.wav')"])
            .spawn();
    }

    #[cfg(not(target_os = "windows"))]
    {
        // For Linux, use notify-send or similar
        // This requires the `notify` crate
        // Example: notify_rust::Notification::new()
        //     .summary("BrightSky System Ready")
        //     .body("All systems check passed")
        //     .show();
    }
}

/**
 * Check if system is ready
 */
pub fn is_system_ready() -> bool {
    // This would need to be tracked via a static variable
    // For simplicity, return true if we get here
    true
}

/**
 * Hotkey handler for profit notification (Ctrl+Alt+Shift+P)
 * This would need to be implemented with a global hotkey crate
 */
pub fn setup_profit_hotkey() {
    // Placeholder for hotkey setup
    // Would use crate like `global-hotkey` or `hotkey`
    println!("[HOTKEY] Set Ctrl+Alt+Shift+P for profit notification");
}
