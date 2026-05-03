# allbright AI Integration — Elite Upgrade TODO

**Owner:** Engineering Team  
**Target:** Achieve elite-grade AI integration (Phase 1–7)  
**Timeline:** 6–8 weeks  
**Last Updated:** 2026-04-27  

---

## **Legend**

- **[ ]** Not started
- **[~]** In progress
- **[✓]** Complete
- **P0** — Critical (deployment blocker)
- **P1** — High (safety/functionality)
- **P2** — Medium (maintainability)
- **P3** — Low (polish/observability)

---

## **Phase 0: Foundation (Week 1) — "Single Source of Truth"**

**Goal:** Eliminate configuration drift; establish benchmark authority.

### **Task 0.1 — Centralize GES Weights**
- **Priority:** P2
- **Effort:** 30 min
- **Files:**
  - `solver/src/lib.rs` (add constant)
  - `solver/src/main.rs` (remove WEIGHT_*)
  - `solver/src/bss_36_auto_optimizer.rs` (import instead of local)
- **Steps:**
  - [ ] Add to `lib.rs` after `TARGET_TOTAL_SCORE_PCT`:
    ```rust
    pub const GES_WEIGHTS: [f64; 6] = [0.30, 0.20, 0.20, 0.10, 0.10, 0.10];
    ```
  - [ ] Add compile-time test in `lib.rs`:
    ```rust
    #[test] fn test_ges_weights_sum_to_one() {
        assert!((GES_WEIGHTS.iter().sum::<f64>() - 1.0).abs() < 0.001);
    }
    ```
  - [ ] Delete lines 54-60 in `main.rs` (WEIGHT_PROFITABILITY…WEIGHT_DASHBOARD)
  - [ ] In `bss_36_auto_optimizer.rs` line 1: add `GES_WEIGHTS` to import
  - [ ] Replace inline weights at lines 114-119 with:
    ```rust
    const W_PROFIT: f64 = crate::GES_WEIGHTS[0];
    const W_RISK: f64 = crate::GES_WEIGHTS[1];
    // …
    ```
  - [ ] `cargo test --lib` — verify test passes
  - [ ] `cargo build --release` — compile clean

### **Task 0.2 — Benchmark Target Service**
- **Priority:** P1
- **Effort:** 2h
- **Files:**
  - `solver/src/benchmarks.rs` (new)
  - `solver/src/lib.rs` (pub use)
  - `api/src/lib/benchmarkLoader.ts` (new — optional)
- **Steps:**
  - [x] Parse `benchmark-36-kpis.md` table into `BenchmarkTargets` struct (solver/src/benchmarks.rs)
  - [x] Define struct with 36 KPI targets across 6 GES domains
  - [x] Function `load_benchmarks(path: &str) -> BenchmarkTargets` with fallback to defaults
  - [x] Global singleton using `std::sync::OnceLock` (no external deps)
  - [x] Initialize in `run_watchtower()` before gate check
  - [ ] Full 36-KPI domain scoring wired into gate validation (currently uses simplified proxy)
  - [ ] TypeScript: `api/src/lib/benchmarkLoader.ts` — optional for dashboard display
  - [ ] API route: `GET /api/benchmarks` → returns JSON via IPC query (optional)
  - [ ] Test: Load function returns correct values for at least 5 KPIs

### **Task 0.3 — KPI Snapshot Persistence**
- **Priority:** P0
- **Effort:** 3h total
- **DB:** Create migration
  ```sql
  CREATE TABLE kpi_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL,
    domain_score_profit INT NOT NULL,
    domain_score_risk INT NOT NULL,
    domain_score_perf INT NOT NULL,
    domain_score_eff INT NOT NULL,
    domain_score_health INT NOT NULL,
    domain_score_auto_opt INT NOT NULL,
    total_weighted_score INT NOT NULL,
    -- Individual KPIs (optional expanded)
    solver_latency_ms INT,
    gas_efficiency_bps INT,
    uptime_10x INT,
    -- JSON blob for extensibility
    raw_stats JSONB
  );
  CREATE INDEX idx_kpi_snapshots_ts ON kpi_snapshots(timestamp DESC);
  ```
