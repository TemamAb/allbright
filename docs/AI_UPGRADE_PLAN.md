# allbright AI Integration — Elite Grade Gap Analysis & Upgrade Roadmap

**Date:** 2026-04-27  
**Auditor:** Kilo AI (External Systems Engineering)  
**Objective:** Compare current allbright AI capabilities against top-tier elite-grade standards and define implementation path to achieve them.

---

## **Executive Summary**

allbright has a **sound architectural foundation** (federated specialists, weighted GES scoring, safety layers) but **critical capability gaps** prevent it from being considered "elite grade":

| Gap Category | Current State | Elite Grade Requirement | Severity |
|--------------|---------------|------------------------|----------|
| **AI Learning** | Stub MetaLearner (hardcoded), no training data pipeline | Online learning from trade outcomes, policy adaptation | 🔴 Critical |
| **Pre-Deployment Gate** | ❌ No validation, scans start immediately | ✅ Simulation gate with GES ≥82.5% threshold | 🔴 Critical |
| **Specialist Modularity** | 15+ specialists as inline monoliths in `main.rs` (600+ LOC each) | ✅ Each specialist in isolated `.rs` file with clear API | 🟡 Medium |
| **KPI Persistence** | All metrics volatile (RAM only), no historical records | ✅ Time-series DB of all KPI snapshots for ML training | 🟡 Medium |
| **API-AI Bridge** | `specialists.ts` are empty stubs, no actual tuning logic | ✅ Node.js specialists compute and send tuning parameters | 🟡 Medium |
| **Benchmark Integration** | `benchmark-30-kpis.md` never parsed or used | ✅ Automated benchmark comparison and gap analysis | 🟡 Medium |
| **Feedback Loop** | One-way: specialists → GES → policy | ✅ Two-way: execution outcomes → MetaLearner → specialist tuning | 🟡 Medium |
| **Model serving** | Rule-based `if/else` thresholds | ✅ Configurable policies (weights, thresholds) stored externally | 🟢 Low |
| **Explainability** | Console logs only | ✅ Structured audit trail of all AI decisions with rationale | 🟢 Low |

**Bottom line:** allbright is a **rule-based automation system**, not an AI/ML system. The "AI" label is currently aspirational — there is no machine learning component anywhere in the stack.

---

## **Comparison Table: Current vs Elite Grade**

