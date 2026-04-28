# Merged BrightSky KPIs - Benchmark + Run Task KOIs

This document combines the 20 benchmark KPIs from benchmark-KPIs.md with the Key Operating Indicators (KOIs) from the run task system and additional metrics from audit outputs.

## Benchmark KPIs (from benchmark-KPIs.md)

| # | KPI Benchmark | BrightSky (Free Tier) | Elite Grade (Industry) | Variance (+/- %) | Status |
|---|---------------|----------------------|------------------------|------------------|--------|
| 1 | **Net Realized Profit (NRP)** | 14.77 ETH/day (Proj) | 22.5 ETH/day | -34.3% | ⚠️ |
| 2 | **Execution Success Rate** | 95.0% | 98.8% | -3.8% | ✅ |
| 3 | **Alpha Decay Rate** | 85.2ms | < 90ms | -5.3% | ✅ |
| 4 | **Competitive Collision Rate**| 4.0% | 0.8% | +400% | ⚠️ |
| 5 | **Inclusion Latency (Total)** | 142.0ms | 65.0ms | +118% | ⚠️ |
| 6 | **Solver Latency (p99)** | 38.5ms | 12.0ms | +220% | ⚠️ |
| 7 | **RPC Sync Lag** | 12.5ms | 1.5ms | +733% | ⚠️ |
| 8 | **Sim Parity Delta** | 2.5 bps | < 1.0 bps | +150% | ✅ |
| 9 | **MEV Deflection Rate** | 99.2% | 99.9% | -0.7% | ✅ |
| 10| **Gas Efficiency Ratio** | 88.0% | 96.5% | -8.8% | ✅ |
| 11| **Bundler Saturation** | 15.0% | 8.0% | +87% | ✅ |
| 12| **Slippage Capture (bps)** | 50 bps | 12 bps | +316% | ✅ |
| 13| **RPC Quota Usage** | 42.0% | 15.0% | +180% | ✅ |
| 14| **Liquidity Hit Rate** | 88.0% | 97.5% | -9.7% | ✅ |
| 15| **Daily Drawdown Limit** | 1.0 ETH | 0.4 ETH | +150% | ✅ |
| 16| **Signal Throughput** | 500 msg/s | 1,200 msg/s | -58.3% | ✅ |
| 17| **Risk-Adjusted Return** | 1.45 | 2.65 | -45.2% | ✅ |
| 18| **Revert Cost Impact** | 0.7% | 0.05% | +1300% | ✅ |
| 19| **Capital Turnover Speed** | 10% / trade | 25% / trade | -60.0% | ✅ |
| 20| **Paymaster Efficiency** | 1.0 | 1.0 | 0.0% | ✅ |

## Key Operating Indicators (KOIs) from Run Task System (ai/metrics/kois.json)

| KPI Name | Description | Current Value |
|----------|-------------|---------------|
| daily_profit_eth | Daily profit in ETH | 0 |
| success_rate | Success rate percentage | 0 |
| arb_execution_count | Arbitrage execution count | 0 |
| avg_profit_per_trade | Average profit per trade | 0 |
| loss_rate | Loss rate percentage | 0 |
| gas_efficiency | Gas efficiency ratio | 0 |
| execution_latency | Execution latency | 0 |
| mev_capture_rate | MEV capture rate | 0 |
| failed_tx_rate | Failed transaction rate | 0 |
| liquidity_hit_rate | Liquidity hit rate | 0 |
| slippage_cost | Slippage cost | 0 |
| spread_capture | Spread capture | 0 |
| uptime | System uptime | 0 |
| rpc_reliability | RPC reliability | 0 |
| cycle_accuracy | Cycle accuracy | 0 |
| signal_throughput | Signal throughput | 0 |
| capital_efficiency | Capital efficiency | 0 |
| risk_adjusted_return | Risk-adjusted return | 0 |
| drawdown | Drawdown | 0 |
| pnl_volatility | P&L volatility | 0 |

## Additional Metrics from Audit Output (ai/output.txt)

