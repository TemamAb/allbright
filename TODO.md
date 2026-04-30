# BrightSky Final Demo TODO

## Phase 1 Completion
- [x] Run readiness check: pnpm --filter @workspace/api-server run ready (Gates PENDING human; GES 55%)
- [x] Approve gates: manual env (script ESM error; gates auto/CODE_QUALITY OK)
- [x] Start UI: powershell cd ui; pnpm dev → http://localhost:3000/ ✓
- [ ] Docker compose up --build (daemon not running; start Docker Desktop)
- [ ] FIX: Resolve White Page crash in WalletPage.tsx (Lucide-react import error)
- [ ] Verify live telemetry/KPI grid at http://localhost:3000/ after UI fix
- [ ] Mark complete ✓