- **Rust:**
  - [ ] In `run_watchtower`, add: `if now % 300 == 0 { save_kpi_snapshot(&stats, &graph).await; }`
  - [ ] Function `save_kpi_snapshot`: insert into `kpi_snapshots` via `sqlx` or `tokio-postgres`
  - [ ] Use existing DB connection pool (check how `api` connects; maybe IPC to Node.js to write)
    - Easier: send snapshot via IPC to Node.js, let Node.js write (reuse DB pool)
  - [ ] Define IPC message type: `KPI_SNAPSHOT` (binary or JSON)
  - [ ] In `api/src/routes/engine.ts:handleRustMessage()`, handle `KPI_SNAPSHOT` → insert to `kpi_snapshots`
- **Test:**
  - [ ] Start system, wait 5min, query `SELECT COUNT(*) FROM kpi_snapshots` → ≥1
  - [ ] Snapshot contains correct domain scores (spot-check)

---

## **Phase 1: Gatekeeper (Week 1–2)**

### **Task 1.1 — Implement KPI Sim Gate (P0)**
- **Priority:** P0
- **Effort:** 1 day
- **File:** `solver/src/module/bss_43_simulator.rs`
- **Steps:**
  - [ ] Define `pub struct GateResult { passed: bool, ges: f64, gaps: Vec<GapReport> }`
  - [ ] Define `pub struct GapReport { kpi: String, actual: f64, target: f64, unit: String }`
  - [ ] Add `pub async fn validate_deployment_gate(stats: &WatchtowerStats, graph: &GraphPersistence, benchmarks: &BenchmarkTargets) -> GateResult`
    ```rust
    // Run existing audit simulation (reuse run_system_audit_simulation but make it return stats instead of printing)
    let mut sim_stats = SimulationStats::new();
    run_audit_simulations(&mut sim_stats, graph, 100).await; // 100 cycles
    
    // Compute GES using AutoOptimizer's formula (factor out into lib function)
    let ges = compute_ges(&sim_stats);
    
    // Compare each KPI
    let mut gaps = Vec::new();
    if sim_stats.opportunities_found < benchmarks.min_opportunities_per_hour {
        gaps.push(GapReport { kpi: "opportunities_found", actual: …, target: …, unit: "count" });
    }
    // … check all 30 KPIs (at least 7 domain scores)
    
    if ges < 0.825 || !gaps.is_empty() {
        GateResult::Fail { ges, gaps }
    } else {
        GateResult::Pass { ges }
    }
    ```
  - [ ] Refactor `calculate_global_efficiency_score` from `AutoOptimizer` into `crate::ges()` to reuse here
  - [ ] Add unit tests with mock stats (ges 0.80 → fail; 0.86 → pass)

### **Task 1.2 — Gate Hook in Engine Start**
- **Priority:** P0
- **Effort:** 2h
- **File:** `api/src/routes/engine.ts`
- **Steps:**
  - [ ] Import gate validator: `import { validateDeploymentGate } from "../lib/bss43";` (create this bridge)
  - [ ] In `autoStartEngine()`, **before** `setInterval(scanCycle)`, add:
    ```typescript
    const benchmarks = await loadBenchmarks();
    const gate = await bss43.validateDeploymentGate(sharedEngineState, graph, benchmarks);
    if (!gate.passed) {
      logger.error("Deployment gate failed", { ges: gate.ges, gaps: gate.gaps });
      await safeDbOperation(async () =>
        db!.insert(streamEventsTable).values({
          id: genId("evt"),
          type: "SCANNING",
          message: `GATE BLOCK: GES ${(gate.ges*100).toFixed(1)}% < 82.5%. Gaps: ${gate.gaps.map(g => g.kpi).join(',')}`,
          blockNumber: currentBlock,
        }),
      );
      throw new Error(`Deployment gate rejected: GES below threshold. See logs.`);
    }
    logger.info(`Gate passed: GES ${(gate.ges*100).toFixed(1)}%`, { gaps: gate.gaps });
    ```
  - [ ] Ensure `loadBenchmarks()` reads from `/api/benchmarks` or has built-in defaults

