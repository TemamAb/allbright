# Allbright Desktop App - Analysis and Phase-by-Phase Implementation Plan

## Executive Summary

This document provides a comprehensive analysis of the Allbright Tauri Desktop Application status and establishes a clear phase-by-phase implementation plan for completing the desktop app.

**Current Status:** Tauri v2.6.0 infrastructure is in place with workflow stage management, but the frontend build directory is missing, preventing compilation.

---

## Phase Analysis

### Phase 1: Foundation Status ✅ COMPLETE

| Component | Status | Details |
|-----------|--------|---------|
| Tauri Shell | ✅ Ready | v2.6.0 (downgraded from unavailable v2.11.0) |
| Process Manager | ✅ Ready | 7-stage workflow management implemented |
| Command Handlers | ✅ Ready | Solver, Admin, Readiness modules complete |
| Window Config | ✅ Ready | 1200x800, min 1000x600 |

**Evidence from code:**
- `tauri/src-tauri/src/core/process_manager.rs` - Full workflow stage enum with 7 stages
- `tauri/src-tauri/src/commands/solver.rs` - Start/stop/status commands with stage validation
- `tauri/src-tauri/src/commands/admin.rs` - Role management and wizard completion

---

### Phase 2: Build Issues Identified

**Critical Blocker:**
```
frontendDist path "../build" does not exist
```

The Tauri config expects the frontend to be built to `tauri/build`, but this directory doesn't exist because the frontend hasn't been built yet.

**Additional Issue (Fixed):**
- `tauri_plugin_autostart::InitExt` not found → Simplified API usage

---

### Phase 3: Workflow Stages Implementation

The desktop app implements a 7-stage risk progression model:

```
┌─────────────────────────────────────────────────────────────────┐
│  WORKFLOW STAGES (Risk Progression)           │
├─────────────────────────────────────────────────────────────────┤
│  Stage 1: dev              → development │
│  Stage 2: simulation       → testing    │
│  Stage 3: paper-trading     → low risk  │
│  Stage 4: shadow          → medium    │
│  Stage 5: live-simulation → high      │
│  Stage 6: canary         → high      │
│  Stage 7: live           → CRITICAL │
└─────────────────────────────────────────────────────────────────┘
```

**Stage Validation Logic:**
- Shadow/live stages require Admin privileges
- LiveSimulation/Canary/FullLive require wizard completion

---

## Implementation Plan

### Phase A: Frontend Build (Immediate)

**Task A1: Build the React Frontend**
```bash
cd c:/Users/op/Desktop/allbright/tauri
pnpm build
```

This creates the required `tauri/build` directory.

**Task A2: Verify Tauri Compilation**
```bash
cd c:/Users/op/Desktop/allbright/tauri/src-tauri
cargo check
```

---

### Phase B: Backend Integration (If Needed)

**Task B1: Build Optional Rust Solver Binary**
```bash
cd c:/Users/op/Desktop/allbright/solver
cargo build --release
# Output: solver/target/release/allbright
```

The solver binary can be bundled with the desktop app for offline operation.

---

### Phase C: Desktop Build & Distribution

**Task C1: Build Windows Executable**
```bash
cd c:/Users/op/Desktop/allbright/tauri
pnpm tauri build
```

**Task C2: Output Location**
```
tauri/target/release/bundle/
└── msi/          # Windows installer
└── nsis/         # Portable executable
```

---

## Current Code Structure

### Core Files Verified

| File | Purpose | Status |
|------|---------|--------|
| `src-tauri/src/lib.rs` | App entry + plugin registration | ✅ |
| `src-tauri/src/main.rs` | Binary entry | ✅ |
| `src-tauri/src/core/process_manager.rs` | Workflow state | ✅ |
| `src-tauri/src/commands/solver.rs` | Solver lifecycle | ✅ |
| `src-tauri/src/commands/admin.rs` | User roles | ✅ |
| `src-tauri/src/commands/readiness.rs` | Deployment checks | ✅ |
| `src-tauri/src/tray_icon.rs` | System tray | ✅ |
| `tauri.conf.json` | App configuration | ✅ |

### Workflow Stage Enum (process_manager.rs)

```rust
#[derive(Debug, Clone, PartialEq)]
pub enum WorkflowStage {
    Dev,
    Simulation,
    PaperTrading,
    ShadowMode,
    LiveSimulation,
    Canary,
    FullLive,
}
```

Each stage has:
- `requires_admin()` → bool
- `risk_level()` → &str

---

## Key Implementation Details

### Admin Role System

- **Default role:** User (non-privileged)
- **Admin privileges required for:** Shadow, LiveSimulation, Canary, FullLive modes
- **Wizard completion required for:** LiveSimulation, Canary, FullLive modes

### Safety Features

1. **Stage validation** - Admin/wizard checks before execution
2. **Exposure limits** - Configurable cap for live-simulation mode
3. **Role isolation** - Admin/User mode separation
4. **Wizard completion gate** - Prevents accidental live trading

---

## Next Steps

### Immediate Actions Required

1. **Build frontend:**
   ```bash
   cd c:/Users/op/Desktop/allbright/tauri && pnpm build
   ```

2. **Verify Rust compilation:**
   ```bash
   cd c:/Users/op/Desktop/allbright/tauri/src-tauri && cargo check
   ```

3. **Build desktop app:**
   ```bash
   cd c:/Users/op/Desktop/allbright/tauri && pnpm tauri build
   ```

---

## Version Compatibility Note

**Resolved:** Tauri version was specified as 2.11.0 which doesn't exist. Changed to 2.6.0 in:
- `tauri/src-tauri/Cargo.toml`
- Both `tauri-build` and `tauri` dependencies updated

---

**Document Version:** 1.0
**Analysis Date:** 2024
**Status:** Infrastructure Complete, Build Pending Frontend
