# allbright Render Deployment Readiness TODO (Updated)

## Current Status: 🟡 PARTIAL READY (GES 85%, Gates partial APPROVED)

### Completed ✅
- [x] pnpm install (forced --ignore-scripts)
- [x] Rust specialists files created (api.rs/kpi.rs/risk.rs)
- [x] UI dev server: cd ui && pnpm dev → http://localhost:3002/
- [x] TODO.md created with steps

### Running/PENDING 🔄
- [🔄] Master readiness: `node api/specs/checkReadiness.ts` (ESM import fixed needed)
- [ ] Rust cargo check: cd solver && cargo check
- [ ] TS: pnpm typecheck
- [ ] Gates: node api/approve_gates.mjs

### Phase 3: Deploy
1. Fix Rust modules (lib.rs mod specialists; ensure submods)
2. .env vars: DATABASE_URL=postgres://... RPC_ENDPOINT=https://base-mainnet...
3. docker compose up -d → Verify GES>82.5%, uptime>99%
4. git push → Render auto-deploy

**Next**: Approve fixes → Phase 3.

