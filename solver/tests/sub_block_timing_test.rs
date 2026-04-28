use super::super::src::timing::sub_block_timing::{SubBlockTimingEngine, TimingStatus};
use super::super::src::WatchtowerStats;
use std::sync::Arc;
use std::thread;
use std::time::Duration;

#[test]
fn test_sub_block_timing_engine_creation() {
    let stats = Arc::new(WatchtowerStats::default());
    let timing_engine = SubBlockTimingEngine::new(Arc::clone(&stats));
    
    // Check default values
    assert_eq!(timing_engine.timing_precision.load(std::sync::atomic::Ordering::Relaxed), 1_000_000);
    assert_eq!(timing_engine.builder_queue_position.load(std::sync::atomic::Ordering::Relaxed), 500);
    assert_eq!(timing_engine.market_pressure_factor.load(std::sync::atomic::Ordering::Relaxed), 500);
}

#[test]
fn test_now_ns_returns_timestamp() {
    let stats = Arc::new(WatchtowerStats::default());
    let timing_engine = SubBlockTimingEngine::new(Arc::clone(&stats));
    
    let timestamp = timing_engine.now_ns();
    // Should be a reasonable timestamp (nanoseconds since epoch)
    assert!(timestamp > 1_000_000_000_000_000_000); // After year 2001
}

#[test]
fn test_calculate_optimal_delay_queue_position() {
    let stats = Arc::new(WatchtowerStats::default());
    let timing_engine = SubBlockTimingEngine::new(Arc::clone(&stats));
    
    // Test high queue position (should add delay)
    timing_engine.builder_queue_position.store(800, std::sync::atomic::Ordering::Relaxed);
    let delay_high = timing_engine.calculate_optimal_delay();
    assert!(delay_high > 0);
    
    // Test low queue position (should not add delay)
    timing_engine.builder_queue_position.store(200, std::sync::atomic::Ordering::Relaxed);
    let delay_low = timing_engine.calculate_optimal_delay();
    // With default pressure of 500, low queue position should not add delay
    assert_eq!(delay_low, 0);
}

#[test]
fn test_calculate_optimal_delay_market_pressure() {
    let stats = Arc::new(WatchtowerStats::default());
    let timing_engine = SubBlockTimingEngine::new(Arc::clone(&stats));
    
    // Test high market pressure (should reduce delay)
    timing_engine.market_pressure_factor.store(800, std::sync::atomic::Ordering::Relaxed);
    timing_engine.builder_queue_position.store(500, std::sync::atomic::Ordering::Relaxed); // Neutral
    let delay_high_pressure = timing_engine.calculate_optimal_delay();
    
    // Test low market pressure (should increase delay)
    timing_engine.market_pressure_factor.store(200, std::sync::atomic::Ordering::Relaxed);
    let delay_low_pressure = timing_engine.calculate_optimal_delay();
    
    // Low pressure should result in more delay than high pressure (with neutral queue)
    assert!(delay_low_pressure > delay_high_pressure);
}

#[test]
fn test_update_timing_precision() {
    let stats = Arc::new(WatchtowerStats::default());
    let timing_engine = SubBlockTimingEngine::new(Arc::clone(&stats));
    
    let initial_precision = timing_engine.timing_precision.load(std::sync::atomic::Ordering::Relaxed);
    timing_engine.update_timing_precision(500_000); // 500µs
    
    let updated_precision = timing_engine.timing_precision.load(std::sync::atomic::Ordering::Relaxed);
    // Should have changed from initial value (1,000,000) towards 500,000
    assert_ne!(updated_precision, initial_precision);
    assert!(updated_precision < initial_precision);
    assert!(updated_precision > 500_000); // EMA should be between old and new
    
    // Check that stats were also updated
    assert_eq!(stats.timing_precision_ns.load(std::sync::atomic::Ordering::Relaxed), updated_precision);
}

#[test]
fn test_update_builder_queue_position() {
    let stats = Arc::new(WatchtowerStats::default());
    let timing_engine = SubBlockTimingEngine::new(Arc::clone(&stats));
    
    timing_engine.update_builder_queue_position(750);
    assert_eq!(timing_engine.builder_queue_position.load(std::sync::atomic::Ordering::Relaxed), 750);
    assert_eq!(stats.builder_queue_position.load(std::sync::atomic::Ordering::Relaxed), 750);
    
    // Test clamping
    timing_engine.update_builder_queue_position(1200); // Above max
    assert_eq!(timing_engine.builder_queue_position.load(std::sync::atomic::Ordering::Relaxed), 1000);
    assert_eq!(stats.builder_queue_position.load(std::sync::atomic::Ordering::Relaxed), 1000);
}