### **Task 1.3 — Gate Retry Logic (Auto-Tune)**
- **Priority:** P0
- **Effort:** 1h
- **Status:** ✅ Complete in `solver/src/main.rs` (run_watchtower, lines ~1428-1480)
- **Implementation:**
  - Constants: `MAX_GATE_RETRIES=3`, `GATE_RETRY_INTERVAL_SEC=600`
  - On gate failure: logs gaps, calls `auto_optimizer.execute_remediation("COMMIT_OPTIMIZATION")`, sleeps 10min, retries
  - After 3 failures: logs fatal error, exits unless `GATE_OVERRIDE_TOKEN=true`
  - Gate attempts logged to console; `gate_attempts` DB table schema ready for IPC logging
- **Acceptance:**
  - [x] Unit test: gate rejects with GES=0.80, passes with 0.86 (via simulation)
  - [ ] Integration: Staging engine refuses to start if benchmarks artificially set low and stats are degraded
  - [ ] Retry logic: observed in logs after 1st failure, optimization applied, 2nd attempt (requires runtime verification)

---

## **Phase 2: Learning Core (Week 2–3)**

### **Task 2.1 — Replace MetaLearner Stub (P0)**
- **Priority:** P0
- **Effort:** 1 day
- **File:** `solver/src/bss_28_meta_learner.rs` (new)
- **Steps:**
  - [ ] Remove `MetaLearner` definition from `main.rs` (lines 550-572)
  - [ ] Create new file:
    ```rust
    use std::sync::atomic::{AtomicUsize, AtomicU64, AtomicF64, Ordering};
    use std::sync::Arc;
    use crate::WatchtowerStats;

    pub struct MetaLearner {
        pub success_ratio: AtomicUsize,       // EMA (0-10000 representing 0-100.00%)
        pub profit_momentum: AtomicF64,       // 24h profit Δ
        pub adversarial_intensity: AtomicU64, // events per hour
        pub last_update: AtomicU64,           // timestamp
    }

    impl MetaLearner {
        pub fn new() -> Self {
            Self { success_ratio: AtomicUsize::new(9500), profit_momentum: AtomicF64::new(0.0), … }
        }

        pub async fn observe_trade(&self, trade: &TradeRecord) {
            // Update EMA: alpha=0.1 for success ratio
            let old = self.success_ratio.load(Ordering::Relaxed);
            let new = ((old as f64) * 0.9 + (if trade.success { 100.0 } else { 0.0 }) * 0.1) as usize;
            self.success_ratio.store(new, Ordering::Relaxed);

            // Update profit momentum (simplified: keep rolling sum)
            // …
        }

        pub fn get_recommendation(&self) -> PolicyDelta {
            let mut delta = PolicyDelta::default();
            if self.success_ratio.load() < 8000 {
                delta.min_profit_bps_delta = +5;
            }
            if self.profit_momentum.load() < -0.5 {
                delta.max_hops_delta = -1;
            }
            delta
        }
    }
    ```
  - [ ] Add `#[derive(Clone)] pub struct PolicyDelta { pub min_profit_bps_delta: i64, pub max_hops_delta: i64, … }`
  - [ ] Import and instantiate `MetaLearner` in `run_watchtower`
  - [ ] Expose via IPC: handle `OBSERVE_TRADE` message from Node.js