| # | Capability Domain | Current allbright Implementation | Elite Grade Standard (Top-Tier Trading Systems) | Gap Description | Priority | Estimated Effort |
|---|-------------------|----------------------------------|-----------------------------------------------|-----------------|----------|------------------|
| **1** | **Pre-Deployment Validation Gate** | No gate. Engine auto-starts scanning within 15s (`engine.ts:531`). `bss_43_simulator.run_system_audit_simulation()` exists but **never called**. | Systems must pass a **simulation gate** before LIVE deployment: <br>• Load benchmark targets from config<br>• Run 100–1000 cycle Monte Carlo sim<br>• Compute GES; require ≥82.5%<br>• Auto-tuning if GES < elite threshold<br>• Abort deployment if gate fails | **MISSING**: No validation prevents underperforming config from going live. High risk of mainnet failure. | **P0** | 2–3 days |
| **2** | **Meta-Learner (BSS-28) Training Pipeline** | `MetaLearner` struct has `success_ratio: AtomicUsize` (mock). `run_diagnostic()` returns hardcoded `model_drift: 0.02, learning_rate: 0.005`. **Never updated** from `tradesTable`. | **Online learning engine**:<br>• Ingest every trade outcome (profit, latency, slippage)<br>• Update feature vector in real-time<br>• Retrain policy weights hourly<br>• Produce tuning recommendations (e.g., "increase min_profit_bps by 5 due to rising MEV")<br>• Persist model state to disk for recovery | **STUB**: No learning occurs. System cannot adapt to market regime changes. All "AI" decisions are static rules. | **P0** | 3–5 days |
| **3** | **KPI Historical Persistence** | All metrics live in `WatchtowerStats` (atomic RAM). No DB writes except `tradesTable` and `streamEvents`. KPI snapshots **not saved**. | **Time-series warehouse**:<br>• Every 5s: snapshot all domain_scores, GES, individual KPI values → `kpi_snapshots` table<br>• Retain 90 days for drift analysis<br>• Enable offline model training<br>• Compliance audit trail | **MISSING**: Cannot analyze performance trends, train models, or debug past states. | **P0** | 1–2 days |
| **4** | **Specialist Modularization** | 15+ specialists defined **inline** in `main.rs:63-719` as `pub struct` + `impl`. Monolithic file >1900 LOC. | **One specialist per file**:<br>• `solver/src/specialists/profitability.rs`<br>• `solver/src/specialists/risk.rs`<br>• Each implemented as **library crate** with clear trait bounds<br>• Independent unit tests<br>• Faster compile times | **POOR STRUCTURE**: Hard to test, review, or replace individual AI agents. Violates single responsibility. | **P1** | 2–3 days |
| **5** | **API ↔ Rust AI Bridge** | `api/src/lib/specialists.ts` — all 7 classes return **empty stubs** (`return { tuned: true, nrp_target: 22.5 }`). No actual AI logic in Node.js layer. | **Bidirectional sync**:<br>• Node.js specialists implement real tuning logic (e.g., Bayesian optimization)<br>• Periodically push tuning params to Rust via IPC (`policy_tx`)<br>• Rust acknowledges and applies<br>• Full round-trip test coverage | **NON-FUNCTIONAL**: Node.js AI layer is a placeholder. All intelligence lives (statically) in Rust. | **P1** | 3–4 days |
| **6** | **Benchmark Target Management** | `benchmark-30-kpis.md` is **static markdown**. Never parsed. No code references it. | **Dynamic benchmark service**:<br>• `BenchmarkManager` loads targets at startup<br>• Supports per-chain, per-protocol adjustments<br>• API endpoint `/api/benchmarks` exposes current targets<br>• Auto-update from remote config (feature flag) | **UNUSED**: Benchmarks are documentation, not living targets. | **P1** | 1 day |
| **7** | **Bribe Engine State Sync** | `allbrightBribeEngine` lives **only in Node.js** (`api/src/lib/bribeEngine.ts`). Tuning updated after trades (`engine.ts:1170-1185`), but **Rust solver never sees these values**. | **Single source of truth**:<br>• Bribe parameters (`MIN_MARGIN_RATIO`, `BRIBE_RATIO`) stored in `WatchtowerStats`<br>• Both Rust and Node.js read from shared memory (IPC)<br>• Updates原子化 via `policy_tx` broadcast | **SYNC BREAK**: Node.js and Rust can diverge on bribe strategy, causing inconsistent profit calculations. | **P1** | 2 days |
| **8** | **Circuit Breaker Auto-Reset** | `CircuitBreaker::is_tripped()` checks threshold; once tripped, `blockedUntil` set to `now + 3min`. **No auto-recovery** — requires manual intervention or engine restart. | **Progressive recovery**:<br>• After cooldown, allow 1 trial transaction<br>• If success → reset; if fail → extend cooldown<br>• Health probe every 30s during blocked period<br>• Dashboard alert with "Reset Now" button | **FRAGILE**: Single trip halts all trading until timeout. No self-healing. | **P2** | 1 day |
| **9** | **Domain Score Normalization** | Each specialist computes `domain_score_X` differently (e.g., Profit: `(actual/22.5).min(1.0)`; Risk: `(50/loss_rate).min(1.0)`). No centralized normalization. | **Standardized scoring framework**:<br>• All scores ∈ [0, 1] with clear mapping function<br>• Documented inverse/linear/log scaling per domain<br>• Unit tests verify score bounds under edge cases | **INCONSISTENT**: Risk score can be NaN if `loss_rate=0`? Need defensive checks. | **P2** | 1 day |
| **10** | **GES Weight Authority** | Weights defined in **three places**:<br>1. `bss_36_auto_optimizer.rs:114-119` (0.30, 0.20, …)<br>2. `main.rs:54-60` (WEIGHT_* constants, unused)<br>3. `benchmark-30-kpis.md` (text description) | **Single source of truth**:<br>• `lib.rs` defines `pub const GES_WEIGHTS: GESWeights`<br>• All consumers import from lib<br>• Compile-time check: `weights.sum() == 1.0 ± 0.001`<br>• Dashboard displays current weights | **DRIFT RISK**: Weights can diverge across files, causing GES mis-calculation. | **P2** | 0.5 day |
| **11** | **Alpha-Copilot Audit Trail** | `PENDING_PROPOSAL` stored in `lazy_static! Mutex<Option<CopilotProposal>>`. Volatile; lost on restart. No DB table for proposals or decisions. | **Audit log**:<br>• `copilot_proposals` table: id, description, impact, status (pending/approved/rejected), created_by, approved_by, timestamp<br>• `copilot_actions` table: every `execute_confirmed_update()` logged<br>• Immutable, append-only for compliance | **NO HISTORY**: Cannot reconstruct why a change was made post-mortem. | **P2** | 1–2 days |
| **12** | **Shadow Mode Visibility** | `sharedEngineState.shadowModeActive` exists, but UI shows no banner/warning. Operators may think system is LIVE when it's simulating. | **UI enforcement**:<br>• Dashboard displays prominent SHADOW badge<br>• Block `POST /engine/start` if mode=LIVE but `shadowModeActive=true`<br>• Alert: "System degraded — performance below threshold" | **OPERATOR RISK**: Unclear operational state could lead to accidental live deployment. | **P3** | 0.5 day |
| **13** | **Specialist Test Coverage** | Zero unit tests found for any specialist. `#[cfg(test)]` modules absent. | **Mandatory tests**:<br>• Each specialist has ≥80% line coverage<br>• Property tests: domain_score always ∈ [0,1]<br>• Regression tests against benchmark targets<br>• CI fails on coverage drop | **UNTESTED**: AI logic could silently regress. | **P3** | 2–3 days |
| **14** | **Explainable AI (XAI)** | `ai_insight()` returns free-text strings. No structured rationale for decisions (e.g., "why was this trade rejected?"). | **Decision logging**:<br>• Every `execute_remediation` call logs: specialist, command, pre-state, post-state, rationale<br>• Exposed via `/api/ai/decisions?hours=24`<br>• Integrate with SHAP/LIME for feature importance | **BLACK BOX**: Cannot explain to users why KPI drifted or why a trade was blocked. | **P3** | 2–3 days |
| **15** | **Model Drift Detection** | `MetaLearner` reports static `model_drift: 0.02`. No actual drift monitoring. | **Statistical drift alerts**:<br>• Compare recent 100-trade profit distribution vs historical baseline<br>• KS-test or PSI > threshold → alert<br>• Auto-trigger MetaLearner retrain if drift detected | **UNMONITORED**: Model could decay without notification. | **P3** | 2 days |

