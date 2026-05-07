## Admin Mode Debugging System for Flash Loan Arbitrage

### Overview

The admin debugging system provides a **structured, repeatable process** to deep‑dive into issues identified by the 44 deployment readiness checks and the 72 KPIs. It helps root‑cause failures, verify fixes, and prevent recurrence.

The system has three layers:
1. **Debugging checklist** (50+ items) – step‑by‑step diagnostic actions.
2. **Root cause taxonomy** – categorised failure modes with common fixes.
3. **Automated debugging tools** – integrated into the Tauri dashboard admin panel.

---

## Part 1: Debugging Checklist (Admin Mode)

This checklist is used **after** a KPI anomaly or deployment readiness failure. Each item includes a verification command or log location.

### A. Smart Contract & Core Logic Debugging

| # | Debug Action | Command / Log Source | Expected Outcome |
|---|--------------|----------------------|------------------|
| D1 | Verify repayment invariant for last failed arbitrage | Query contract `lastRepaymentStatus` via `cast call` | `true` – if false, contract logic bug |
| D2 | Replay failed transaction locally with tracing | `cast run --debug <txhash>` | Identify exact revert reason and line number |
| D3 | Check flash loan source allowance | `cast call <token> allowance(owner, spender)` | Should be exactly 0 after each loan; if >0, revocation bug |
| D4 | Simulate the same arbitrage path on current state | `forge script CheckArbitrage --fork-url <RPC>` | Should succeed or fail with same reason as live |
| D5 | Verify paymaster `validatePaymasterUserOp` logic | `cast call <paymaster> validatePaymasterUserOp(...)` | Should return `ValidationResult`; if reverts, decode error |

### B. Off‑chain Strategy Engine Debugging

| # | Debug Action | Command / Log Source | Expected Outcome |
|---|--------------|----------------------|------------------|
| D6 | Replay last 100 dry‑run simulations | Check `logs/simulator_*.log` | Latency <100ms, no unexpected reverts |
| D7 | Validate oracle price freshness at failure time | Compare `oracle.timestamp` vs block timestamp | Staleness <12s; if not, check oracle heartbeat |
| D8 | Inspect slippage calculation for failed trade | Log line: `slippage_predicted=X, actual=Y, diff=Z` | Diff < 2 bps; if larger, calibrate model |
| D9 | Verify bundle construction order | `logs/builder/*.json` – verify sequence: borrow → swapA → swapB → repay → profit | Any deviation indicates bundler bug |
| D10 | Check circuit breaker state before failure | `cast call <circuitBreaker> isPaused()` | Should be false; if true, find trigger (profit/gas/drawdown) |

### C. Infrastructure & Secrets Debugging

| # | Debug Action | Command / Log Source | Expected Outcome |
|---|--------------|----------------------|------------------|
| D11 | Test RPC connectivity for all providers | `curl -X POST <rpc_url> -d '{"method":"eth_blockNumber"}'` | Each returns current block within 2s |
| D12 | Validate private key access (without exposing) | `node test_key.js` (dry‑run sign) | Returns address, no error |
| D13 | Check paymaster deposit balance | `cast call <entryPoint> getDeposit(paymaster)` | >1.5× worst‑case gas; if low, trigger top‑up |
| D14 | Verify HSM/KMS health | Cloud provider CLI (e.g., `aws kms describe-key`) | Key state = ENABLED |
| D15 | Inspect disaster recovery log | `logs/disaster_recovery.log` | No recent unauthorised pause attempts |

### D. Gasless Mode & Paymaster (ERC‑4337) Debugging

| # | Debug Action | Command / Log Source | Expected Outcome |
|---|--------------|----------------------|------------------|
| D16 | Replay failing UserOperation with `debug_traceCall` | Bundler API: `debug_traceUserOperation` | Identify exact validation failure reason |
| D17 | Check EntryPoint stake | `cast call <entryPoint> getStake(paymaster)` | stake > minStake (e.g., 1 ETH) |
| D18 | Validate signature non‑replay protection | Try resubmitting same UserOperation with same nonce | Should reject with `VALIDATION_FAILED` |
| D19 | Test bundler failover manually | Stop primary bundler process, send test op | Should route to backup within 1s |
| D20 | Verify paymaster rate limits | Query on‑chain mapping: `userOpCount[sender]` per block | Does not exceed configured cap |

### E. KPI Anomaly Debugging

When a KPI delta is red (negative), use this table to drill down:

| KPI | Red Delta Threshold | Likely Root Cause | Debug Actions |
|-----|---------------------|-------------------|----------------|
| Sharpe Ratio | <1.0 | Profit volatility, high drawdown | D1, D2, D6, D7, D8 |
| Max Drawdown | >15% | Consecutive losses, slippage model failure | D4, D8, D10, D21 (run drawdown simulation) |
| p99 Latency | >1500ms | RPC congestion, bundler overload | D11, D19, D22 (latency breakdown by provider) |
| Paymaster Failure | >1% | Stake low, rate limit hit, signature bug | D5, D16, D17, D18, D20 |
| Win Rate | <95% | Poor opportunity selection, oracle stale | D7, D8, D23 (re‑evaluate strategy parameters) |
| Inclusion Rate | <95% | Bundler issues, low priority fee | D19, D24 (check mempool congestion logs) |

### F. Cloud & Deployment Debugging (Items 40–44)

