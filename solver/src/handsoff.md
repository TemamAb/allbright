# Handsoff.md - Rust Build Issues Analysis

## Problem Summary
The Rust build for brightsky-solver fails due to structural issues after refactoring modules from `subsystems/` to `module/`.

## Root Causes Identified

### 1. Module Restructuring Not Reflected in main.rs
- **Issue**: Code moved from `subsystems/` to `module/` directory
- **Impact**: `main.rs` still has `pub mod subsystems;` and `use subsystems::*;`
- **Fix**: Remove these lines, update imports from `crate::subsystems::` to `crate::module::`

### 2. Duplicate Type Definitions
- **Issue**: `main.rs` and `lib.rs` both define:
  - `HealthStatus`, `BssLevel` enums
  - `DebugIntent`, `DebuggingOrder`, `CopilotProposal` structs
  - `SystemPolicy` struct
  - `SubsystemSpecialist` trait
- **Fix**: Remove local definitions from main.rs, import from `crate::`

### 3. Missing Module Type Imports
- **Issue**: Types from modules not imported in main.rs:
  - `SolverSpecialist`, `SimulationEngine`, `LiquidityEngine`
  - `RiskEngine`, `MEVGuardEngine`, `UIGatewaySpecialist`
  - `MetricsSpecialist`, `PrivateExecutorSpecialist`
  - `P2PNBridgeSpecialist`, `MempoolIntelligenceSpecialist`
- **Fix**: Add `use crate::module::bss_XX::*` imports

### 4. Duplicate Field in WatchtowerStats
- **Issue**: `opt_convergence_rate: AtomicU64` declared twice (lines 94, 123)
- **Fix**: Remove line 123 duplicate

### 5. Missing Trait Method
- **Issue**: `get_domain_score` called on `SubsystemSpecialist` but not in trait
- **Fix**: Add method to trait in lib.rs or remove calls

### 6. Tokio API Incompatibility
- **Issue**: `tokio::io::BufReader` doesn't have `.lines()` (synchronous method)
- **Fix**: Use `AsyncBufReadExt::lines()` async method or sync reader

### 7. Other Missing Fields in WatchtowerStats
- **Issue**: References to `loss_rate_bps`, `gas_efficiency`, `uptime_percent`
- **Fix**: Add fields to WatchtowerStats or remove references

## Compiler Error Summary

### Error Codes Found:
- `E0583`: file not found for module `subsystems`, `macro_module_*`
- `E0433`: unresolved imports, unresolved modules (`bss_05_sync`, `subsystems`)
- `E0412`: cannot find types (`AutoOptimizer`, `SolverSpecialist`, etc.)
- `E0124`: field `opt_convergence_rate` already declared
- `E0599`: no method `lines` for `tokio::io::BufReader`
- `E0277`: size for `[u8]` cannot be known (related to buf reader)
- `E0407`: method `get_domain_score` not in trait
- `E0609`: no fields `loss_rate_bps`, `gas_efficiency`, `uptime_percent`
- `E0689`: can't call `min` on ambiguous float type
- `E0282`: type annotations needed for `Arc<_, _>`

## Files Modified
- `solver/src/main.rs`: Remove duplicate definitions, update imports, fix structs
- `solver/src/lib.rs`: May need `get_domain_score` added to trait

## Fix Strategy
1. Remove `subsystems` module declarations from main.rs
2. Add module type imports from `crate::module::`
3. Add crate type imports from `crate::` (lib.rs exports)
4. Remove duplicate type definitions (HealthStatus, BssLevel, etc.)
5. Remove duplicate SystemPolicy definition
6. Remove duplicate opt_convergence_rate field
7. Add missing fields to WatchtowerStats or remove references
8. Fix tokio BufReader.lines() usage
9. Add get_domain_score to SubsystemSpecialist trait

## Current Status (After Resolution)

All structural build issues have been resolved:

- ✓ Removed duplicate `PENDING_PROPOSAL` and `USED_NONCES` redefinitions in main.rs
- ✓ Removed duplicate `opt_convergence_rate` field in WatchtowerStats
- ✓ Added missing fields `loss_rate_bps`, `gas_efficiency`, `uptime_percent` to `lib.rs` WatchtowerStats
- ✓ Fixed `tokio::io::BufReader.lines()` by importing `AsyncBufReadExt`
- ✓ `get_domain_score` already present in `SubsystemSpecialist` trait (lib.rs)
- ✓ Updated all module imports from old `subsystems::` path to `brightsky_solver::module::` and removed `crate::` misreferences
- ✓ Removed duplicate type definitions: `RiskSpecialist` and `InvariantSpecialist` (now imported from library), renamed domain risk specialist to `RiskDomainSpecialist`
- ✓ Fixed duplicate imports (removed redundant `use` statements)
- ✓ Completed missing `SystemPolicy` fields in initializer (`max_position_size_eth`, `daily_loss_limit_eth`, `daily_loss_used_eth`)
- ✓ Restored missing closing brace for `run_watchtower` function
- ✓ Removed duplicate `impl AutoOptimizer` block from main.rs (methods exist in library)
- ✓ Cleaned corrupted write_all string in IPC gateway

**Build Result**: `cargo build --release` completes successfully with warnings only (unused imports/constants). No errors.

## Updated handsoff.md – Structural fixes complete, build green.
