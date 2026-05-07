## Pre‑Flight Checklist for Live Arbitrage Execution (Must‑Pass Before Each Profit Attempt)

This checklist is executed **immediately before** the system submits any flash loan arbitrage transaction. It ensures that current conditions are favourable and the system is healthy. **All checks must pass** – if any fails, the arbitrage attempt is aborted.

### Pre‑Flight Checks (10 items)

| # | Check | Pass Criteria | Action on Failure |
|---|-------|---------------|-------------------|
| **P1** | Gas price sanity | Current gas price (base + priority) ≤ configured max (e.g., 50 gwei). Profit simulation must exceed gas cost × 2. | Abort; wait 10s, retry. |
| **P2** | RPC endpoint health | Primary RPC responds to `eth_blockNumber` within 500ms. Fallback ready. | Switch to fallback; if both fail, halt. |
| **P3** | Paymaster deposit balance | Balance ≥ 1.5 × worst‑case gas cost for this UserOperation. | Abort; trigger auto top‑up alert. |
| **P4** | Oracle freshness | Price data timestamp ≤ 3 seconds old. Deviation between primary and fallback oracle < 0.1%. | Abort; fallback to on‑chain DEX spot price. |
| **P5** | Slippage simulation error | Predicted profit using current state minus 2× historical slippage variance still > debt + fee + gas. | Abort; reduce trade size or wait for better spread. |
| **P6** | Circuit breaker state | `isPaused()` returns false. Consecutive failures counter < 5 in last 10 minutes. | Abort; notify admin. |
| **P7** | Bundler availability | At least 2 bundler endpoints return `eth_supportedEntryPoints` containing your EntryPoint. | Use fallback; if none, abort. |
| **P8** | Rate limit status | User (or strategy) has not exceeded per‑hour loan cap (e.g., 50 ETH total borrowed). | Abort; wait until next hour. |
| **P9** | Private mempool access | Flashbots Protect or equivalent endpoint is responsive and accepting bundles. | Fallback to public mempool only if profit margin > 300% (risk warning). |
| **P10** | Local state consistency | Nonce for EOA/paymaster matches bundler’s view. Simulation of exact transaction with `eth_call` returns success. | Re‑sync nonce; if mismatch persists, abort. |

### Execution Flow with Pre‑Flight

```
User → Opportunity detected → Run Pre‑Flight Checklist (10 items)
                                    ↓
                              ANY FAIL?
                             /         \
                           YES          NO
                            ↓            ↓
                      Abort & Log    Execute arbitrage
                      Wait & Retry    (flash loan + swaps)
                            ↓            ↓
                      Return to      Post‑trade checks
                      monitoring      (update KPIs)
```

### Integration with Dashboard

In the Tauri admin dashboard, display a **real‑time pre‑flight status**:

| Check | Status | Last Value | Action |
|-------|--------|------------|--------|
| Gas price | ✅ Pass | 32 gwei | – |
| RPC health | ✅ Pass | 210ms | – |
| Paymaster deposit | ❌ Fail | 1.2× coverage | Auto top‑up triggered |
| Oracle freshness | ✅ Pass | 1.2s old | – |
| Slippage error | ✅ Pass | 0.03% | – |
| Circuit breaker | ✅ Pass | false | – |
| Bundler avail | ✅ Pass | 3 endpoints | – |
| Rate limit | ✅ Pass | 12 ETH / 50 ETH | – |
| Private mempool | ✅ Pass | Flashbots OK | – |
| State consistency | ✅ Pass | nonce match | – |

**Overall pre‑flight result:** ❌ **FAIL** (Paymaster deposit) – arbitrage blocked until deposit topped up.

### Automation & Retry Logic

- On failure of **P1, P2, P4, P7, P9**: retry every 2 seconds up to 5 times.
- On failure of **P3, P5, P6, P8, P10**: require manual intervention or time‑based cooldown (e.g., wait 1 hour for rate limit).

This pre‑flight checklist ensures **no arbitrage attempt is made unless the system is provably ready** – protecting capital and maintaining institutional trust.