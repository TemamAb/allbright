// Specialist module declarations for the Arbitrage Solver
// Ensures the compiler can resolve specialist-specific logic
pub mod api;   // API communication for specialists
pub mod kpi;   // Performance monitoring specialists
pub mod risk;  // Risk management and slippage specialists
pub mod solver; // Bellman-Ford pathfinding specialists