---

## **Recommendations & Implementation Plan**

### **Phase 0: Foundation (Week 1) — "Gatekeeper Infrastructure"**

**Objective:** Establish single source of truth for benchmarks, weights, and KPI persistence.

#### **Task 0.1 — Centralize GES Weights (P2)**
- **File:** `solver/src/lib.rs:92` — add `pub const GES_WEIGHTS: [f64; 6]`
- **Change:**
  ```rust
  pub const GES_WEIGHTS: [f64; 6] = [0.30, 0.20, 0.20, 0.10, 0.10, 0.10];
  ```
- Remove all `const WEIGHT_*` from `main.rs`
- Update `bss_36_auto_optimizer.rs` to import `crate::GES_WEIGHTS`
- **Test:** assert `(GES_WEIGHTS.iter().sum::<f64>() - 1.0).abs() < 0.001`
- **Effort:** 30 min

#### **Task 0.2 — Create Benchmark Target Service (P1)**
- **New file:** `solver/src/benchmarks.rs`
  ```rust
  pub struct BenchmarkTargets { /* fields from benchmark-30-kpis.md table */ }
  pub fn load_benchmarks() -> Result<BenchmarkTargets, Error> { /* parse markdown or use defaults */ }
  ```
- **API endpoint:** `GET /api/benchmarks` → returns current targets
- **Integration:** Load at startup, store in `WatchtowerStats` or global config
- **Effort:** 2h

#### **Task 0.3 — KPI Snapshot Persistence (P0)**
- **DB table:** `kpi_snapshots` (id, timestamp, domain_score_profit, …, total_weighted_score)
- **New task:** `solver/src/main.rs:run_watchtower` — every 5min, insert snapshot
  ```rust
  if now % 300 == 0 { /* save snapshot */ }
  ```
- **Migration:** SQL script; add index on `(timestamp DESC)`
- **Effort:** 2h (DB) + 1h (Rust) = 3h

---

### **Phase 1: Gatekeeper (Week 1–2) — "Pre-Deployment Validation"**

#### **Task 1.1 — Implement Phase 1.5 KPI Sim Gate (P0) ⚠️ CRITICAL**
- **File:** `solver/src/module/bss_43_simulator.rs`
- **New function:** `pub async fn validate_deployment_gate(stats: &WatchtowerStats, graph: &GraphPersistence, benchmarks: &BenchmarkTargets) -> GateResult`
  1. Load `BenchmarkTargets` from config
  2. Call `Self::run_system_audit_simulation()` (existing) with 100 cycles
  3. Compute final GES using `AutoOptimizer::calculate_global_efficiency_score()` on simulation stats
  4. Compare each KPI to benchmark; collect gaps
  5. Return `Pass { ges }` or `Fail { ges, gaps: Vec<(kpi, actual, target)> }`
