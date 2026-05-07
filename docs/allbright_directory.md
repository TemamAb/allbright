# Allbright Directory Documentation

## Organizational Principles

1. **Domain Separation**: `lib/` (shared), `solver/` (Rust core), `api/`+`ui/` (apps), `tauri/` (desktop)
2. **Rust Hybrid**: Subsystem agents in `solver/` → Desktop commands in `tauri/src-tauri/`
3. **Monorepo**: pnpm workspaces + Cargo workspaces
4. **Desktop Application**: Tauri 2.6.0 with React frontend
5. **46 Subsystems**: BSS-26 Nexus registry + Tauri desktop commands

## Current Project Structure

```
allbright/ (Monorepo Root)
├── tauri/                    ← Tauri Desktop Application (v0.2.5)
│   ├── src-tauri/            ← Rust backend (Tauri 2.6.0)
│   │   ├── src/
│   │   │   ├── commands/    ← Tauri commands (solver, readiness, admin)
│   │   │   ├── core/        ← Process manager
│   │   │   ├── lib.rs
│   │   │   ├── main.rs
│   │   │   ├── tray_icon.rs
│   │   │   └── utils.rs
│   │   ├── Cargo.toml
│   │   ├── tauri.conf.json
│   │   ├── capabilities/
│   │   └── icons/
│   ├── src/                 ← React frontend
│   │   ├── views/
│   │   ├── components/
│   │   ├── lib/
│   │   └── translations/
│   └── package.json
├── solver/                  ← Rust Arbitrage Solver
│   ├── Cargo.toml
│   ├── src/
│   │   ├── main.rs
│   │   ├── lib.rs
│   │   ├── performance.rs
│   │   ├── efficiency.rs
│   │   ├── health.rs
│   │   ├── rpc.rs
│   │   ├── timing/
│   │   └── specialists/
├── api/                    ← Node.js API Server
│   ├── package.json
│   └── src/
│       ├── controllers/
│       ├── services/
│       └── ...
├── ui/                     ← React Web Dashboard
│   ├── package.json
│   └── src/
│       ├── components/
│       ├── pages/
│       └── ...
├── lib/                    ← Shared Libraries
│   ├── api-client-react/
│   ├── api-spec/
│   ├── api-zod/
│   ├── db/
│   └── ts/
├── docs/                   ← Documentation
├── contracts/              ← Solidity Contracts
├── config/                 ← Configuration
├── scripts/                ← Build & Deploy Scripts
├── monitoring/             ← Monitoring
└── logs/                  ← Application Logs
```

## Complete File Tree

### Root Level Files (93 files)
```
.dockerignore
.gitignore
.npmrc
AI-AGENT-DESKTOP-mission-APP
AI-AGENT-TAURI-DESKTOP.MD
aisystem.md
allbright-dashboard.html
architect_preflight.sh
audit-kilo-report.md
BLANK_SCREEN_DEBUG_REPORT.md
bribe-engine.ts
bribeOptimization.ts
bss_05_sync.rs
build-desktop-app.bat
build-release.ps1
Cargo.lock
Cargo.toml
check_ready_quiet.mjs
check_ready.mjs
check-ports.ps1
DASHBOARD_REBUILD_PROPOSAL.md
dashboard-analysis-updated.md
dashboard-analysis.md
DASHBOARD-GUIDE.MD
Debugging.md
deploy-local.ps1
DEPLOYMENT-READINESS-REPORT-000.md
DEPLOYMENT-READINESS-REPORT-001.md
DEPLOYMENT-READINESS-REPORT-002.md
DEPLOYMENT-READINESS-REPORT.md
DESKTOP_APP_ANALYSIS_AND_IMPLEMENTATION_PLAN.md
DESKTOP_APP_PHASES.md
DESKTOP_IMPLEMENTATION_TODO.md
DESKTOP_STREAMLINED_IMPLEMENTATION.md
diagnosticSpecialist.ts
docker-compose.yml
Dockerfile
Dockerfile.fixed
ENHANCED-ADMIN-MODE.MD
External-auditor.md
FULL_IMPLEMENTATION_PLAN_V2.md
handoff.md
IMPLEMENTATION_PLAN_TAURI_WORKFLOW_V2.md
IMPLEMENTATION_PLAN_TAURI_WORKFLOW.md
IMPLEMENTATION_PLAN_TAURI.md
index.html
KPI_IMPLEMENTATION_STATUS.md
KPI_IMPROVEMENT_PLAN.md
MASTER_DEPLOYMENT_READINESS_REPORT_v3.0.md
MASTER_DEPLOYMENT_READINESS_REPORT_v3.1.md
MASTER_DEPLOYMENT_READINESS_REPORT.md
MERGED_DESKTOP_IMPLEMENTATION_PLAN.md
mod.rs
myallbright-logo.png
OPTIMIZATION_LOG.md
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
Pre-flight-check.md
REMAINING_TASKS_PLAN.md
render.yaml
requirements.txt
rpc.ts
rpcHealthController.ts
RpcHealthMap.tsx
run_readiness_check.mjs
run-debugging-system.ts
run-readiness-report.js
run-readiness-verify.mjs
rust-toolchain.toml
rustTelemetryService.ts
SECURITY_INCIDENT_RESPONSE.md
setup-tauri-app.bat
setup-tauri-app.sh
start-all-persistent.ps1
start-solver.ps1
start-ui.ps1
stop-local-simple.ps1
TAURI_WORKFLOW_INTEGRATION.md
Tauri-App.md
tauri-desktop-frontend.zip
tauri-structure-user-guide.md
test-server.js
THEME_IMPLEMENTATION_PLAN.md
TODO_GES95.md
TODO_PHASE2.md
TODO_READINESS.md
TODO_SKIP_GATE_STABILIZATION.md
TODO_TRACKER.md
TODO.md
tsconfig.base.json
tsconfig.json
tsconfig.tsbuildinfo
update-profit.ps1
UPGRADED -DRR-KPIS-DASHBOARD.MD
UPGRADED-DRR.MD
UPGRADED-KPIs.MD
vercel.json
work-flow-guide.md
```

### Directory: ai/
```
ai/README.md
ai/agents/
ai/inference/
ai/metrics/
ai/telemetry/
ai/training/
```

### Directory: api/
```
api/.gatekeeper-state.json
api/.kpi-history.json
api/approve_gates.mjs
api/build.mjs
api/check_files.mjs
api/Dockerfile
api/gatekeeper_check.mjs
api/migrate-kpis.ts
api/package.json
api/run_gatekeeper.mjs
api/runReadiness.ts
api/seedKpiHistory.ts
api/tsconfig.json
api/vitest.config.ts
api/specs/
api/src/
```

### Directory: config/
```
config/README.md
```

### Directory: contracts/
```
contracts/formal_verification_report.json
contracts/flashloan/
contracts/oracles/
contracts/scripts/
contracts/utils/
