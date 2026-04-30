# Render Deploy + KPI History Table Plan (Approved)

**Phase 0 Gates**: 5/5 APPROVED (SYSTEM_ADMIN). Deployment Authorized: YES.

**Phase 1: KPI History Table** (Current)
- Edit api/src/services/deploy_gatekeeper.ts: Add history JSON logic, append cycle to report.kpiHistory.
- Edit api/specs/checkReadiness.ts: Print table (Domain | Cycle N % | ... | Latest | Delta).
- Test: `pnpm api ready` → Cycle 1 table.

**Phase 2: Remove UI Mocks**
- ui/src/hooks/useTelemetry.ts: Remove INITIAL_STATE.
- ui/src/pages/Dashboard.tsx: Remove profitData.

**Phase 3: Render Live**
- git push main.

Progress tracked here. Edits next.