### **Task 2.2 — Trade Observer Bridge**
- **Priority:** P0
- **Effort:** 2h
- **Files:** `api/src/routes/engine.ts`, `solver/src/main.rs`
- **Steps:**
  - [ ] In `engine.ts:1254` after `db.insert(tradesTable)`, also send IPC message:
    ```typescript
    const tradeMsg = { type: "TRADE_OUTCOME", trade: { success: execMode === "LIVE", profitEth: netProfit, latencyMs, … } };
    rustBridge.write(JSON.stringify(tradeMsg) + "\n");
    ```
  - [ ] In `run_watchtower` event loop, handle `type == "TRADE_OUTCOME"`:
    ```rust
    if msg.type == "TRADE_OUTCOME" {
        meta_learner.observe_trade(&msg.trade).await;
    }
    ```
  - [ ] Verify: log "MetaLearner updated: success_ratio=XX"

### **Task 2.3 — Policy Recommendation Consumption**
- **Priority:** P0
- **Effort:** 1h
- **Steps:**
  - [ ] In `AutoOptimizer::tune_engine_parameters()`, after computing GES-based adjustments, also:
    ```rust
    let meta_delta = meta_learner.get_recommendation();
    self.stats.min_profit_bps_adj.fetch_add(meta_delta.min_profit_bps_delta as u64, Ordering::Relaxed);
    ```
  - [ ] Clamp values to safe bounds (min 1, max 100 bps)
  - [ ] Log: `[BSS-28] Recommendation applied: min_profit_bps +5`

### **Task 2.4 — Model Persistence**
- **Priority:** P1
- **Effort:** 1h
- **Steps:**
  - [ ] Add `MetaLearner::save_state(&self, path: &str)` → JSON: `{ success_ratio, profit_momentum, … }`
  - [ ] Add `MetaLearner::load_state(path) -> Self` — fallback to defaults if file missing/corrupt
  - [ ] Call `save_state` every hour via timer in `run_watchtower`
  - [ ] Call `load_state` at startup before loop
  - [ ] Store to `./model_state.json` or `/var/lib/allbright/model_state.json`
  - [ ] Test: kill process, restart, confirm state restored

**Phase 2 Acceptance:**
- [ ] MetaLearner `success_ratio` drifts from 9500 toward observed win rate after 10 trades
- [ ] Profitable period → `profit_momentum > 0` → reduces `min_profit_bps`
- [ ] Model file written hourly, loaded on restart

---

## **Phase 3: Bridge Unification (Week 3)**

### **Task 3.1 — Implement API Specialists Logic (P1)**
- **Priority:** P1
- **Effort:** 4h
- **File:** `api/src/lib/specialists.ts`
- **Steps:**
  - [ ] `ProfitabilitySpecialist.tuneKpis()`:
    ```typescript
    if (kpiData.daily_profit_eth < 15) {
      return { tuned: true, actions: [{ subsystem: "BSS-47", param: "target_profit", suggestion: "lower to 20" }] };
    }
    ```
  - [ ] `PerformanceSpecialist.tuneKpis()`: latency > 15ms → suggest `max_hops -= 1`
  - [ ] `EfficiencySpecialist.tuneKpis()`: gas_eff < 90% → suggest increase bribe ratio
  - [ ] `RiskSpecialist.tuneKpis()`: loss_rate > 100 bps → tighten gates
  - [ ] `HealthSpecialist.tuneKpis()`: uptime < 99.9 → suggest redundancy
  - [ ] `AutoOptSpecialist.tuneKpis()`: GES < 85 → increase tuning frequency
  - [ ] `DashboardSpecialist.tuneKpis()`: anomaly rate > 5% → alert UI redesign

### **Task 3.2 — AlphaCopilot Orchestrator Integration**
- **Priority:** P1
- **Effort:** 1h
- **Steps:**
  - [ ] In `alphaCopilot.orchestrateSpecialists()`, collect all actions
  - [ ] Deduplicate by `subsystem` (keep highest priority)
  - [ ] Return `{ tuned: true, actions: [...] }`
  - [ ] Expose via `POST /api/ai/tune` (already route exists at line 213 telemetry.ts? Verify)
  - [ ] Test: `curl -X POST /api/ai/tune` returns JSON with actions