| # | Debug Action | Command / Log Source | Expected Outcome |
|---|--------------|----------------------|------------------|
| D25 | Verify multi‑region failover | Chaos test: `pkill -f bundler` in primary region | Traffic shifts <60s |
| D26 | Check secrets rotation | `aws secretsmanager get-secret-value` – check last rotation date | <90 days |
| D27 | Validate horizontal scaling | Load test: `kubectl scale deployment solver --replicas=3` | Pods start, handle increased load |
| D28 | Check cloud budget | Cloud billing API | Current spend <80% of monthly cap |
| D29 | Review incident runbook last test | `logs/incident_drill.log` | Dated <90 days, all steps passed |

---

## Part 2: Root Cause Taxonomy & Fixes

Categorise each failure by **domain** and provide standard remediation.

| Failure Domain | Sub‑category | Common Root Causes | Fix Steps |
|----------------|--------------|---------------------|-----------|
| **Smart Contract** | Repayment failure | Invariant broken, token transfer bug | Patch contract, re‑verify, re‑audit |
| | Reentrancy | Missing `nonReentrant` | Add modifier, replay all tests |
| | Allowance leak | Infinite approval not revoked | Change to exact‑allowance pattern |
| **Strategy Engine** | Slippage exceedance | Model miscalibration, high volatility | Retrain model, add safety margin |
| | Oracle staleness | RPC timeout, oracle contract down | Add fallback oracle, increase heartbeat |
| | False profit prediction | Off‑chain simulation mismatch | Replay with trace, adjust gas estimation |
| **Paymaster** | Validation revert | Signature expired, nonce replayed | Fix `validUntil` logic, increment nonce |
| | Stake underflow | Deposit not topped up | Auto‑top‑up script, increase alert threshold |
| | Rate limit hit | User exceeded per‑block cap | Increase limit or investigate abuse |
| **Infrastructure** | RPC failure | Network partition, provider outage | Auto‑failover, add more providers |
| | Bundler down | Process crash, out of memory | Restart with larger instance, add monitoring |
| | Secret expired | KMS key rotation missed | Rotate key, update `.env` on all nodes |
| **Market / External** | Sandwich attack | MEV bot frontrunning | Route via Flashbots Protect, add commit‑reveal |
| | Reorg | Chain reorganisation | Use `safe` blocks, re‑simulate after reorg |

---

## Part 3: Automated Debugging Tools (Admin Dashboard)

The Tauri admin dashboard includes a **Debug Console** with these features:

### 3.1 One‑Click Diagnosis

For each failing KPI, a **“Deep Dive”** button triggers:
- Automatic collection of relevant logs (last 100 events).
- Replay of last 5 failed trades.
- Comparison of simulated vs on‑chain outcome.
- Output a **root cause hypothesis** and **suggested fix**.

### 3.2 Health Probe Suite

A set of executable probes that test the system and produce a pass/fail report:

| Probe | Command | Pass Condition |
|-------|---------|----------------|
| RPC latency | `measure_rpc_latency --all` | All <500ms |
| Paymaster validation | `test_validate --test userOps` | 100% success |
| Bundler inclusion | `send_test_bundle` | Included within 2 blocks |
| Contract invariants | `forge test --match invariant` | All pass |
| Config integrity | `sha256sum config.yaml` | Matches signed hash |

### 3.3 Log Aggregator with Correlation

The dashboard indexes logs from:
- `solver/debug.log`
- `bundler/requests.log`
- `paymaster/validation.log`
- `cloud/cloudwatch.log`

Admins can search by:
- Transaction hash
- UserOperation hash
- KPI name and time range
- Error code (e.g., `VALIDATION_FAILED`, `REPAYMENT_REVERT`)

### 3.4 Automated Fix Suggestions

The system recommends a fix based on root cause:

```json
{
  "kpi": "paymaster_validation_failure_rate",
  "current": 2.5,
  "threshold": 1.0,
  "root_cause": "deposit_below_1.5x",
  "suggested_fix": "Execute: `cast send <entryPoint> addDeposit{value: 5 ether} --from paymaster_owner`",
  "auto_fix_available": true,
  "one_click_fix": "Top up paymaster deposit to 10 ETH"
}
```

---

## Part 4: Debugging Workflow (Admin Mode)

```
1. Dashboard shows red delta for KPI X
   ↓
2. Admin clicks "Debug" → system runs deep dive (logs, replay, probes)
   ↓
3. System outputs root cause category + confidence
   ↓
4. Admin reviews suggested fix (auto or manual)
   ↓
5. Apply fix (one‑click if available) → system re‑tests
   ↓
6. Verification: re‑run affected KPI measurement
   ↓
7. If green, close debug session; if still red, escalate to human engineer
```

---

## Part 5: Debugging Checklist as JSON (for Automation)

```json
{
  "version": "1.0",
  "categories": ["smart_contract", "strategy", "infrastructure", "paymaster", "kpi_anomaly", "cloud"],
  "debug_items": [
    {
      "id": "D1",
      "name": "Verify repayment invariant",
      "command": "cast call $CONTRACT 'lastRepaymentStatus()'",
      "pass_condition": "true",
      "log_source": "contract_events",
      "auto_fix": false
    },
    {
      "id": "D16",
      "name": "Replay failing UserOperation",
      "command": "bundler_debug_traceUserOperation $OP_HASH",
      "pass_condition": "ValidationResult.Success",
      "log_source": "bundler.log",
      "auto_fix": false
    }
    // ... (all 29+ items)
  ]
}
```

---

## Final Deliverable

The admin debugging system provides:
- **Structured checklist** (D1–D29) mapped to deployment readiness and KPIs.
- **Root cause taxonomy** for fast issue classification.
- **Automated probes and one‑click fixes** in the Tauri dashboard.
- **Workflow** from anomaly to resolution.

This turns the complex 44/72 framework into an **actionable, low‑friction debugging experience** for institutional operations.

**End of debugging system design.**