| Metric Name | Description | Current Value |
|-------------|-------------|---------------|
| throughput_msg_s | Messages per second throughput | 0 |
| p99_latency_ms | 99th percentile latency (ms) | 0 |
| opportunities_found | Opportunities found count | 0 |
| trades_executed | Trades executed count | 0 |
| total_profit_eth | Total profit in ETH | 0.0000 |
| risk_gate_rejections | Risk gate rejections count | 0 |
| alpha_decay_avg_ms | Alpha decay average (ms) | 0 |
| sim_parity_delta_bps | Simulation parity delta (bps) | 0 |
| adversarial_events | Adversarial events count | 0 |
| opt_delta_improvement | Optimization delta improvement | 0 |
| opt_cycles_hour | Optimization cycles per hour | 0 |
| next_opt_cycle | Next optimization cycle timestamp | 0 |
| perf_gap_throughput | Performance gap throughput | 0 |
| perf_gap_latency | Performance gap latency | 0 |
| wallet_eth | Wallet balance in ETH | 0 |
| executor_deployed | Executor deployed status | 0 |
| mempool_throughput | Mempool throughput | 0 |
| sim_success_rate | Simulated transaction success rate | 0 |
| executor_hash | Executor code hash | 0x... |
| next_nonce | Next nonce value | 0 |
| flashloan_contract_address | Flashloan contract address | None |
| shadow_mode_active | Shadow mode active status | 0 |
| bundler_online | Bundler online status | 0 |
| circuit_breaker_tripped | Circuit breaker tripped status | 0 |

## Unified KPI Mapping

The following shows how the different KPI sets relate to each other:

### Profitability Metrics
- Net Realized Profit (NRP) ↔ daily_profit_eth ↔ total_profit_eth
- Execution Success Rate ↔ success_rate ↔ (trades_executed/opportunities_found)
- Avg Profit per Trade ↔ avg_profit_per_trade

### Performance Metrics
- Alpha Decay Rate ↔ alpha_decay_avg_ms
- Solver Latency (p99) ↔ p99_latency_ms
- Signal Throughput ↔ signal_throughput ↔ throughput_msg_s
- Execution Latency ↔ execution_latency

### Efficiency Metrics
- Gas Efficiency Ratio ↔ gas_efficiency
- Liquidity Hit Rate ↔ liquidity_hit_rate
- Slippage Capture ↔ slippage_cost
- RPC Quota Usage ↔ rpc_reliability
- Bundler Saturation ↔ bundler_online
- Capital Efficiency ↔ capital_efficiency

### Risk Metrics
- MEV Deflection Rate ↔ mev_capture_rate
- Competitive Collision Rate ↔ (Failed tx rate + adversarial events)
- Revert Cost Impact ↔ circuit_breaker_tripped
- Risk-Adjusted Return ↔ risk_adjusted_return
- Daily Drawdown Limit ↔ drawdown
- P&L Volatility ↔ pnl_volatility

### System Health Metrics
- Uptime ↔ uptime
- Cycle Accuracy ↔ cycle_accuracy
- Shadow Mode Active ↔ shadow_mode_active
- Flashloan Contract Address ↔ flashloan_contract_address
- Executor Deployed ↔ executor_deployed
- Next Nonce ↔ next_nonce

### Auto Optimization Metrics *(Specialist: AutoOptSpecialist)*
- opt_delta_improvement
- opt_cycles_hour
- next_opt_cycle
- perf_gap_throughput
- perf_gap_latency
- capital_efficiency

### Dashboard Metrics *(Specialist: DashboardSpecialist)*
- opportunities_found
- risk_gate_rejections
- wallet_eth
- executor_hash
- sim_parity_delta_bps

## 7 KPI Categories & AI Specialists 24/7
See ai/agents/kpi-specialists.md for full agent specs. Each category has a dedicated specialist for continuous fine-tuning.

## Notes

1. The benchmark KPIs provide target values and industry comparisons
2. The KOIs represent the actual measured values from the system
3. The audit output metrics provide real-time operational data
4. Some KPIs have direct mappings while others require derivation or combination
5. Zero values indicate the system is in initialization state or not yet producing meaningful data