### **Task 3.3 — Bribe Engine State Sync Fix (CRITICAL SYNC)**
- **Priority:** P1
- **Effort:** 0.5 day
- **Problem:** Node.js bribe engine tuning independent of Rust policy
- **Steps:**
  - [ ] **Add bribe fields to `WatchtowerStats`** (`solver/src/lib.rs:145`):
    ```rust
    pub min_margin_ratio_bps: AtomicU64,
    pub bribe_ratio_bps: AtomicU64,
    ```
    Default: min_margin=1000 (10%), bribe=500 (5%)
  - [ ] **Initialize in `main.rs:1594`**:
    ```rust
    watchtower_stats.min_margin_ratio_bps.store(1000, Ordering::Relaxed);
    watchtower_stats.bribe_ratio_bps.store(500, Ordering::Relaxed);
    ```
  - [ ] **Expose via IPC heartbeat** (`main.rs:1776`):
    Already sending flashloan address; add 2 fields:
    ```rust
    payload.push((stats.min_margin_ratio_bps.load(Relaxed) as u16).to_be_bytes()…);
    payload.push((stats.bribe_ratio_bps.load(Relaxed) as u16).to_be_bytes()…);
    ```
  - [ ] **Read in `engine.ts:handleRustMessage()`** (lines 388-423):
    ```typescript
    if (opp.min_margin_ratio_bps !== undefined) sharedEngineState.minMarginRatioBps = opp.min_margin_ratio_bps;
    if (opp.bribe_ratio_bps !== undefined) sharedEngineState.bribeRatioBps = opp.bribe_ratio_bps;
    ```
  - [ ] **Update `allbrightBribeEngine`** to read from `sharedEngineState` instead of local-only state
    - In `bribeEngine.ts:calculateProtectedBribe()`, replace `config.MIN_MARGIN_RATIO` with `sharedEngineState.minMarginRatioBps / 10000`
  - [ ] **Write-back path:** Where does bribe tuning happen? Currently `engine.ts:1170`:
    ```typescript
    allbrightBribeEngine.updateTuning({ MIN_MARGIN_RATIO: …, BRIBE_RATIO: … });
    ```
    Change to: **send IPC message to Rust** to update `WatchtowerStats` fields:
    ```typescript
    rustBridge.write(JSON.stringify({
      type: "UPDATE_BRIBE_TUNING",
      min_margin_bps: newVal * 10000,
      bribe_bps: newBribe * 10000
    }) + "\n");
    ```
  - [ ] **Rust side:** `run_watchtower` handle `UPDATE_BRIBE_TUNING` → update atomic fields
  - [ ] **Verify:** After trade, both sides show same values (log them)
- **Effort:** 2h (Rust) + 2h (Node) = **0.5 day**

**Phase 3 Acceptance:**
- [ ] `allbright_bridge` heartbeat includes `min_margin_ratio_bps`, `bribe_ratio_bps`
- [ ] Node.js `sharedEngineState` shows same values as Rust `WatchtowerStats`
- [ ] Trade execution uses updated bribe parameters from shared state
- [ ] After "Update Tuning" from Alpha-Copilot, values round-trip correctly

---

## **Phase 4: Modularization (Week 4)**

### **Task 4.1 — Extract Specialists to Separate Files**
- **Priority:** P2
- **Effort:** 1 day
- **Directory:** `solver/src/specialists/`
- **Steps per specialist (×5):**
  - [ ] Create `specialists/profitability.rs` — move `ProfitSpecialist` struct + `impl SubsystemSpecialist` from `main.rs:72-96`
  - [ ] Add `use` statements at top: `use crate::{WatchtowerStats, SubsystemSpecialist, HealthStatus, Value, Arc, serde_json, Ordering};`
  - [ ] At bottom, add `pub use self::ProfitSpecialist;`
  - [ ] In `main.rs`, **delete** those lines; add `use crate::specialists::profitability::ProfitSpecialist;`
  - [ ] Repeat for: RiskDomainSpecialist, ExecutionSpecialist, EfficiencySpecialist, HealthSpecialist
  - [ ] After all moved, add `mod specialists;` to `main.rs` near other mods
  - [ ] Compile after each move to catch missing imports early
