# Allbright Dashboard Enhancement Proposal
## React Ash.Black Architecture Baseline

---

## Executive Summary

This document updates the dashboard enhancement plan to reflect the actual current UI architecture in the repository.

The current production-oriented dashboard is the React Ash.Black application under [`ui/src`](</c:/Users/op/Desktop/allbright/ui/src>). The file [`allbright-dashboard.html`](</c:/Users/op/Desktop/allbright/allbright-dashboard.html>) is a legacy dashboard reference and should not be treated as the primary implementation target.

**Current source of truth**
- App shell and routing: [`ui/src/App.tsx`](</c:/Users/op/Desktop/allbright/ui/src/App.tsx>)
- Layout shell: [`ui/src/components/Layout.tsx`](</c:/Users/op/Desktop/allbright/ui/src/components/Layout.tsx>)
- Sidebar navigation: [`ui/src/components/Sidebar.tsx`](</c:/Users/op/Desktop/allbright/ui/src/components/Sidebar.tsx>)
- Dashboard landing page: [`ui/src/components/Dashboard.tsx`](</c:/Users/op/Desktop/allbright/ui/src/components/Dashboard.tsx>)

**Legacy reference only**
- [`allbright-dashboard.html`](</c:/Users/op/Desktop/allbright/allbright-dashboard.html>)

---

## Part 1: Current State Analysis

### 1.1 Current Architecture

The active dashboard is a routed React application composed of multiple Ash.Black pages rather than a single monolithic file.

| Area | Current React File | Role |
|---|---|---|
| App entry | `ui/src/App.tsx` | Route registry and app composition |
| Layout | `ui/src/components/Layout.tsx` | Main shell, header, sidebar, content frame |
| Navigation | `ui/src/components/Sidebar.tsx` | Ash.Black navigation model |
| Dashboard | `ui/src/components/Dashboard.tsx` | Global Efficiency, alpha capture, quick stats |
| KPI Matrix | `ui/src/components/Telemetry.tsx` | Institutional KPI matrix |
| Live Events | `ui/src/components/LiveEvents.tsx` | Event stream view |
| Logs | `ui/src/components/Stream.tsx` | Protocol/system activity stream |
| Trades | `ui/src/components/Trades.tsx` | Execution ledger |
| Wallet | `ui/src/components/WalletPage.tsx` | Vault and signer controls |
| Copilot | `ui/src/components/Copilot.tsx` | Command center and AI panel |
| Strategies | `ui/src/components/StrategiesPage.tsx` | Strategy management |
| Settings | `ui/src/components/SystemSettings.tsx` | Runtime and operator settings |
| Setup | `ui/src/components/SetupWizard.tsx` | Onboarding and setup |

### 1.2 Legacy-to-React Equivalence

The old HTML dashboard maps into the React app as follows:

| Legacy Section | React Equivalent |
|---|---|
| Dashboard / Global Efficiency | `ui/src/components/Dashboard.tsx` |
| 44 KPI Telemetry Matrix | `ui/src/components/Telemetry.tsx` |
| Live Blockchain Events | `ui/src/components/LiveEvents.tsx` |
| Wallet Management | `ui/src/components/WalletPage.tsx` |
| Alpha-Copilot | `ui/src/components/Copilot.tsx` |
| AI Optimizer | `ui/src/components/AiOptimizer.tsx` and dashboard quick stats |
| Strategy Configurator | `ui/src/components/StrategiesPage.tsx` |
| System Logs | `ui/src/components/Stream.tsx` |
| Trade History | `ui/src/components/Trades.tsx` |
| System Settings | `ui/src/components/SystemSettings.tsx` |
| Setup Wizard | `ui/src/components/SetupWizard.tsx` |

### 1.3 Strengths of the Current React Dashboard

