# Deployment Guide — BrightSky

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development](#local-development)
3. [Production Deployment (Render.com)](#production-deployment)
4. [Vercel Frontend](#vercel-frontend)
5. [Desktop Application (Electron)](#desktop-application)
6. [Verification Checklist](#verification-checklist)
7. [Rollback](#rollback)

---

## Prerequisites

- **Node.js** 22.18.0+ (use nvm or asdf)
- **pnpm** 9.15.4+ (`corepack enable && corepack prepare pnpm@9.15.4 --activate`)
- **Rust** 1.88+ (`rustup update stable`)
- **PostgreSQL** 16+ (Neon recommended for free tier)
- **Pimlico API key** (for gasless execution)
- **Ethereum RPC endpoint** (Base, Ethereum)
- **Git** (for cloning)

---

## Local Development

### 1. Clone & Install

```bash
git clone https://github.com/<your-org>/brightsky.git
cd brightsky

# Install dependencies (pnpm workspace)
pnpm install

# Copy environment template
cp .env.example .env
# Edit .env with your local credentials
```

### 2. Database Setup

```bash
# Start Postgres locally (Docker)
docker run --name brightsky-postgres -e POSTGRES_PASSWORD=brightsky -e POSTGRES_DB=brightsky -p 5432:5432 -d postgres:16-alpine

# Or connect to Neon:
# DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
```

### 3. Environment Configuration

Edit `.env`:

```bash
# Required
DATABASE_URL=postgresql://brightsky:brightsky@localhost:5432/brightsky
RPC_ENDPOINT=https://base.llamarpc.com
PIMLICO_API_KEY=pim_your_key
PRIVATE_KEY=0x...      # For LIVE mode (or leave blank for SHADOW)
WALLET_ADDRESS=0x...

# Optional
OPENAI_API_KEY=sk-...
CHAIN_ID=8453  # Base
PAPER_TRADING_MODE=false
```

### 4. Build & Run

```bash
# Build Rust solver
cd solver && cargo build --release

# Build TypeScript API
cd .. && pnpm --filter @workspace/api-server run build

# Start database migrations
pnpm --filter @workspace/db push

# Run in development (hot-reload)
pnpm run dev
```

Access:
- API: http://localhost:3000/api/health
- Dashboard: http://localhost:3000 (if UI built)
- Solver IPC: Unix socket `/tmp/brightsky_bridge.sock`

### 5. Pre-flight Check

The preflight script validates environment and binary:

```bash
./scripts/dev/preflight.sh
# Should output: ✓ Environment Variables Validated
#               ✓ Database Reachable
#               ✓ Binary Integrity Confirmed
```

---

## Production Deployment (Render.com)

**Recommended:** Use Render's managed hosting for simplicity.

### Step 1: Prepare Repository

1. Push code to GitHub (public or private)
2. Ensure `.gitignore` includes `.env` (already present)

### Step 2: Create Render Services

1. **PostgreSQL** (Neon recommended for free tier, or Render Postgres)
   - Create new database, copy connection string
2. **Web Service — API** (`api/`)
   - Runtime: Docker
   - Build Command: `pnpm install && pnpm build`
   - Start Command: `node dist/index.mjs`
   - Health Check Path: `/api/health`
   - Environment variables: (see below)
3. **Web Service — Solver** (`solver/`)
   - Runtime: Docker
   - Build Command: `cargo build --release --bin brightsky`
   - Start Command: `./target/release/brightsky`
   - Health Check: TCP port 4003 (default)
4. **Web Service — Dashboard** (optional, `ui/`)
   - Static build served by nginx

### Step 3: Environment Variables (Render)

Set in Render dashboard per service:

**API Service:**
```
NODE_ENV=production
PORT=10000
DATABASE_URL=<from Neon/Render Postgres>
RPC_ENDPOINT=https://base.llamarpc.com
PIMLICO_API_KEY=<your-pimlico-key>
PRIVATE_KEY=<your-private-key>         # For LIVE mode
WALLET_ADDRESS=0x...
INTERNAL_BRIDGE_PORT=4001
BRIGHTSKY_SOCKET_PATH=/tmp/brightsky_bridge.sock
PRE_FLIGHT_STRICT=true
```

**Solver Service:**
```
RUST_LOG=info
INTERNAL_BRIDGE_PORT=4003
RPC_ENDPOINT=${RPC_ENDPOINT}
FLASH_EXECUTOR_ADDRESS=0x...
CHAIN_ID=8453
PIMLICO_API_KEY=${PIMLICO_API_KEY}
MAX_PAIRS_TO_SCAN=2500
SCAN_CONCURRENCY=8
MEV_PROTECTION=true
```

**Dashboard (if deployed):**
```
VITE_API_BASE_URL=https://your-api.onrender.com/api
NODE_ENV=production
```

### Step 4: Deploy

- Connect GitHub repo to Render
- Auto-deploy on push to `main`
- Verify health checks pass (Render shows green)

---

## Vercel Frontend

The dashboard UI is a Vite static build.

```bash
cd ui
pnpm install
pnpm build
# Output: dist/public/
```

Deploy via Vercel CLI or Git integration:
```bash
vercel --prod
```

Configure `vercel.json` routes to proxy API calls.

---

## Desktop Application (Electron)

### Build Windows Installer

```bash
cd ui
pnpm run build-desktop
# Output: dist-electron/brightsky-desktop-setup.exe
```

Requires Electron Builder configuration.

---

## Verification Checklist

After deployment, run:

```bash
# 1. Health check
curl https://your-api.com/api/health
# Expected: {"status":"ok","db":"connected",...}

# 2. Metrics
curl https://your-api.com/metrics | head -20

# 3. Engine status
curl https://your-api.com/api/engine/status

# 4. Trades list (should be empty initially)
curl https://your-api.com/api/trades

# 5. Check solver logs for startup messages:
# [BSS-06] Telemetry Gateway active...
# [BSS-13] Solver initialized...
# [BSS-43] Simulator healthy
```

---

## Rollback

### API Rollback (Render)
- Use Render dashboard → "Manual Deploy" → select previous commit
- Or: `git revert <bad-commit>` → auto-redeploy

### Solver Rollback (Docker)
```bash
docker-compose stop solver
docker-compose rm -f solver
docker-compose pull solver  # previous tag if using versioned images
docker-compose up -d solver
```

### Database Rollback
- **Neon:** Point-in-time recovery via dashboard (choose timestamp before migration)
- **Self-hosted:** `pg_restore` from backup

---

## Monitoring

- **Prometheus metrics:** `GET /metrics`
- **Grafana dashboards:** (if deployed) import from `monitoring/dashboards/`
- **Alerts:** Configure AlertManager in `monitoring/alerts/` to Slack/PagerDuty

---

## Troubleshooting

| Issue | Likely Cause | Fix |
|-------|--------------|-----|
| 502 Bad Gateway | API not running | Check `docker ps`, restart API |
| 503 DB connection | DATABASE_URL wrong | Verify env var, test `psql $DATABASE_URL` |
| No trades detected | RPC down | Test RPC manually, switch endpoint |
| Solver crashes | Lock poisoning | Check logs, restart solver (we fixed most panics) |
| High latency | RPC rate limit | Add more RPC providers, rotate keys |
| Auth errors | API_KEY missing | Add `Authorization: Bearer <key>` header |

---

**Next:** See `SECURITY_INCIDENT_RESPONSE.md` for secret rotation procedures and `DISASTER_RECOVERY.md` for detailed incident response.
