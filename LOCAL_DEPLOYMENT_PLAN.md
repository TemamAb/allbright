# BrightSky Local Deployment - Implementation Plan

## Objective

Deploy BrightSky locally on free ports with production variables, monitor profit generation, and iterate until optimal.

## Prerequisites Checklist

- [x] `.env` file exists with production variables
- [x] `.env` added to `.gitignore` (secure)
- [x] Rust toolchain installed (cargo)
- [x] Node.js v22.18.0+ installed
- [x] pnpm 9 installed

## Implementation Steps

### Step 1: Build Rust Solver (DONE)

**Status**: ✅ Completed

- [x] Build release binary: `cd solver && cargo build --release`
- [x] Binary location: `solver/target/release/brightsky.exe`
- [x] Verify: Binary runs on port 4001

### Step 2: Dockerize Dashboard (DONE)

**Status**: ✅ Completed - Docker files already exist

- [x] `ui/Dockerfile` exists (multi-stage: node:22 + nginx)
- [x] `ui/nginx.conf` exists (nginx config for SPA)
- [x] Build: `docker build -t brightsky-ui ./ui`
- [x] Run: `docker run -p 5173:80 --env-file .env brightsky-ui`
- [x] Uses `.env` variables at build time (VITE_API_BASE_URL)

### Step 3: Configure Local Ports

**Status**: 📋 Ready

- Rust Solver: **4001** (INTERNAL_BRIDGE_PORT)
- API Server: **3000** (PORT)
- UI Dashboard: **5173** (Vite dev port or Docker)
- Database: Use `DATABASE_URL` from `.env`

### Step 4: Deploy Services to Local Ports

**Status**: 📋 Ready

#### 4.1 Start Rust Solver

```bash
cd solver
export INTERNAL_BRIDGE_PORT=4001
export RUST_LOG=info
./target/release/brightsky
```

#### 4.2 Start API Server

```bash
cd api
export PORT=3000
export INTERNAL_BRIDGE_PORT=4001
pnpm run start
```

#### 4.3 Start UI Dashboard (choose one)

**Option A: Development mode (hot reload)**

```bash
cd ui
pnpm run dev -- --port 5173
```

**Option B: Docker mode**

```bash
cd ui
docker build -t brightsky-ui .
docker run -p 5173:80 --env-file ../.env brightsky-ui
```

### Step 5: Monitor Profit Generation

**Status**: 📋 Ready

#### 5.1 Health Checks

- Rust Solver: `curl http://localhost:4001/health`
- API Server: `curl http://localhost:3000/api/health`
- UI Dashboard: Open `http://localhost:5173`

#### 5.2 Profit Monitoring

```bash
# Using PowerShell script
.\scripts\monitor-profit.ps1

# Or manually check stats
curl http://localhost:3000/api/stats
curl http://localhost:3000/api/trades?limit=10
```

#### 5.3 Log Monitoring

- Rust Solver: `logs/rust-solver.log`
- API Server: `logs/api-server.log`
- UI: `logs/ui.log`

### Step 6: Iterate and Optimize

**Status**: 🔄 Continuous

#### 6.1 Detect Issues

- Monitor error logs in real-time
- Check failed trades in `/api/trades`
- Verify solver finds opportunities

#### 6.2 Common Fixes

| Issue                            | Solution                                 |
| -------------------------------- | ---------------------------------------- |
| No trades                        | Check RPC_ENDPOINT, WALLET_ADDRESS       |
| DB errors                        | Verify DATABASE_URL connectivity         |
| Solver not finding opportunities | Adjust MIN_PROFIT_BPS, MAX_PAIRS_TO_SCAN |
| High latency                     | Check network, reduce SCAN_CONCURRENCY   |
| MEV attacks                      | Enable MEV_PROTECTION=true               |

#### 6.3 Optimization Targets (from audit report)

- [ ] Achieve 14.7 ETH/day profit target
- [ ] Reduce solver latency < 10ms p99
- [ ] Increase throughput to 500 msgs/sec
- [ ] Maintain >95% success rate

## Quick Start Commands

### Full Deployment (PowerShell)

```powershell
# 1. Build Rust (if not done)
cd solver; cargo build --release; cd ..

# 2. Load .env
Get-Content .env | ForEach-Object { if ($_ -match '^([^#=]+)=(.*)$') { [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process') } }

# 3. Start all services
.\scripts\local-deploy.ps1
```

### Monitor

```powershell
.\scripts\monitor-profit.ps1
```

### Stop All

```powershell
.\scripts\stop-local.ps1
```

## Expected Results

- UI Dashboard shows live telemetry
- Solver finds arbitrage opportunities
- Trades execute successfully
- Profit accumulates in WALLET_ADDRESS
- All KPIs meet audit report targets

## Next Actions

1. Create `ui/Dockerfile`
2. Test full deployment
3. Monitor for 1 hour
4. Fix any issues
5. Optimize for target profit