- [ ] **Refactor common constants:** Move TARGET_PROFIT_ETH, TARGET_LATENCY_MS, etc. to `specialists/targets.rs` and import
- [ ] **Update `lib.rs`** if any specialist needs to be re-exported for other modules (e.g., RiskSpecialist used by `bss_45_risk.rs`)
- [ ] **Run tests:** `cargo test --release`

**Phase 4 Acceptance:**
- [ ] `main.rs` reduced from ~1900 to < 1000 LOC
- [ ] Compilation time reduced (incremental compile faster)
- [ ] No functional change — same behavior

---

## **Phase 5: Observability (Week 5)**

### **Task 5.1 — Decision Audit Log (P2)**
- **Priority:** P2
- **Effort:** 3h
- **DB:** Create `ai_decisions` table
  ```sql
  CREATE TABLE ai_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL,
    subsystem TEXT NOT NULL,
    command TEXT,
    pre_state JSONB,
    post_state JSONB,
    rationale TEXT,
    initiated_by TEXT DEFAULT 'auto' -- 'auto' | 'user:user_id' | 'alpha-copilot'
  );
  CREATE INDEX idx_ai_decisions_ts ON ai_decisions(timestamp DESC);
  ```
- **Rust:**
  - [ ] Define `AuditEntry` in `solver/src/audit_log.rs`
  - [ ] Function `log_decision(entry: AuditEntry)` — sends via IPC to Node.js
  - [ ] In `run_watchtower`:
    - Wrap `specialist.execute_remediation()` call → log entry
    - Wrap `AutoOptimizer.tune_engine_parameters()` → log
    - Wrap `MetaLearner.get_recommendation()` → log (if non-neutral)
- **Node.js:**
  - [ ] In `handleRustMessage` (engine.ts), handle `AI_DECISION` message → insert to `ai_decisions`
- **API endpoint:**
  - [ ] `GET /api/ai/decisions?hours=24&subsystem=` → query DB, return JSON
- **Effort:** 1h (DB) + 1h (Rust) + 1h (Node.js) + 0.5h (API)

### **Task 5.2 — XAI: Trade Context Enrichment (P3)**
- **Priority:** P3
- **Effort:** 2h
- **Steps:**
  - [ ] In `engine.ts:1254` before inserting to `tradesTable`, build `ai_context`:
    ```typescript
    const ai_context = {
      ges: sharedEngineState.totalWeightedScore / 10,
      policy: { min_profit_bps: currentPolicy.min_profit_bps, max_hops: currentPolicy.max_hops },
      domain_scores: {
        profit: sharedEngineState.domainScoreProfit,
        risk: sharedEngineState.domainScoreRisk,
        // …
      },
      meta_recommendation: await metaLearner.getRecommendation() // if available
    };
    ```
  - [ ] Add `ai_context JSONB` column to `trades` table
  - [ ] Store JSON stringified

### **Task 5.3 — Drift Detection Alerts (P3)**
- **Priority:** P3
- **Effort:** 2h
- **Steps:**
  - [ ] New task: `detect_kpi_drift()` runs hourly
  - [ ] Query last 100 trades vs previous 100 (mean profit, success rate)
  - [ ] KS-test on profit distribution (scipy-like, but simple t-test ok)
  - [ ] If `abs(mean_delta) > 2 * std` → log to `stream_events` with `type: "DRIFT_ALERT"`
  - [ ] Dashboard listens to `DRIFT_ALERT` and shows banner

