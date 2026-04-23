# BrightSky Directory Documentation

## 🎯 Organizational Principles

1. **Domain Separation**: `lib/` (shared), `solver/` (Rust core), `api+`ui/` (apps)
2. **Rust Hybrid**: Subsystem agents (BSS-##) in `main.rs` → Pure modules in `subsystems/`
3. **Monorepo**: pnpm workspaces (`pnpm-workspace.yaml`)
4. **Immutable Infra**: Docker multi-stage (BSS-37) - _Enhanced with preflight checks_
5. **46 Subsystems**: BSS-26 Nexus registry orchestrates all - _Expanded for elite arbitrage_
6. **10 Subsystem Modules**: Actual Rust implementations in `solver/src/subsystems/`
7. **9 Specialist Agents**: `pub struct *Specialist` implementations in `main.rs`

## 📊 Organizational Chart

```
brightsky/ (Monorepo Root)
├── lib/ (Shared Types/DB/API)
├── solver/ (Rust Core - BSS-26 Watchtower)
│   ├── main.rs (9 SubsystemSpecialist impls + SyncSpecialist in main.rs)
│   ├── lib.rs (pub mod subsystems)
│   └── subsystems/ (Pure modules)
│       ├── bss_04_graph.rs (GraphPersistence)
│       ├── bss_05_sync.rs (WebSocket sync - pure module)
│       ├── bss_13_solver.rs (Bellman-Ford SPFA)
│       ├── bss_40_mempool.rs (Mempool Intelligence)
│       ├── bss_41_executor.rs (Private Executor)
│       ├── bss_42_mev_guard.rs (MEV Guard)
│       ├── bss_43_simulator.rs (Deterministic Simulation)
│       ├── bss_44_liquidity.rs (Liquidity Modeling)
│       ├── bss_45_risk.rs (Risk & Safety Engine)
│       ├── bss_46_metrics.rs (Elite Metrics)
│       └── mod.rs (module registry)
├── api/ (Node.js BSS-06 Telemetry)
│   └── ui/ (React BSS-27 Dashboard)
└── scripts/ (DevOps - BSS-38 Preflight)
```

brightsky/ (Monorepo Root)
├── lib/ (Shared Types/DB/API)
├── solver/ (Rust Core - BSS-26 Watchtower)
│ ├── main.rs (9/10 SubsystemSpecialist impls + SyncSpecialist)
│ ├── lib.rs (pub mod subsystems)
│ └── subsystems/ (Pure modules)
│ ├── bss_04_graph.rs (GraphPersistence)
│ ├── bss_05_sync.rs (WebSocket sync - pure module)
│ ├── bss_13_solver.rs (Bellman-Ford SPFA)
│ ├── bss_40_mempool.rs (Mempool Intelligence)
│ ├── bss_41_executor.rs (Private Executor)
│ ├── bss_42_mev_guard.rs (MEV Guard)
│ ├── bss_43_simulator.rs (Deterministic Simulation)
│ ├── bss_44_liquidity.rs (Liquidity Modeling)
│ ├── bss_45_risk.rs (Risk & Safety Engine)
│ ├── bss_46_metrics.rs (Elite Metrics)
│ └── mod.rs (module registry)
├── api/ (Node.js BSS-06 Telemetry)
│ └── ui/ (React BSS-27 Dashboard)
└── scripts/ (DevOps - BSS-38 Preflight)

```