#[test]
fn test_update_market_pressure() {
    let stats = Arc::new(WatchtowerStats::default());
    let timing_engine = SubBlockTimingEngine::new(Arc::clone(&stats));
    
    // Test normal values
    timing_engine.update_market_pressure(40, 300); // 0.4% collision rate, medium congestion
    let pressure = timing_engine.market_pressure_factor.load(std::sync::atomic::Ordering::Relaxed);
    assert!(pressure > 0);
    assert!(pressure <= 1000);
    assert_eq!(stats.market_pressure_factor.load(std::sync::atomic::Ordering::Relaxed), pressure);
    assert_eq!(stats.collision_rate_estimate.load(std::sync::atomic::Ordering::Relaxed), 40);
    
    // Test clamping
    timing_engine.update_market_pressure(600, 1200); // Above limits
    let pressure_clamped = timing_engine.market_pressure_factor.load(std::sync::atomic::Ordering::Relaxed);
    assert!(pressure_clamped <= 1000);
    assert_eq!(stats.market_pressure_factor.load(std::sync::atomic::Ordering::Relaxed), pressure_clamped);
    assert_eq!(stats.collision_rate_estimate.load(std::sync::atomic::Ordering::Relaxed), 600); // collision rate not clamped
}

#[test]
fn test_get_status() {
    let stats = Arc::new(WatchtowerStats::default());
    let timing_engine = SubBlockTimingEngine::new(Arc::clone(&stats));
    
    // Set some known values
    timing_engine.builder_queue_position.store(400, std::sync::atomic::Ordering::Relaxed);
    timing_engine.market_pressure_factor.store(600, std::sync::atomic::Ordering::Relaxed);
    stats.collision_rate_estimate.store(50, std::sync::atomic::Ordering::Relaxed);
    
    let status = timing_engine.get_status();
    assert_eq!(status.builder_queue_position, 400);
    assert_eq!(status.market_pressure_factor, 600);
    assert_eq!(status.collision_rate_estimate, 50);
}

#[test]
fn test_integration_with_arbitrage_pipeline() {
    // This test simulates the integration with the arbitrage detection pipeline
    let stats = Arc::new(WatchtowerStats::default());
    let timing_engine = Arc::new(SubBlockTimingEngine::new(Arc::clone(&stats)));
    let timing_engine_mutex = std::sync::Mutex::new(timing_engine);
    
    // Simulate the timing calculation and delay application from main.rs
    {
        let timing_engine_lock = timing_engine_mutex.lock().unwrap();
        let delay_ns = timing_engine_lock.calculate_optimal_delay();
        
        // Actually wait for the calculated delay (if any)
        if delay_ns > 0 {
            thread::sleep(Duration::from_nanos(delay_ns));
        }
        
        // Update timing precision based on actual performance 
        // Simulate measurement of timing jitter (typically 10-100µs in practice)
        let timing_jitter_ns = 50_000; // 50µs typical jitter
        timing_engine_lock.update_timing_precision(timing_jitter_ns);
    } // Lock released here
    
    // Verify stats were updated
    assert!(stats.timing_precision_ns.load(std::sync::atomic::Ordering::Relaxed) > 0);
}

#[test]
fn test_thread_safety() {
    let stats = Arc::new(WatchtowerStats::default());
    let timing_engine = Arc::new(SubBlockTimingEngine::new(Arc::clone(&stats)));
    let timing_engine_mutex = std::sync::Mutex::new(timing_engine);
    
    // Spawn multiple threads that access the timing engine
    let mut handles = vec![];
    for i in 0..10 {
        let engine_mutex = timing_engine_mutex.clone();
        let stats_clone = Arc::clone(&stats);
        handles.push(thread::spawn(move || {
            let mut engine = engine_mutex.lock().unwrap();
            // Each thread updates different values
            engine.builder_queue_position.store((i * 100) as u64, std::sync::atomic::Ordering::Relaxed);
            engine.market_pressure_factor.store((i * 50) as u64, std::sync::atomic::Ordering::Relaxed);
            engine.update_timing_precision(1_000_000 + (i * 10_000) as u64);
        }));
    }
    
    // Wait for all threads to complete
    for handle in handles {
        handle.join().unwrap();
    }
    
    // Verify that the final values are within expected ranges
    let final_engine = timing_engine_mutex.lock().unwrap();
    let queue_pos = final_engine.builder_queue_position.load(std::sync::atomic::Ordering::Relaxed);
    let pressure = final_engine.market_pressure_factor.load(std::sync::atomic::Ordering::Relaxed);
    
    // Values should be from one of the threads (0-900 for queue, 0-450 for pressure)
    assert!(queue_pos <= 900);
    assert!(pressure <= 450);
}
