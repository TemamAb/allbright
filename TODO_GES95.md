# BrightSky GES Optimization to >95% - TODO Tracker

## Current: 85% → Target: >95% (Elite Grade)
**Bottlenecks**: System Health=0 (uptime/IPC), Efficiency CRITICAL, Perf throughput=0.

## Steps (Prioritized)

### 1. Fix Builds (Enable Full Stack Run) ✅ Partial
- [x] Rust: solver/src/specialists/mod.rs created
- [ ] Cargo check: `cd solver && cargo check`
- [ ] TS: `pnpm add -D -w @types/react @types/react-dom` (retry), fix 81 errs (React/shadcn imports)
- [ ] `pnpm typecheck` → 0 errors

### 2. Infra & Local Stack
- [ ] .env.prod:
  ```
  DATABASE_URL=postgresql://brightsky:brightsky@localhost:5432/brightsky
  RPC_ENDPOINT=https://base.llamarpc.com
  PIMLICO_API_KEY=pk_...
  PRIVATE_KEY=0x...
  FLASH_EXECUTOR_ADDRESS=0x...
  ```
- [ ] `docker compose up -d` (postgres/solver/api/ui)
- [ ] Migrate DB: `pnpm api migrate` or sql
- [ ] Verify: `docker compose logs -f`, UI localhost:3000, GES live

### 3. Tune Solver for 95% GES
- [ ] config.toml / docker env:
  ```
  SCAN_CONCURRENCY=16  # From 8
  MAX_PAIRS_TO_SCAN=5000  # From 2500
  ```
- [ ] Flesh Rust specialists (stubs → logic):
  - api.rs: Real RPC calls
  - kpi.rs: Advanced scoring
  - risk.rs: MEV/revert models
- [ ] Run cycles: Monitor ui Telemetry → Aim profitability 99%, perf latency<5ms, health uptime>99%

### 4. Auto-Opt (AI Agents)
- [ ] `ai/agents/optimize_efficiency.sh`
- [ ] KPI specialists tuning

### 5. Verify & Deploy
- [ ] GES>95%, gates APPROVED
- [ ] Render secrets + push

**ETA**: 2hrs → Track progress here.

