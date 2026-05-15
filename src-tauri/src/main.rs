#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

use commands::{admin, readiness, solver};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

fn main() {
    // Initialize logging with tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "allbright=debug,tauri=info".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();
    
    // Set up global panic hook for crash logging
    std::panic::set_hook(Box::new(|panic_info| {
        tracing::error!("Application panic: {}", panic_info);
    }));
    
    tracing::info!("Allbright Desktop v0.2.6 starting...");
    
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            // Solver commands
            solver::get_execution_status,
            solver::execute_strategy,
            solver::get_execution_queue,
            solver::add_to_queue,
            solver::remove_from_queue,
            solver::get_gas_recommendation,
            solver::emergency_stop,
            solver::resume_execution,
            // Readiness commands
            readiness::check_readiness,
            readiness::get_system_status,
            readiness::check_component,
            // Admin commands
            admin::get_logs,
            admin::add_log,
            admin::get_system_config,
            admin::update_config,
            admin::get_users,
            admin::set_user_status,
            admin::get_audit_trail,
            admin::export_config,
            admin::import_config,
            admin::audit_get_process_health,
            admin::audit_fetch_logs,
        ])
        .setup(|_app| {
            tracing::info!("Allbright Desktop v0.2.6 initialized successfully");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