## 📁 Complete File Tree w/ Sizes (Generated `date`)
```

Total Files: 187 | Rust: 17 (9%) | JS/TS: 112 (60%) | Config: 58 (31%)
Root Level (19 files):
├── .dockerignore (0.1KB) - Docker build context
├── Cargo.toml (1.2KB) - Rust workspace
├── Dockerfile (2.1KB) - BSS-37 Hermetic builds
├── brightsky_directory.md (6.2KB) - This file
├── pnpm-workspace.yaml (0.3KB) - Monorepo
├── rust-toolchain.toml (0.2KB) - Rust toolchain
├── TODO.md (1.8KB) - Debug tracking
├── brightsky_subsystems.md (8.5KB) - Legacy subsystems spec
├── brightsky-rust-restructure-plan.md (4.1KB) - Rust migration plan

solver/ (Rust Core - 14 files, 207KB)
├── Cargo.toml (1.1KB)
├── src/main.rs (152KB post-refactor)
├── src/lib.rs (0.2KB)
└── src/subsystems/ (11 files, 54KB total)
├── mod.rs (0.4KB)
├── bss_04_graph.rs (2.1KB) - GraphPersistence
├── bss_05_sync.rs (3.2KB) - WebSocket sync
├── bss_13_solver.rs (1.8KB) - Bellman-Ford SPFA
├── bss_40_mempool.rs (4.7KB) - Mempool Intelligence
├── bss_41_executor.rs (3.9KB) - Private Executor
├── bss_42_mev_guard.rs (5.1KB) - MEV Guard
├── bss_43_simulator.rs (4.3KB) - Deterministic Simulation
├── bss_44_liquidity.rs (3.6KB) - Liquidity Modeling
├── bss_45_risk.rs (4.2KB) - Risk & Safety Engine
└── bss_46_metrics.rs (4.1KB) - Elite Metrics

lib/ (Shared - 42 files, 28KB)
├── api-client-react/ (React hooks)
├── api-spec/ (OpenAPI schemas)
├── api-zod/ (Zod validation schemas)
├── db/ (Drizzle schema & migrations)
└── scripts/ (Utility scripts)

api/ (Node Backend - 28 files, 18KB)
├── src/lib/ (Shared backend libraries)
│ ├── bribeEngine.ts (2.1KB)
│ ├── engineState.ts (1.8KB)
│ ├── opportunityScanner.ts (3.2KB)
│ └── ... (utils, types, constants)
└── src/routes/ (API route handlers)
├── engine.ts (8.7KB) - Main trading logic
├── health.ts (0.9KB) - Health check endpoints
├── settings.ts (1.4KB) - Configuration endpoints
├── trades.ts (4.2KB) - Trade history & analytics
└── ... (auth, webhooks, admin)

ui/ (React UI - 62 files, 85KB)
├── src/components/ (Reusable UI components)
│ └── ui/ (Shadcn/ui primitives)
├── src/pages/ (Application pages)
│ ├── AuditReport.tsx (4.1KB)
│ ├── Dashboard.tsx (6.8KB)
│ └── Vault.tsx (3.2KB)
├── src/lib/ (UI-specific utilities)
├── src/styles/ (CSS/tailwind configuration)
└── src/App.tsx (1.2KB) - Root application

scripts/ (DevOps - 8 files, 4KB)
├── preflight.sh (BSS-38 - environment validation)
├── rust-pre-commit-hook.sh (code quality)
├── build.sh (compilation pipeline)
└── deploy.sh (deployment orchestration)

```

Total Files: 152 | Rust: 12 (8%) | JS/TS: 98 (64%) | Config: 42 (28%)
Root Level (18 files):
├── Cargo.toml (1.2KB) - Rust workspace
├── Dockerfile (2.1KB) - BSS-37 Hermetic builds
├── pnpm-workspace.yaml (0.3KB) - Monorepo
├── TODO.md (1.8KB) - Debug tracking
├── brightsky_subsystems.md (8.5KB) - 39 subsystems spec

solver/ (Rust Core - 14 files, 207KB)
├── Cargo.toml (1.1KB)
├── src/main.rs (152KB post-refactor)
├── src/lib.rs (0.2KB)
└── src/subsystems/ (11 files, 54KB total)
├── mod.rs (0.4KB)
├── bss_04_graph.rs (2.1KB)
├── bss_05_sync.rs (3.2KB)
├── bss_13_solver.rs (1.8KB)
├── bss_40_mempool.rs (4.7KB)
├── bss_41_executor.rs (3.9KB)
├── bss_42_mev_guard.rs (5.1KB)
├── bss_43_simulator.rs (4.3KB)
├── bss_44_liquidity.rs (3.6KB)
├── bss_45_risk.rs (4.2KB)
└── bss_46_metrics.rs (4.1KB)

lib/ (Shared - 42 files, 28KB)
├── api-zod/ (API schemas)
├── db/ (Drizzle schema)
└── api-client-react/ (React hooks)

api/ (Node Backend - 28 files, 18KB)
├── src/routes/ (BSS-06 Telemetry endpoints)
└── src/lib/ (Copilot, Scanner)

ui/ (React UI - 62 files, 85KB)
├── src/pages/ (Dashboard, Vault, AuditReport)
└── src/components/ui/ (Shadcn full kit)

scripts/ (DevOps - 8 files, 4KB)
├── preflight.sh (BSS-38)
└── rust-pre-commit-hook.sh

```

## 🏗️ Directory Creation Principles

1. **Scalability**: `subsystems/` supports 39→100+ BSS agents
2. **Separation**: Business logic (main.rs) ≠ Technical modules (subsystems/)
3. **Monorepo Economy**: pnpm + Cargo workspace (no duplication)
4. **Immutable Deploy**: Docker + Render.yaml (BSS-37/39)
5. **Agentic Architecture**: Each BSS-#-# = autonomous `SubsystemSpecialist`
6. **Zero-Downtime**: Health checks + circuit breakers (BSS-31)

## 🔍 Usage

```bash
cargo run --bin brightsky    # BSS-26 Watchtower (39 subsystems)
pnpm --filter ui dev         # BSS-27 Dashboard
docker build -t brightsky .  # BSS-37 Hermetic
```

**Generation**: `list_files(recursive=true)` + manual curation
**Date**: $(date)
