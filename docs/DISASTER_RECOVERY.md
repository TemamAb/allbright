# Disaster Recovery & Incident Response Runbook
**System:** BrightSky Arbitrage Engine  
**Version:** 1.0  
**Last Updated:** 2026-04-28  
**Classification:** Internal - Engineering  

---

## 1. Overview

This runbook provides step-by-step procedures for responding to incidents, performing disaster recovery, and maintaining business continuity for the BrightSky trading platform.

**System Components:**
- **Rust Solver** (`solver/`) — High-performance arbitrage detection engine
- **Node.js API** (`api/`) — Backend orchestration & WebSocket gateway
- **PostgreSQL** — Trade history, settings, KPI snapshots
- **RPC Nodes** — External JSON-RPC endpoints (Base, Ethereum, etc.)
- **Pimlico** — Account abstraction bundler/paymaster

---

## 2. Incident Severity Levels

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|----------|
| **P0 — Critical** | System down, no trades, funds at risk | Immediate (0-15 min) | Solver crashed, wallet compromised, RPC outage, database loss |
| **P1 — High** | Degraded performance, partial failure | 1 hour | High error rate, latency >500ms, shadow mode stuck |
| **P2 — Medium** | Non-critical feature broken | 4 hours | UI not loading, metrics missing, alerts noisy |
| **P3 — Low** | Minor issue, no user impact | Next business day | Log formatting, documentation outdated |

---

## 3. P0 Incident Response Playbooks

### 3.1 Wallet Private Key Compromise (CRITICAL)

**Scenario:** Private key exposed in repository, logs, or third-party service.

**Impact:** Full wallet drain possible. Immediate action required.

#### Response Steps:

1. **IMMEDIATE (0-5 min):**
   - [ ] Stop all running instances (kill processes, disable Render services)
   ```bash
   # Render.com: Stop service from dashboard
   # Or locally: docker-compose down
   docker-compose down
   ```
   - [ ] Generate new Ethereum wallet (never reuse old address)
   ```bash
   cast wallet new --interactive   # Foundry
   # OR MetaMask: Create new account, export private key
   ```
   - [ ] Transfer all remaining funds to new wallet (use Etherscan or safe manual tx)
   - [ ] Revoke old wallet from any contract approvals (Etherscan "Revoke" or Rekt)

2. **ROTATION (5-15 min):**
   - [ ] Update environment variables:
     - `PRIVATE_KEY` → new key
     - `WALLET_ADDRESS` → new address
     - `PROFIT_WALLET_ADDRESS` → new address (if used)
   - [ ] Rotate `PIMLICO_API_KEY` if exposed (dashboard → API Keys)
   - [ ] Rotate `OPENAI_API_KEY` if exposed (platform → API keys)
   - [ ] Rotate `SESSION_SECRET` / `DASHBOARD_PASS` if in `.env`
   - [ ] Remove exposed keys from git history (BFG Repo Cleaner):
   ```bash
   git clone --mirror <repo-url> repo-mirror.git
   cd repo-mirror.git
   java -jar bfg.jar --delete-files .env
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   git push --force
   ```

3. **RECOVERY (15-30 min):**
   - [ ] Deploy to staging first with new credentials
   - [ ] Verify health: `curl https://staging/api/health`
   - [ ] Run 1 shadow-mode trade (no real funds) to confirm pipeline works
   - [ ] Deploy to production
   - [ ] Monitor wallet balance for 24h (any unauthorized activity?)

4. **POST-INCIDENT (24h):**
   - [ ] Document incident in `/docs/incidents/` (timeline, root cause, actions)
   - [ ] Notify affected parties (if user funds at risk)
   - [ ] Review and enforce secret scanning pre-commit
   - [ ] Enable 2FA on all service accounts

---

### 3.2 Solver Process Crash (PANIC abort)

**Scenario:** Rust solver crashes (SIGABRT) due to panic = "abort".

**Diagnosis:**
```bash
# Check logs
docker logs brightsky-solver --tail 100
# Or locally: journalctl -u brightsky-solver -n 100

# Look for "thread 'main' panicked" messages
```

