# BrightSky Profit Mission TODO (14 ETH/day Target)

## Phase 1: Infrastructure 🔄 Build 182/550 deps
- [x] Clean stale jobs & logs dir
- [x] cargo clean
- [🔄] cargo build --release (182/550 deps, ~8 mins remaining)
- [ ] Verify binary
- [ ] Start solver port 4001
- [ ] curl localhost:4001/health

**DB Migrate: RETRY after .env** (workspace filter fail, cd lib/db manual)
**docker-compose postgres: STARTED**
**Rust Build: 284/550 deps (~5 mins left)**
**.env load: ACTIVE**

## Phase 2: Stack Activation
- [ ] Load .env production vars
- [ ] pnpm db migrate (trades table)
- [ ] pnpm api dev (port 3000)
- [ ] pnpm ui dev (port 5173)
- [ ] Update params: MIN_PROFIT_BPS=5, PAPER_TRADING=false

## Phase 3: Profit Monitoring
- [ ] monitor-profit.ps1
- [ ] Dashboard: localhost:5173
- [ ] Verify trades in DB

## Phase 4: Target Achievement
- [ ] 14 ETH/day = 0.58 ETH/hr
- [ ] BSS-36 auto-opt approvals
- [ ] attempt_completion

**Status: Build 61/550 | Est. Complete: ~15 mins**