- **Hook:** `api/src/routes/engine.ts:autoStartEngine()` — **before** `setInterval(scanCycle)`:
  ```typescript
  const gate = await bss43.validate_deployment_gate(sharedEngineState, graph, benchmarks);
  if (!gate.passed) {
    logger.error("Deployment gate failed", { ges: gate.ges, gaps: gate.gaps });
    throw new Error(`GES ${(gate.ges*100).toFixed(1)}% < 82.5% threshold — fix KPIs before deployment`);
  }
  ```
- **Test:** Unit test simulating GES=0.80 → rejects; GES=0.83 → accepts
- **Effort:** 4h (Rust gate) + 2h (TypeScript hook) + 2h (tests) = **1 day**

#### **Task 1.2 — Auto-Tuner Integration (P0)**
- If gate fails (GES < 0.825), **automatically trigger** `AutoOptimizer.execute_remediation("COMMIT_OPTIMIZATION")` and retry after 10min
- **Config:** `MAX_GATE_RETRIES: u32 = 3` (prevent infinite loop)
- **Effort:** 2h

---

### **Phase 2: Learning Core (Week 2–3) — "MetaLearner Activation"**

#### **Task 2.1 — Trade Outcome Observer (P0)**
- **New file:** `solver/src/bss_28_meta_learner.rs` (replace stub in `main.rs`)
  ```rust
  pub struct MetaLearner {
      success_ratio: AtomicUsize,     // Moving average (EMA α=0.1)
      profit_momentum: AtomicF64,     // Δ(profit_24h) – trend detection
      adversarial_intensity: AtomicUsize, // risk events / hour
      last_update: AtomicU64,         // timestamp of last model update
  }
  ```
- **Method:** `observe_trade(&self, trade: &TradeRecord)` — called after each `tradesTable.insert()` in `engine.ts`
  - Update EMA: `success_ratio = 0.9*old + 0.1*(if success {1} else {0})`
  - Track profit trend (last 100 trades avg vs previous 100)
  - Increment `adversarial_intensity` if `trade.latencyMs > 500` or tx revert
- **Effort:** 3h (Rust) + 1h (IPC bridge) + 1h (tests) = **1 day**

#### **Task 2.2 — Policy Recommendation Engine (P0)**
- Add to `MetaLearner`:
  ```rust
  pub fn get_recommendation(&self) -> PolicyDelta {
      if self.success_ratio.load() < 8000 { // <80%
          PolicyDelta { min_profit_bps_delta: +5, max_hops_delta: -1, .. }
      }
      if self.profit_momentum.load() < -0.5 { // profit declining
          PolicyDelta { min_profit_bps_delta: +3, .. }
      }
      // … more rules
  }
  ```
- `AutoOptimizer` reads recommendation and applies (clamped to bounds)
- **Effort:** 2h

#### **Task 2.3 — Model Persistence (P1)**
- Save `MetaLearner` state to `model_state.json` every hour
- Load on startup to recover learning
- **Effort:** 1h

---

### **Phase 3: Bridge Unification (Week 3) — "API–AI Sync"**

#### **Task 3.1 — Replace API Specialists Stubs (P1)**
- **Files:** `api/src/lib/specialists.ts` — implement each tuning method
- **Pattern:** Each specialist analyzes KPI gap and returns tuning suggestions:
  ```typescript
  async tuneKpis(data: any) {
    const ges = data.total_weighted_score / 10;
    if (ges < 85) {
      return { tuned: true, actions: [{ subsystem: "BSS-36", param: "min_profit_bps", delta: +5 }] };
    }
    return { tuned: false, reason: "GES sufficient" };
  }
  ```
- **AlphaCopilot.orchestrateSpecialists()** collects all suggestions, dedupes, returns unified plan
- **Effort:** 4h

#### **Task 3.2 — Bribe Engine State Sharing (P1) ⚠️ SYNC FIX**
- **Problem:** Node.js `allbrightBribeEngine` tuning diverges from Rust policy
- **Solution A (Preferred):** Move bribe tuning into `WatchtowerStats`:
  ```rust
  pub struct WatchtowerStats {
      // … existing
      pub min_margin_ratio_bps: AtomicU64,  // e.g., 1000 = 10%
      pub bribe_ratio_bps: AtomicU64,       // e.g., 500 = 5%
  }
  ```