**Common Causes:**
- Lock poisoning (Mutex/RwLock) — fixed but may still occur on edge cases
- Out-of-memory (OOM killer) — check `dmesg | grep -i kill`
- Unhandled unwrap() in non-critical path (we fixed most)
- Stack overflow (deep recursion) — rare

**Response Steps:**

1. **Collect Evidence (5 min):**
   - [ ] Get crash logs from all nodes (if multi-instance)
   - [ ] Capture core dump if enabled: `coredumpctl info`
   - [ ] Note timestamp, block number, last successful trade

2. **Mitigate (10 min):**
   - [ ] Restart solver service: `systemctl restart brightsky-solver` or `docker restart brightsky-solver`
   - [ ] If OOM: reduce `MAX_PAIRS_TO_SCAN` or increase memory limit
   - [ ] If lock poisoning persisted: check for deadlocks in code (grep for `.lock()`)

3. **Recover (15 min):**
   - [ ] Verify health: `curl http://localhost:4003/health` (solver health endpoint) — if available
   - [ ] Check API: `curl http://localhost:3000/api/health`
   - [ ] Ensure solver is emitting heartbeats (check logs for `[BSS-06] Telemetry Gateway`)

4. **Root Cause Analysis (post-incident):**
   - [ ] Reproduce locally with same input conditions if possible
   - [ ] Add additional logging around failure point
   - [ ] Consider converting remaining `unwrap()` to graceful fallbacks

---

### 3.3 Database Outage

**Scenario:** PostgreSQL connection lost, Neon free tier sleeping, or migration failed.

**Symptoms:**
- Health check returns `db: "connection_failed"`
- API logs: `Database connection failed after retries`
- Trades not persisting

**Response Steps:**

1. **Verify DB Status (2 min):**
   ```bash
   # If using Neon:
   curl https://console.neon.tech/api/v2/projects/<id>/branches/<branch>/connection-info
   # Or check dashboard for "sleeping" indicator
   
   # If self-hosted:
   pg_isready -h localhost -p 5432 -U brightsky
   ```

2. **If Sleeping (Neon free tier):**
   - [ ] Run any query against DB to wake it (e.g., `SELECT 1` via DBeaver)
   - [ ] Wait 30-60 seconds for connection warm-up
   - [ ] Re-run health check; should recover automatically

3. **If Connection String Changed:**
   - [ ] Update `DATABASE_URL` in environment (Render dashboard or `.env`)
   - [ ] Restart API service only (solver unaffected):
   ```bash
   docker-compose restart api
   # Or Render: Manual redeploy
   ```

4. **If Data Corruption / Migration Failure:**
   - [ ] Check migration status: `drizzle-kit status`
   - [ ] If tables missing: run `drizzle-kit push --force`
   - [ ] Restore from latest backup:
     - Neon: Point-in-time recovery via dashboard
     - Self-hosted: `pg_restore -d brightsky latest.dump`

5. **Validate:**
   - [ ] `curl http://localhost:3000/api/health` returns `status: "ok"`
   - [ ] `docker ps` shows healthy containers
   - [ ] New trade persists: trigger test trade, check DB

---

### 3.4 RPC Endpoint Failure

**Scenario:** Base RPC node unreachable, rate-limited, or returning errors.

**Symptoms:**
- Solver logs: `RPC error: request timed out`
- Low opportunity detection (no price feeds)
- `rpc_provider_success_rate` metric drops

**Response Steps:**

1. **Check Current RPC Config:**
   ```bash
   echo $RPC_ENDPOINT
   # Should be https://base.llamarpc.com or equivalent
   ```

2. **Test RPC Manually:**
   ```bash
   curl -X POST -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]}' \
     $RPC_ENDPOINT
   ```

3. **Switch to Backup RPC (if configured):**
   - Edit `.env` or environment variables:
     ```
     RPC_ENDPOINT=https://mainnet.base.org  # fallback
     ```
   - Restart both services: `docker-compose restart`