| # | Strength | Description |
|---|---|---|
| 1 | Modular architecture | Replaces the legacy monolith with route-based components |
| 2 | Consistent Ash.Black shell | Shared layout and sidebar |
| 3 | Stronger UI composition | Distinct dashboard, telemetry, logs, trades, wallet, and copilot pages |
| 4 | Better deploy target | Fits the Vite build and Render deployment path |
| 5 | React state/store layer | Existing engine store and hooks already exist |
| 6 | API integration path | Hooks and API utilities already connect to backend routes |

### 1.4 Current Gaps

The React dashboard is the right baseline, but it is still incomplete in several areas.

#### Architecture Gaps
- Duplicate or overlapping dashboard concepts still exist in a few components.
- Some pages are more mature than others.
- There is still drift between desktop/Tauri assumptions and Render/web deployment assumptions.

#### Data Gaps
- Some pages still use mocked or fallback values.
- Live telemetry is not yet unified into one canonical dashboard state model across all pages.
- Real-time transport is inconsistent across components.

#### UX Gaps
- Loading, error, and empty states are not uniformly implemented.
- Export workflows are inconsistent.
- Some pages are architecturally present but not fully production-hardened.

#### Code Quality Gaps
- Some files contain formatting and consistency issues.
- A few components still need cleanup to match the production deployment model.
- The legacy HTML file still creates confusion in planning documents.

---

## Part 2: Enhancement Proposal

### 2.1 Architectural Direction

The enhancement strategy should build on the React Ash.Black dashboard, not migrate away from the legacy HTML file.

#### Target principle
- React Ash.Black app remains the only active dashboard implementation.
- `allbright-dashboard.html` remains reference-only until explicitly archived.
- Shared telemetry, engine state, and deployment-safe UI behavior become the unifying focus.

### 2.2 Enhancement Priorities

#### Priority A: Single Source of Truth for Dashboard State

Consolidate live system state behind the existing React state layer.

Primary candidates:
- [`ui/src/stores/engine.ts`](</c:/Users/op/Desktop/allbright/ui/src/stores/engine.ts>)
- [`ui/src/services/useLiveTelemetry.ts`](</c:/Users/op/Desktop/allbright/ui/src/services/useLiveTelemetry.ts>)
- [`ui/src/hooks/useTelemetry.ts`](</c:/Users/op/Desktop/allbright/ui/src/hooks/useTelemetry.ts>)

Goals:
- unify GES, KPI matrix, wallet, engine, and event-stream status
- remove duplicated polling logic
- ensure all dashboard pages consume the same canonical state

#### Priority B: Replace Mocked Visuals with Real Backend Data

Focus first on the pages users treat as operational dashboards:
- `Dashboard.tsx`
- `Telemetry.tsx`
- `Stream.tsx`
- `Trades.tsx`
- `WalletPage.tsx`
- `Copilot.tsx`

Goals:
- remove placeholder stats where backend fields already exist
- standardize loading states
- standardize empty/error fallback behavior

#### Priority C: Deployment Alignment

The React dashboard must stay aligned with Render and API-serving behavior.

Goals:
- keep the Vite entrypoint and API static serving contract stable
- ensure `ui/dist/index.html` remains the deployment entry
- avoid legacy HTML assumptions in new work

#### Priority D: UX Hardening

Add the operational polish expected of a lead dashboard:
- toast notifications
- export affordances
- accessibility cleanup
- keyboard navigation
- consistent filters/search behavior

---

## Part 3: Implementation Roadmap

### Phase 1: Baseline Cleanup

| Task | Status | Notes |
|---|---|---|
| Mark legacy HTML as reference-only in docs | REQUIRED | Prevent wrong implementation target |
| Standardize React dashboard as source of truth | REQUIRED | All planning should point to `ui/src` |
| Audit route/component ownership | REQUIRED | Remove overlap and ambiguity |

### Phase 2: Data Unification

| Task | Status | Notes |
|---|---|---|
| Consolidate telemetry state | PENDING | Merge store/hook responsibilities |
| Replace dashboard mock values | PENDING | Use backend and engine values consistently |
| Normalize live updates | PENDING | Reduce inconsistent polling patterns |

### Phase 3: UX Hardening

