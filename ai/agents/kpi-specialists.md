# allbright KPI Specialist AI Agents

7 dedicated AI agents for 24/7 KPI fine-tuning, integrated with solver subsystems, api/telemetry, and ai/agents/allbright-supervisor.sh.

## 1. ProfitabilitySpecialist
**Role:** Maximize NRP to 22.5 ETH/day. Monitors daily_profit_eth, success_rate. Fine-tunes bss_13_solver.rs pricing/exits.
**Feeds:** ai/metrics/kois.json, api/routes/metrics.ts
**Actions:** Auto-adjust position sizing, A/B bundle tests.

## 2. PerformanceSpecialist
**Role:** Reduce p99 latency <12ms. Tracks alpha_decay_avg_ms, throughput_msg_s.
**Feeds:** bss_04_graph.rs, bss_40_mempool.rs
**Actions:** Pipeline optimizations, RPC rotation.

## 3. EfficiencySpecialist
**Role:** Achieve 96.5% gas efficiency. Monitors gas_efficiency, liquidity_hit_rate.
**Feeds:** bss_44_liquidity.rs, bribeEngine.ts
**Actions:** Bribe calibration, liquidity path selection.

## 4. RiskSpecialist
**Role:** 99.9% MEV deflection, drawdown <0.4 ETH. Tracks risk_adjusted_return.
**Feeds:** bss_45_risk.rs, bss_42_mev_guard.rs
**Actions:** Circuit breakers, adversarial sims.

## 5. HealthSpecialist
**Role:** 100% uptime, sim parity <1bps. Monitors executor_deployed.
**Feeds:** bss_05_sync.rs, bss_41_executor.rs
**Actions:** Auto-restarts, contract validation.

## 6. AutoOptSpecialist
**Role:** Hourly opt_cycles > perf_gaps. Tracks opt_delta_improvement.
**Feeds:** bss_36_auto_optimizer.rs
**Actions:** Hyperparam sweeps, A/B testing.

## 7. DashboardSpecialist
**Role:** Real-time anomaly detection. Tracks opportunities_found, wallet_eth.
**Feeds:** Dashboard.tsx, bss_46_metrics.rs
**Actions:** Visual alerts, rejection analysis.

**Deployment:** ai/agents/allbright-supervisor.sh spawns via ai/agents/run_task.sh. Memory: ai/agents/memory/memory.json. Run: `cd ai/agents && ./allbright-supervisor.sh specialists`