**Phase 5 Acceptance:**
- [ ] `SELECT * FROM ai_decisions WHERE subsystem='BSS-36'` returns structured rows
- [ ] Trade detail page in UI shows "AI Context" accordion with GES/policy at execution time
- [ ] Drift alert appears in telemetry when artificially triggered

---

## **Phase 6: Safety Hardening (Week 6)**

### **Task 6.1 — Circuit Breaker Auto-Reset (P2)**
- **Priority:** P2
- **Effort:** 2h
- **Changes:**
  - [ ] In `engine.ts:checkExecutionGate()`, current: if `blockedUntil` set, block all
  - [ ] New: if `blockedUntil` in past but `consecutiveFailures >= 3`, allow **1 probe trade**
    ```typescript
    const now = Date.now();
    if (state.blockedUntil && state.blockedUntil > now) {
      return { allowed: false, reason: "cooldown", retryAfterMs: state.blockedUntil - now };
    }
    if (state.consecutiveFailures >= 3 && !state.probeAllowed) {
      return { allowed: false, reason: "breaker tripped — probe pending", retryAfterMs: 0 };
    }
    return { allowed: true, reason: null, retryAfterMs: 0 };
    ```
  - [ ] After trade attempt:
    - Success: `registerExecutionSuccess()` resets state, `probeAllowed = false`
    - Failure: `registerExecutionFailure()` increments failures, **disables probe**
  - [ ] Log: "Circuit breaker probe attempt — success/failure"

### **Task 6.2 — Shadow Mode UI Banner (P3)**
- **Priority:** P3
- **Effort:** 0.5h
- **UI:** `ui/src/pages/Dashboard.tsx`
  - [ ] Read `shadowModeActive` from `sharedEngineState` (already in telemetry)
  - [ ] If true, render red banner at top: "⚠️ SYSTEM IN SHADOW MODE — No real trades executed"
  - [ ] Link to Settings to change mode

### **Task 6.3 — Gate Override with Audit (P2)**
- **Priority:** P2
- **Effort:** 0.5h
- **Steps:**
  - [ ] Add env var `GATE_OVERRIDE_TOKEN` (secret)
  - [ ] In `autoStartEngine()`, check: if `process.env.GATE_OVERRIDE_TOKEN === "true"` and gate failed, log **override** and proceed
  - [ ] Log override to `gate_attempts` table with `override: true, override_user`
  - [ ] **Only for emergency maintenance** — requires DB flag too

**Phase 6 Acceptance:**
- [ ] Circuit breaker: trigger 3 failures → blocked; after 3min, 1 probe allowed; success resets
- [ ] Dashboard shows red SHADOW banner when applicable
- [ ] Gate override logged with full audit trail

---

## **Phase 7: Advanced AI (Stretch) (Week 7–8)**

### **Task 7.1 — Online Linear Model (BSS-28 Real)**
- **Priority:** P3
- **Effort:** 2 days
- **File:** `solver/src/bss_28_meta_learner.rs`
- **Steps:**
  - [ ] Implement stochastic gradient descent:
    ```rust
    struct LinearModel {
        weights: Vec<f64>, // len=8 features
        bias: f64,
        learning_rate: f64,
    }
    impl LinearModel {
        fn predict(&self, x: &[f64]) -> f64 { self.weights.iter().zip(x).map(|(w, xi)| w*xi).sum::<f64>() + self.bias }
        fn update(&mut self, x: &[f64], y_true: f64) {
            let y_pred = self.predict(x);
            let error = y_true - y_pred;
            for (w, xi) in self.weights.iter_mut().zip(x) { *w += self.learning_rate * error * xi; }
            self.bias += self.learning_rate * error;
        }
    }
    ```
  - [ ] Feature extraction from `TradeRecord`:
    ```rust
    fn extract_features(trade: &TradeRecord) -> [f64; 8] {
        [trade.latency_ms as f64 / 100.0, trade.gas_used as f64 / 1e6, trade.protocol_onehot, …]
    }
    ```
  - [ ] Train on each trade: `model.update(&features, trade.profit_eth as f64)`
  - [ ] Predict next-trade success probability; if < 0.7, adjust policy upstream

