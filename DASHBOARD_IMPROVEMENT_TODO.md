# Dashboard Improvement Todo - 44-KPI Elite Implementation

## Task: Analyze and Improve allbright-dashboard.html

### Identified Issues (from analysis):
1. ❌ Legacy 39 KPI references - Need to upgrade to 44 KPIs
2. ❌ Duplicate pages in navigation causing confusion
3. ❌ Limited KPI categories (only 4) - Should have 9 weighted domains

### Target 44-KPI Matrix (from docs/benchmark-36-kpis.md):

#### 9 Weighted Domains:
1. **Profitability** (20%) - NRP, Success Rate, Avg Profit/Trade
2. **Performance** (15%) - Alpha Decay, Solver Latency, Signal Throughput
3. **Efficiency** (15%) - Gas Efficiency, Liquidity Hit, Slippage
4. **Risk** (15%) - MEV Deflection, Collision Rate, Drawdown
5. **System Health** (10%) - Uptime, Cycle Accuracy
6. **Auto Optimization** (10%) - opt_delta, opt_cycles
7. **Dashboard Metrics** (5%) - opportunities_found, wallet_eth
8. **Cloud Health** (5%) - rpc_reliability, bundler_online
9. **Specialists** (5%) - executor_deployed, flashloan_contract

### Implementation Steps:
- [ ] 1. Update KPI data with all 44 metrics from benchmark file
- [ ] 2. Expand telemetry table to show 9 domain categories
- [ ] 3. Add benchmark/target/delta columns
- [ ] 4. Apply additional improvements from DASHBOARD-GUIDE.MD

### Status: In Progress