| Task | Status | Notes |
|---|---|---|
| Add consistent loading states | PENDING | Dashboard, logs, wallet, trades, telemetry |
| Add consistent error states | PENDING | Visible, not silent |
| Add export and operator utilities | PENDING | Logs, trades, telemetry |

### Phase 4: Deployment-Safe Finalization

| Task | Status | Notes |
|---|---|---|
| Validate Render-safe build behavior | PENDING | UI entrypoint, static assets, API fallback |
| Remove dashboard drift between desktop and web assumptions | PENDING | Avoid hidden runtime branches |
| Archive or isolate legacy HTML | PENDING | Keep only as reference if still needed |

---

## Part 4: File-Level Focus

### Primary files to improve

- [`ui/src/App.tsx`](</c:/Users/op/Desktop/allbright/ui/src/App.tsx>)
- [`ui/src/components/Dashboard.tsx`](</c:/Users/op/Desktop/allbright/ui/src/components/Dashboard.tsx>)
- [`ui/src/components/Telemetry.tsx`](</c:/Users/op/Desktop/allbright/ui/src/components/Telemetry.tsx>)
- [`ui/src/components/Stream.tsx`](</c:/Users/op/Desktop/allbright/ui/src/components/Stream.tsx>)
- [`ui/src/components/Trades.tsx`](</c:/Users/op/Desktop/allbright/ui/src/components/Trades.tsx>)
- [`ui/src/components/WalletPage.tsx`](</c:/Users/op/Desktop/allbright/ui/src/components/WalletPage.tsx>)
- [`ui/src/components/Copilot.tsx`](</c:/Users/op/Desktop/allbright/ui/src/components/Copilot.tsx>)
- [`ui/src/stores/engine.ts`](</c:/Users/op/Desktop/allbright/ui/src/stores/engine.ts>)
- [`ui/src/services/useLiveTelemetry.ts`](</c:/Users/op/Desktop/allbright/ui/src/services/useLiveTelemetry.ts>)
- [`ui/src/hooks/useTelemetry.ts`](</c:/Users/op/Desktop/allbright/ui/src/hooks/useTelemetry.ts>)

### Secondary files

- [`ui/src/components/Layout.tsx`](</c:/Users/op/Desktop/allbright/ui/src/components/Layout.tsx>)
- [`ui/src/components/Sidebar.tsx`](</c:/Users/op/Desktop/allbright/ui/src/components/Sidebar.tsx>)
- [`ui/src/components/SystemSettings.tsx`](</c:/Users/op/Desktop/allbright/ui/src/components/SystemSettings.tsx>)
- [`ui/src/components/SetupWizard.tsx`](</c:/Users/op/Desktop/allbright/ui/src/components/SetupWizard.tsx>)

### Legacy reference only

- [`allbright-dashboard.html`](</c:/Users/op/Desktop/allbright/allbright-dashboard.html>)

---

## Part 5: Acceptance Criteria

- [ ] All planning documents refer to the React Ash.Black dashboard as current
- [ ] `allbright-dashboard.html` is clearly marked legacy/reference-only
- [ ] Dashboard landing page uses real state wherever backend data is available
- [ ] KPI matrix is driven by live canonical telemetry state
- [ ] Logs, trades, wallet, and copilot pages use consistent loading/error patterns
- [ ] Render/web deployment path remains stable with the React dashboard as entrypoint
- [ ] UI shell remains visually consistent across all routes

---

## Part 6: Summary Directive

The dashboard program should no longer be framed as “migrating from the HTML dashboard.” That migration has already happened structurally.

The real task now is:
- harden the React Ash.Black dashboard
- unify live state
- remove mock and legacy drift
- align the routed UI with deployment and operator expectations

---

## Session Progress

**Confirmed during this review**
- React Ash.Black dashboard located under `ui/src`
- Legacy HTML file confirmed as reference-only
- Route and component equivalence mapped
- Proposal corrected to reflect the actual codebase state

**Status:** Proposal updated to current architecture baseline.
