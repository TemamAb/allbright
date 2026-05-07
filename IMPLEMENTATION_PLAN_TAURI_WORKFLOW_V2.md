# 🚀 TAURI WORKFLOW INTEGRATION IMPLEMENTATION PLAN V2
## Allbright Arbitrage Flash Loan App - Refined Workflow
### Based on User Feedback: Clear Separation of User Rights vs Deployment Readiness

---

## 📋 Key Clarification (from user feedback)

**Deployment readiness** is an **engineering/operations/admin responsibility**, NOT a user responsibility.

| Responsibility | User | Admin | Automated System (CI/CD) |
|----------------|-----|-------|---------------------------|
| Run simulation | ✅ | ✅ | ❌ |
| Run paper trading | ✅ | ✅ | ❌ |
| Run shadow mode | ❌ | ✅ | ❌ |
| **Assess deployment readiness** | ❌ | ✅ | ✅ |
| **Execute promotion** (shadow → live) | ❌ | ✅ | ✅ |

---

## 🎯 Refined Workflow Stage Definitions

### Stage 1-2: USER ACCESS (No Admin Required)
| Stage | CLI Mode | Risk | Access | Description |
|-------|---------|------|--------|-------------|
| Dev | `dev` | development | User | Local development |
| Simulation | `simulation` | testing | User | Synthetic/historical data |
| Paper Trading | `paper-trading` | low | User | Real data, NO execution |

### Stage 3-7: ADMIN ONLY (No User Access)
| Stage | CLI Mode | Risk | Access | Description |
|-------|---------|------|--------|-------------|
| Shadow Mode | `shadow` | medium | Admin | Parallel production |
| Live Simulation | `live-simulation` | high | Admin | Limited real execution |
| Canary | `canary` | high | Admin | Gradual rollout (1-25%) |
| Full Live | `live` | critical | Admin | 100% production |

---

## 🔒 Permission Model

### Two Separate Concerns

1. **Execution Rights** (WHO can start the solver)
   - User: simulation, paper-trading only
   - Admin: all modes including shadow/live

2. **Deployment Readiness** (SYSTEM state assessment)
   - User: Cannot assess/decision
   - Admin: Can assess via ReadinessReport
   - CI/CD: Automated assessment (preferred)

### Wizard Behavior by Role

```
USER ROLE:
  ├── Sees: Simulation, Paper Trading options
  ├── Cannot: See shadow/live/canary options
  ├── Cannot: View deployment readiness scores
  └── Wizard flow: Setup → Run simulation/paper

ADMIN ROLE:
  ├── Sees: ALL mode options
  ├── Can: View deployment readiness (ReadinessReport)
  ├── Can: Request promotion between stages
  └── Wizard flow: Setup → Admin panel → Select mode
```

---

## 📁 Implementation Changes Required

### Updated Files

| File | Change | Description |
|------|--------|--------------|
| `src-tauri/src/core/process_manager.rs` | Update | Remove wizard-completion-as-execution-gate |
| `src-tauri/src/commands/admin.rs` | Update | Add deployment readiness methods |
| `src-tauri/src/commands/solver.rs` | Update | Enforce user vs admin execution rights |
| `ui/src/services/tauriApi.ts` | Update | Add role-based queries |
| `ui/src/components/MissionControl.tsx` | Update | Hide modes based on role |

---

## 🛡️ Updated Guard Logic (Rust)

```rust
// Execution Rights: Who can run what
pub fn can_execute_mode(mode: &WorkflowStage, role: &UserRole) -> bool {
    match mode {
        // User accessible modes
        WorkflowStage::Dev => true,
        WorkflowStage::Simulation => true,
        WorkflowStage::PaperTrading => true,
        
        // Admin only modes
        WorkflowStage::ShadowMode => *role == UserRole::Admin,
        WorkflowStage::LiveSimulation => *role == UserRole::Admin,
        WorkflowStage::Canary => *role == UserRole::Admin,
        WorkflowStage::FullLive => *role == UserRole::Admin,
    }
}

// Deployment Readiness: Who can assess
pub fn can_assess_readiness(role: &UserRole) -> bool {
    *role == UserRole::Admin
}
```

---

## 📱 Frontend Role-Based UI

### MissionControl.tsx Updates

```typescript
interface ModeOption {
  value: WorkflowStage;
  label: string;
  requiresAdmin: boolean;
}

const MODE_OPTIONS: ModeOption[] = [
  { value: 'simulation', label: 'Simulation', requiresAdmin: false },
  { value: 'paper-trading', label: 'Paper Trading', requiresAdmin: false },
  { value: 'shadow', label: 'Shadow Mode', requiresAdmin: true },
  { value: 'live-simulation', label: 'Live Simulation', requiresAdmin: true },
  { value: 'canary', label: 'Canary', requiresAdmin: true },
  { value: 'live', label: 'Full Live', requiresAdmin: true },
];

// Filter options by role
const availableModes = MODE_OPTIONS.filter(
  m => !m.requiresAdmin || userRole === 'admin'
);
```

---

## 📊 Deployment Readiness (Admin Only)

### Admin Panel Shows

| Metric | User | Admin | Description |
|--------|------|-------|-------------|
| Current Stage | ✅ | ✅ | Active workflow mode |
| Readiness Score | ❌ | ✅ | 0-100 deployment score |
| Test Results | ❌ | ✅ | Pass/fail status |
| Config Validation | ❌ | ✅ | Secrets present check |
| Rollback Plan | ❌ | ✅ | Recovery options |
| Promotion Button | ❌ | ✅ | Move to next stage |

---

## 🚀 Elite Deployment Ladder

```
PHASE 0: DEV
  └── User/Admin: Local dev mode
       ↓ (deployment ready)
PHASE 1: SIMULATION  
  └── User/Admin: Synthetic data
       ↓ (deployment ready)
PHASE 2: PAPER TRADING
  └── User/Admin: Real data, NO execution
       ↓ (deployment ready → Admin assesses)
PHASE 3: SHADOW MODE ⚠️ ADMIN ONLY
  └── Admin: Parallel production
       ↓ (deployment ready → Admin promotes)
PHASE 4: LIVE SIMULATION ⚠️ ADMIN ONLY
  └── Admin: Limited execution ($ cap)
       ↓ (deployment ready → Admin promotes)
PHASE 5: CANARY ⚠️ ADMIN ONLY
  └── Admin: 1-25% rollout
       ↓ (deployment ready → Admin promotes)
PHASE 6: FULL LIVE ⚠️ ADMIN ONLY
  └── Admin: 100% production
```

---

## ✅ Implementation Checklist

- [x] Clarify: deployment readiness = admin/ops responsibility
- [x] Remove: wizard-completion as execution gate for users
- [x] Implement: role-based execution rights
- [x] Implement: admin-only deployment assessment
- [x] Create: refined implementation plan V2

---

**Document Version**: 2.0 (Refined per user feedback)
**Status**: Ready for Implementation