- Node.js reads these via IPC heartbeat; updates via `policy_tx`
- **Effort:** 2h (Rust) + 2h (Node.js sync) = **0.5 day**

#### **Task 3.3 — Full KPI Round-Trip Validation (P1)**
- Add integration test: trade → DB → MetaLearner observation → policy adjustment → next trade
- Verify success_ratio moves meaningfully
- **Effort:** 3h

---

### **Phase 4: Modularization (Week 4) — "Code Health"**

#### **Task 4.1 — Extract Specialists to Separate Files (P2)**
Move inline specialists from `main.rs` (lines 63–719) into:

| From | To |
|------|----|
| `ProfitSpecialist` (BSS-47) | `solver/src/specialists/profitability.rs` |
| `RiskDomainSpecialist` (BSS-48) | `solver/src/specialists/risk.rs` |
| `ExecutionSpecialist` (BSS-49) | `solver/src/specialists/performance.rs` |
| `EfficiencySpecialist` (BSS-50) | `solver/src/specialists/efficiency.rs` |
| `HealthSpecialist` (BSS-51) | `solver/src/specialists/health.rs` |
| `AutoOptimizer` (already separate) | keep |
| `DashboardSpecialist` (already in lib.rs) | keep |

Each file:
```rust
use crate::{WatchtowerStats, SubsystemSpecialist, HealthStatus, ...};
pub struct ProfitSpecialist { pub stats: Arc<WatchtowerStats> }
impl SubsystemSpecialist for ProfitSpecialist { ... }
```

- Update `main.rs` to `use` from new paths
- **Effort:** 4h per specialist × 5 = **1 day**

#### **Task 4.2 — Create Specialist Mod Tree (P2)**
- Create `solver/src/specialists/mod.rs` re-exporting all
- Update `lib.rs` to include specialists module
- **Effort:** 1h

---

### **Phase 5: Observability & Explainability (Week 5) — "Audit & Compliance"**

#### **Task 5.1 — Decision Audit Log (P2)**
- **DB table:** `ai_decisions` (id, timestamp, specialist, command, pre_state_json, post_state_json, rationale, initiated_by)
- Instrument:
  - `AlphaCopilot::process_command()` — log proposal
  - `AutoOptimizer::tune_engine_parameters()` — log deltas
  - `MetaLearner::get_recommendation()` — log recs
- **API:** `GET /api/ai/decisions?hours=24` → JSON
- **Effort:** 3h

#### **Task 5.2 — XAI Rationale per Trade (P3)**
- When trade executed, capture:
  - `ges_at_execution`
  - `policy_snapshot` (min_profit_bps, max_hops, shadow_mode)
  - `specialist_scores` (7 domain scores)
  - `meta_recommendation` (if any)
- Store in `tradesTable` as JSONB `ai_context`
- **Effort:** 2h

#### **Task 5.3 — Drift Detection Alerts (P3)**
- Background job: every hour, compare last 100 trades vs previous 100
- If KS-test p-value < 0.01 or profit mean shift > 2σ → alert
- Push to `telemetry` channel; UI shows banner
- **Effort:** 3h

---

### **Phase 6: Safety Hardening (Week 6) — "Fail-Safes"**

#### **Task 6.1 — Circuit Breaker Auto-Reset (P2)**
- After `blockedUntil` expires, allow **1 probe trade** (min size, safe pair)
- If probe succeeds → reset breaker; if fails → extend cooldown ×2
- **Effort:** 2h

#### **Task 6.2 — Shadow Mode UI Enforcement (P3)**
- Dashboard shows red banner when `shadowModeActive=true`
- Disable "Start LIVE" button if shadow active; require manual acknowledgment
- **Effort:** 1h

#### **Task 6.3 — Gate Retry Logic (P0)**  
- Already in Task 1.2 — but ensure **exponential backoff** and **max 3 attempts**
- On final failure, send alert to PagerDuty/Slack webhook
- **Effort:** 1h

---

## **Implementation Checklist (TODO.md Format)**