4. **If No Backup:**
   - [ ] Add secondary provider in `api/src/services/priceOracle.ts` or `rpc_orchestrator.rs`
   - [ ] Deploy hotfix (restart with new code)
   - [ ] Consider adding multiple providers for redundancy

5. **Monitor Recovery:**
   - [ ] Check `rpc_avg_latency_ms_per_provider` metric
   - [ ] Confirm new blocks arriving: `eth_blockNumber` should increase

---

### 3.5 Pimlico Bundler Down

**Scenario:** Gasless execution fails (UserOperation rejection).

**Symptoms:**
- API logs: `Pimlico sponsorship error` or `bundler returned 500`
- `paymaster_active` metric = false
- LIVE mode attempts fall back to SHADOW

**Response Steps:**

1. **Check Pimlico Status:**
   - Visit: https://status.pimlico.io
   - If incident acknowledged: switch to fallback mode

2. **Temporary Mitigation:**
   - Set `PAPER_TRADING_MODE=true` to disable LIVE execution
   - Or configure manual gas payment:
     - Provide `PRIVATE_KEY` with ETH for gas
     - Set `PIMLICO_API_KEY=""` (disable paymaster)

3. **Recover:**
   - Once Pimlico restored, restart API
   - Verify connectivity with `curl /api/health` (should show paymaster active)

---

## 4. Data Loss & Restoration

### 4.1 Database Backup Strategy

**Current Implementation:** None automated (using Neon which handles backups).

**Manual Backup (if self-hosted Postgres):**
```bash
# Full backup
pg_dump -U brightsky brightsky > backup_$(date +%Y%m%d_%H%M%S).sql

# Compressed
pg_dump -U brightsky brightsky | gzip > backup_$(date +%Y%m%d).sql.gz

# Store offsite: AWS S3, Google Drive, etc.
aws s3 cp backup.sql.gz s3://brightsky-backups/
```

**Restore Procedure:**
```bash
# Create fresh DB
createdb -U postgres brightsky_restore

# Restore
gunzip -c backup_20260428.sql.gz | psql -U postgres brightsky_restore

# Verify row counts
psql -c "SELECT COUNT(*) FROM trades;"
```

### 4.2 KPI Snapshots & Metrics

KPI data stored in `kpi_snapshots` table (time-series). Can be:
- Exported to CSV for external analysis
- Used to retrain AI models if needed

**Export:**
```sql
COPY (SELECT * FROM kpi_snapshots ORDER BY timestamp DESC) TO '/tmp/kpi_export.csv' CSV HEADER;
```

---

## 5. Rollback Procedures

### 5.1 Code Deployment Rollback

**Scenario:** New deployment causes solver crashes or incorrect behavior.

#### Strategy A: Docker Image Rollback
```bash
# Find previous image ID
docker images | grep brightsky

# Rollback to previous tag
docker tag brightsky:previous brightsky:latest
docker-compose up -d
```

#### Strategy B: GitHub Actions + Git Revert
```bash
# On Render / Vercel: redeploy previous commit
git revert <bad-commit-hash>
git push origin main
# CI/CD will redeploy automatically
```

#### Strategy C: Hotfix Rollback (immediate)
```bash
# SSH into server (if self-hosted)
systemctl stop brightsky
cd /opt/brightsky
git checkout v1.2.3  # last known good tag
cargo build --release
systemctl start brightsky
```

---

## 6. Monitoring & Alerting

### 6.1 Critical Alerts (PagerDuty/Slack)

Configure Prometheus AlertManager rules (place in `monitoring/alerts/`):