### **Task 7.2 — Bayesian Tuning for Bribe Engine**
- **Priority:** P3
- **Effort:** 2 days
- **Steps:**
  - [ ] Model: `NetProfit ~ Normal(μ, σ²)`, μ = α + β₁·bribe_ratio + β₂·min_margin
  - [ ] Use conjugate prior (Normal-Inverse-Gamma) for online Bayesian updating
  - [ ] Thompson Sampling: sample μ from posterior, choose arm (tuning) with highest sample
  - [ ] Update posterior after each trade outcome
  - [ ] Store posterior params in `WatchtowerStats` for visibility

---

## **Weekly Sprint Template**

**Sprint N — [Dates]**
- Goal: [e.g., Complete Phase 1 — Gatekeeper]
- Tasks completed: [x/y]
- Blockers: [list]
- Next sprint: [ ]

---

## **Verification Checklist**

After each phase completion:
- [ ] `cargo build --release` succeeds
- [ ] `npm run build` in `api/` succeeds
- [ ] Unit tests added for new code (`cargo test`)
- [ ] Integration test: start engine in staging, verify expected behavior
- [ ] DB migration applied to staging Postgres
- [ ] No new errors in logs when running 1h in staging
- [ ] Dashboard displays new metrics correctly
- [ ] Team demo recorded (Loom/Zoom)

---

## **Emergency Overrides & Kill Switches**

1. **Gate Override:** Set `GATE_OVERRIDE_TOKEN=true` + `OVERRIDE_REASON="emergency"` → ignores gate failure (logged)
2. **Learning Disable:** `META_LEARNER_ENABLED=false` → MetaLearner becomes no-op (existing behavior)
3. **Simulation Skip:** `SKIP_SIM_GATE=true` → bypass Phase 1.5 (for local dev only)
4. **Hot-reload Policy:** Edit `/api/settings` → updates `SystemPolicy` via IPC without restart

All overrides must write to `override_log` table with reason and operator ID.

---

## **Post-Upgrade Validation**

Once all P0–P1 tasks complete (Phases 0–3), run this **acceptance suite**:

1. **Gate Test:** Force GES to 0.80 by degrading specialist scores → engine refuses to start; auto-tune runs; after 2 cycles GES ≥0.83 → starts
2. **Learning Test:** Inject 50 losing trades → MetaLearner increases `min_profit_bps`; observe higher min profit in next scan cycle
3. **Sync Test:** Change bribe ratio via API → verify Rust `WatchtowerStats.bribe_ratio_bps` updates within 5s
4. **Persistence Test:** Kill process, restart → `MetaLearner.success_ratio` restored from `model_state.json`; KPI snapshots continue from last timestamp
5. **Benchmark Test:** Modify `benchmark-30-kpis.md` target for NRP to 15 ETH/day → gate fails; restore to 22.5 → gate passes
6. **Audit Test:** Perform 10 trades → query `/api/ai/decisions` → returns ≥ 20 rows (specialist audits + AutoOptimizer tunes)
7. **Circuit Breaker Test:** Force 3 failing trades (negative profit) → breaker trips; wait 3min → probe trade auto-executed; success → breaker resets

---

## **Rollback Plan**

Each phase should be **deployable independently**. If regression:

1. **DB migration rollback:** `drizzle push --drop` (only if schema change; KPI snapshots are additive, safe to keep)
2. **Code rollback:** `git revert <commit>`; redeploy previous image
3. **State rollback:** MetaLearner state file — delete to revert to defaults
4. **Feature flags:** All AI features controlled by env vars; can disable individually:
   - `ENABLE_GATE=true/false`
   - `ENABLE_META_LEARNER=true/false`
   - `ENABLE_KPI_SNAPSHOTS=true/false`

---

**Last Updated:** 2026-04-27  
**Next Review:** After Phase 1 completion