```markdown
# allbright AI Upgrade — Implementation TODO

## Phase 0: Foundation (Day 1)

- [ ] **0.1** Centralize GES weights in `lib.rs` as `GES_WEIGHTS` constant
- [ ] **0.2** Create `solver/src/benchmarks.rs` with `BenchmarkTargets` struct
- [ ] **0.3** Add `kpi_snapshots` DB table + migration
- [ ] **0.4** Instrument `run_watchtower` to insert KPI snapshot every 5min
- [ ] **0.5** Update `bss_36_auto_optimizer.rs` to use `crate::GES_WEIGHTS`
- [ ] **0.6** Remove duplicate `WEIGHT_*` constants from `main.rs`

## Phase 1: Gatekeeper (Days 2–3)

### Pre-Deployment Validation
- [ ] **1.1** Implement `bss_43_simulator::validate_deployment_gate()`
  - [ ] Load benchmarks from config
  - [ ] Run 100-cycle simulation (reuse `run_system_audit_simulation`)
  - [ ] Compute GES from simulation stats
  - [ ] Compare all 30 KPIs to targets; collect gaps
  - [ ] Return `GateResult::Pass/Fail`
- [ ] **1.2** Add gate check in `api/src/routes/engine.ts:autoStartEngine()`
  - [ ] `const gate = await bss43.validate_deployment_gate(...)`
  - [ ] `if (!gate.passed) throw new Error(...)`
  - [ ] Log failure reason to `stream_events`
- [ ] **1.3** Write unit tests for gate:
  - [ ] `test_gate_passes_when_ges_83()`
  - [ ] `test_gate_fails_when_ges_80()`
  - [ ] `test_gate_rejects_when_profit_below_target()`

### Auto-Retry (Day 3)
- [ ] **1.4** If gate fails, automatically call `AutoOptimizer.execute_remediation("COMMIT_OPTIMIZATION")`
- [ ] **1.5** Retry up to 3 times with 10min backoff
- [ ] **1.6** On final failure, send webhook alert to ops channel

**Phase 1 Acceptance Criteria:**
- ✓ `cargo test` passes for gate module
- ✓ Engine refuses to start if GES < 0.825 (verified with mock stats)
- ✓ Gate logs detailed gap report to `stream_events`

## Phase 2: Learning Core (Days 4–6)

### MetaLearner Activation
- [ ] **2.1** Create `solver/src/bss_28_meta_learner.rs` (move out of `main.rs`)
  - [ ] Struct: `success_ratio: AtomicUsize` (EMA), `profit_momentum: AtomicF64`, `adversarial_intensity: AtomicU64`
  - [ ] Method: `observe_trade(&self, trade: &TradeRecord)` — updates all metrics
  - [ ] Method: `get_recommendation(&self) -> PolicyDelta` — returns tuning hints
- [ ] **2.2** Remove `MetaLearner` definition from `main.rs` (lines 550-572) and add `use crate::bss_28_meta_learner::MetaLearner`
- [ ] **2.3** Add IPC method: Rust → Node.js `meta_learner.observe_trade(trade_json)` called from `engine.ts` after DB insert
- [ ] **2.4** Instrument `engine.ts:1254` (`db.insert(tradesTable)`) to also call `metaLearner.observeTrade()`
- [ ] **2.5** Connect `AutoOptimizer` to MetaLearner:
  - [ ] In `tune_engine_parameters()`, also fetch `meta_recommendation`
  - [ ] Apply `meta_recommendation.delta` clamped to safe bounds

### Model Persistence
- [ ] **2.6** Implement `MetaLearner::save_state(path)` and `load_state(path)`
- [ ] **2.7** Call `save_state` every hour; load on `MetaLearner::new()`
- [ ] **2.8** Add CLI command: `cargo run -- meta-learner status` to inspect state

**Phase 2 Acceptance Criteria:**
- ✓ After 50 trades, `success_ratio` changes from default 95 to observed value
- ✓ MetaLearner produces non-null `PolicyDelta` when profit trend negative
- ✓ State file persists across restarts

## Phase 3: Bridge Unification (Days 7–8)

### API Specialists Activation
- [ ] **3.1** Implement real tuning logic in `api/src/lib/specialists.ts`
  - [ ] `ProfitabilitySpecialist.tuneKpis()` — if NRP < 20 ETH/day, suggest increase `min_profit_bps`
  - [ ] `PerformanceSpecialist.tuneKpis()` — if latency > 15ms, suggest reduce `max_hops`
  - [ ] … (all 7 specialists)
- [ ] **3.2** `AlphaCopilot.orchestrateSpecialists()` aggregates suggestions, dedupes, returns prioritized plan
- [ ] **3.3** Add endpoint `POST /api/ai/tune` — triggers full KPI tune cycle, returns actions

### Bribe Engine State Sync (CRITICAL)
- [ ] **3.4** Add bribe tuning fields to `WatchtowerStats`:
  ```rust
  pub min_margin_ratio_bps: AtomicU64,
  pub bribe_ratio_bps: AtomicU64,
  ```
- [ ] **3.5** Initialize these from `policy_tx` initial `SystemPolicy` (extend policy struct)
- [ ] **3.6** In `engine.ts`, **read** bribe params from `sharedEngineState` (populated from IPC)
- [ ] **3.7** In `engine.ts:1170`, **write** updated tuning via `policy_tx` (IPC message) instead of local-only
- [ ] **3.8** Verify round-trip: Node.js updates → Rust receives → next trade uses new values

**Phase 3 Acceptance Criteria:**
- ✓ `GET /api/ai/tune` returns non-empty `actions` array when GES degraded
- ✓ Bribe ratio in Node.js matches value in Rust `WatchtowerStats`
- ✓ Trade execution logs show "using bribe_ratio=500bps" from shared state

## Phase 4: Modularization (Day 9)

### Specialist Extraction
- [ ] **4.1** Create `solver/src/specialists/` directory
- [ ] **4.2** Move `ProfitSpecialist` from `main.rs:72-96` → `specialists/profitability.rs`
- [ ] **4.3** Move `RiskDomainSpecialist` → `specialists/risk.rs`
- [ ] **4.4** Move `ExecutionSpecialist` → `specialists/performance.rs`
- [ ] **4.5** Move `EfficiencySpecialist` → `specialists/efficiency.rs`
- [ ] **4.6** Move `HealthSpecialist` → `specialists/health.rs`
- [ ] **4.7** Update `main.rs` to `use` from `crate::specialists::*`
- [ ] **4.8** Update `lib.rs` to re-export specialists if needed
- [ ] **4.9** Compile and fix imports

**Phase 4 Acceptance Criteria:**
- ✓ `cargo build --release` succeeds with no warnings about unused imports
- ✓ All specialist unit tests pass (add tests if missing)

## Phase 5: Observability (Days 10–11)

### Audit Logging
- [ ] **5.1** Create `solver/src/audit_log.rs` with `AuditEntry` struct
- [ ] **5.2** Add `fn log_decision(entry: AuditEntry)` to `run_watchtower`
- [ ] **5.3** Log every `specialist.execute_remediation()` call
- [ ] **5.4** Log every `AutoOptimizer.tune_engine_parameters()` call
- [ ] **5.5** Create `kpi_snapshots` background writer task
- [ ] **5.6** API endpoint `GET /api/ai/decisions?since=…` returns audit log JSON
- [ ] **5.7** Add `ai_context` column to `tradesTable` (Drizzle) — store GES, policy, scores at trade time

### Explainability
- [ ] **5.8** `AlphaCopilot.generate_bottleneck_report()` includes timestamped score history
- [ ] **5.9** Add `GET /api/kpi/history?domain=profit&hours=24` endpoint
- [ ] **5.10** UI chart: GES trend over time (from `kpi_snapshots`)

**Phase 5 Acceptance Criteria:**
- ✓ Can reconstruct full AI decision timeline for any trade via `/api/ai/decisions?trade_id=…`
- ✓ Dashboard displays GES chart with 24h history

## Phase 6: Safety Hardening (Day 12)

### Circuit Breaker Auto-Reset
- [ ] **6.1** Modify `registerExecutionFailure()` to set `blockedUntil = now + cooldown_ms` (already)
- [ ] **6.2** After cooldown, allow 1 probe trade (flag `probe=true` in `scanCycle`)
- [ ] **6.3** If probe succeeds → `registerSuccess()` resets; if fail → double cooldown (max 30min)
- [ ] **6.4** Log probe attempts to `stream_events`

### UI Improvements
- [ ] **6.5** Dashboard top bar: red banner if `shadowModeActive`
- [ ] **6.6** Engine start modal: disable LIVE radio if `shadowModeActive=true`; show tooltip "System degraded — fix KPIs first"
- [ ] **6.7** Add "Run KPI Gate Check" manual button in Settings (for testing)

**Phase 6 Acceptance Criteria:**
- ✓ Circuit breaker auto-resets after successful probe
- ✓ UI shows SHADOW mode warning prominently

## Phase 7: Advanced AI (Week 7–8) — "Predictive Optimization"

### BSS-28: Real Meta-Learner Model
- [ ] **7.1** Define feature vector: `[latency_ms, gas_efficiency, profit_margin_bps, chain_id, protocol_hash, hour_of_day, prev_3_trades_success_rate]`
- [ ] **7.2** Implement lightweight online linear model (no external deps):
  ```rust
  struct LinearModel { weights: Vec<f64>, bias: f64 }
  impl LinearModel { fn predict(&self, x: &[f64]) -> f64 { … } }
  ```
- [ ] **7.3** Train on each new trade with SGD learning rate 0.01
- [ ] **7.4** Model predicts `success_probability` — if < 0.7, suggest `min_profit_bps +10`
- [ ] **7.5** Persist model weights to `model_state.json`

### Bayesian Tuning for Bribe Engine
- [ ] **7.6** Model: `NetProfit ~ N(μ, σ²)` where μ depends on `bribe_ratio`, `min_margin`
- [ ] **7.7** Thompson Sampling: sample from posterior, pick best arm (tuning)
- [ ] **7.8** Update posterior after each trade outcome
- [ ] **7.9** Store posterior params in `WatchtowerStats`

**Effort:** 3–5 days (research-grade; optional stretch)

---

## **Verification & Sign-Off Criteria**

### **Build & Test**
- `cargo build --release` — 0 errors, < 10 warnings (unused imports allowed)
- `cargo test` — all tests pass (aim for >70% coverage on specialists)
- `npm run build` — API compiles

### **Runtime Validation**
1. **Gate check:** `systemctl start allbright` → logs must show `[BSS-43] GATE CHECK: GES = XX.X% ≥ 82.5% — PASS`
2. **KPI snapshots:** `psql` query `SELECT COUNT(*) FROM kpi_snapshots WHERE timestamp > now() - interval '1 hour'` → >12 entries (5min interval)
3. **MetaLearner:** After 100 trades, `SELECT success_ratio FROM meta_learner_state` should be ≠ initial 9500
4. **Bribe sync:** Compare `min_margin_ratio_bps` from Rust IPC heartbeat vs Node.js `allbrightBribeEngine.getTuning().MIN_MARGIN_RATIO` — must match

### **Performance**
- Added KPI snapshot task: < 50ms overhead per 5min cycle
- MetaLearner update: < 1ms per trade
- Gate simulation: < 30s at startup (100 cycles)

---

## **Rollout Plan**

1. **Week 1:** Deploy Phase 0–1 to staging (non-production cluster)
   - Verify gate blocks deployment when benchmarks artificially lowered
   - Confirm auto-retry after temporary fix

2. **Week 2:** Deploy Phase 2–3 to staging
   - Feed historical trades (last up to AI training start)
   - Verify MetaLearner produces non-default recommendations

3. **Week 3:** Deploy Phase 4–5 to production (behind feature flag)
   - Monitor KPI snapshot ingestion
   - Validate audit log completeness

4. **Week 4:** Enable Phase 6 (circuit breaker auto-reset) in production
   - Monitor probe trade success rate

5. **Week 7–8:** Optional Phase 7 if MetaLearner stable; else postpone to v2

---

## **Risk Assessment**

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Gate blocks all deployments (GES never reaches 82.5%) | High | Make threshold configurable via env `GATE_THRESHOLD_PCT`; override flag `SKIP_GATE=true` for emergency (audit-logged) |
| MetaLearner poisoned by early bad trades | Medium | Warm-start with synthetic data from backtest; require min 100 trades before recommendations used |
| IPC bridge overload from extra KPI snapshots | Low | Batch snapshot writes every 5min (not per specialist); use `broadcast` channel |
| Bribe sync race condition | Medium | Use `AtomicU64` for bribe params; single-writer policy (AutoOptimizer) |
| Specialist modularization breaks compile | High | Incremental move: move one specialist at a time, compile-test before proceeding |

---

## **Conclusion**

allbright's **architectural vision** for a federated AI agent system is sound and matches elite trading system design patterns (e.g., Citadel, Jump Trading). However, the **implementation is currently at 30% maturity**:

✅ **Strong foundations:** trait-based specialists, GES scoring, safety layers  
❌ **Missing core:** No learning, no pre-deployment gate, no persistence, no API bridge

**To achieve elite grade**, immediately prioritize:
1. **Phase 1.5 gate** — prevents catastrophic mainnet launch with bad parameters
2. **MetaLearner activation** — without learning, system cannot adapt
3. **KPI persistence** — required for any ML training

With **6–8 development weeks** following this roadmap, allbright can reach **production-grade AI integration** suitable for mainnet arbitrage at scale.

**Next step:** Create `TODO.md` with above tasks, assign owners, and begin Phase 0.