```yaml
groups:
- name: brightsky_critical
  rules:
  - alert: SolverDown
    expr: up{job="brightsky-solver"} == 0
    for: 1m
    annotations:
      summary: "Solver process down"
      action: "Restart solver, check logs for panic"

  - alert: DatabaseConnectionFailed
    expr: api_health_db_status == 0
    for: 2m
    annotations:
      summary: "DB connection lost"
      action: "Check Neon/RDS status, verify connection string"

  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[1m]) / rate(http_requests_total[1m]) > 0.1
    for: 5m
    annotations:
      summary: "HTTP 5xx rate >10%"
      action: "Check API logs, rollback recent deployment"

  - alert: LossRateExceeded
    expr: risk_loss_rate_bps > 100  # 1% loss
    for: 10m
    annotations:
      summary: "Loss rate above threshold"
      action: "Pause LIVE trading, investigate misconfiguration"
```

### 6.2 Dashboard & Metrics

**Primary Dashboards:**
- Grafana (if deployed): `monitoring/dashboards/` (to be created)
- Custom: UI `/dashboard` (Alpha-Copilot telemetry)

**Key Metrics to Monitor:**
| Metric | Threshold | Action |
|--------|-----------|--------|
| Solver uptime | <99.9% | Restart, investigate panics |
| DB connection errors | >5/min | Check DB pool, network |
| RPC latency p99 | >1000ms | Switch RPC provider |
| Loss rate (bps) | >50 (0.5%) | Circuit breaker trips automatically |
| Memory usage | >1GB | Restart, investigate leak |

---

## 7. Communication Plan

### 7.1 Incident Notification Channels

- **Slack:** `#brightsky-incidents` (primary), `#eng-alerts` (secondary)
- **PagerDuty:** On-call engineer (if SLA commitments)
- **Email:** stakeholders@brightsky.ai (for P0 only)

### 7.2 Stakeholder Updates

| Severity | Frequency | Audience |
|----------|-----------|----------|
| P0 | Every 15 min until resolved | All engineers, leadership |
| P1 | Every 1 hour | Engineering team |
| P2 | Daily summary | Product, Eng |
| P3 | Weekly | Eng only |

---

## 8. Disaster Recovery Runbooks — Quick Reference

### Quick Command Cheatsheet

| Task | Command |
|------|---------|
| Restart all services | `docker-compose restart` |
| View solver logs | `docker logs -f brightsky-solver` |
| View API logs | `docker logs -f brightsky-api` |
| Check DB connectivity | `psql $DATABASE_URL -c "SELECT 1"` |
| Force solver rebuild | `cargo build --release && systemctl restart brightsky` |
| Clear path cache (hot) | Send IPC command: `{"target":"BSS-13","intent":"Audit"}` |
| Disable LIVE mode | Set `PAPER_TRADING_MODE=true` in env, restart |
| Enable shadow mode | `PRE_FLIGHT_STRICT=false` (auto-enabled on errors) |

---

## 9. Post-Incident Review (Post-Mortem)

**Template:** `/docs/incidents/POSTMORTEM_TEMPLATE.md`

**Required Fields:**
1. Incident summary (what happened)
2. Timeline (UTC)
3. Impact (financial, users, duration)
4. Root cause analysis (5 Whys)
5. Resolution steps
6. Follow-up actions (owners + due dates)
7. Prevention measures

**Distribution:** Share in `#brightsky-incidents`, archive in `/docs/incidents/`.

---

## 10. Recovery Objectives

| Service | RTO (Recovery Time Objective) | RPO (Recovery Point Objective) |
|---------|-------------------------------|--------------------------------|
| Solver | 5 minutes | State can be reconstructed from blockchain |
| API | 2 minutes | Zero (stateless) |
| Database | 1 hour | Daily backups + WAL (point-in-time) |
| Trade Execution | 10 minutes | No duplicate sends (idempotent tx) |

---

## 11. Contact Information

| Role | Contact | Escalation |
|------|---------|------------|
| On-Call Engineer | PagerDuty: /pd | Immediate |
| Engineering Lead | Slack: @eng-lead | P0 incidents |
| Security | security@brightsky.ai | Key compromise |
| Infrastructure | devops@brightsky.ai | Cloud/provider issues |

---

**Last Drill Date:** TBD  
**Next Drill:** Quarterly  
**Test Plan:** Simulate DB outage, solver crash, RPC failover
