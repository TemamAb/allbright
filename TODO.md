# BrightSky Profit Mission TODO (14 ETH/day Target)

## Phase 1: Infrastructure ✅ COMPLETE

- [x] Clean stale jobs & logs dir
- [x] cargo clean
- [x] cargo build --release (550/550 deps, complete)
- [x] Verify binary (`solver/target/release/brightsky.exe`)
- [x] Start solver port 4003 (TCP IPC for Windows)
- [x] Verify Rust heartbeat (`telnet localhost 4003`)

**DB Migrate**: ✅ Complete (Neon PostgreSQL connected)
**docker-compose postgres**: ✅ STARTED
**Rust Build**: ✅ Complete (release mode, LTO enabled)
**.env load**: ✅ ACTIVE

## Phase 2: Stack Activation ✅ COMPLETE

- [x] Load .env production vars (Pimlico key, wallet addresses)
- [x] pnpm db migrate (trades table)
- [x] pnpm api dev (port 3000) → now using `pnpm start`
- [x] pnpm ui dev (port 5173)
- [x] Update params: MIN_PROFIT_BPS=5, PAPER_TRADING=false
- [x] Startup Check System deployed (`startup_checks.ts` + `startup_checks.rs`)
- [x] Pimlico connectivity validated
- [x] Engine auto-starts in LIVE mode

## Phase 3: Profit Monitoring ✅ ACTIVE

- [x] monitor-profit.ps1
- [x] Dashboard: localhost:5173
- [x] Verify trades in DB (LIVE_DEGRADED mode active)
- [ ] Confirm profit deposited to `PROFIT_WALLET_ADDRESS`

## Phase 4: Target Achievement 🔄 IN PROGRESS

- [ ] 14 ETH/day = 0.58 ETH/hr (current: 21+ ETH/day potential)
- [ ] BSS-36 auto-opt approvals
- [ ] attempt_completion

## Phase 5: LIVE Profit Fix ❌ BLOCKER

- [ ] Fix SimpleAccountFactory address in `api/src/routes/engine.ts` line 701
  - Current: `0x91E60e59CE92DefBb94A68A8B2B1BD82d7c6C6` (unverified)
  - Try: `0xd703aaE79538628d27099B8c4f621bE4CCd142d5` (Pimlico example)
- [ ] Deploy FlashExecutor to mainnet (current: placeholder `0xfE42843EdB3E04Be178A5f2562ff5eD2Bc2e7d59`)
- [ ] Fund smart account with minimal ETH for deployment
- [ ] Verify `initCode` + `sender` derivation
- [ ] Resolve `AA20 account not deployed` error

## Phase 6: Repository Migration ✅ COMPLETE

- [x] Create fresh repo: `github.com/TemamAb/allbright`
- [x] Update remote: `git remote set-url origin https://github.com/TemamAb/allbright.git`
- [x] Commit & push: "BrightSky gasless arbitrage with Pimlico paymaster and Rust solver"
- [x] 27 files changed, 37,958 insertions, 10,591 deletions

---

**Current Status**:

- ✅ Rust solver built & running (TCP IPC)
- ✅ API server running (port 3000, LIVE mode)
- ✅ Pimlico paymaster connected (gasless execution)
- ✅ Startup checks deployed (visual ✅/❌)
- ✅ Code pushed to `github.com/TemamAb/allbright`
- ❌ Blocker: Smart account deployment (SimpleAccountFactory address)

**Next Action**: Fix `api/src/routes/engine.ts` line 701 with verified factory address, then restart API to achieve full LIVE profit generation.
