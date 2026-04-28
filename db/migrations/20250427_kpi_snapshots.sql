-- KPI Snapshots: Time-series persistence of domain scores and system metrics
-- Written by Rust solver every 5 minutes via IPC (frame type 0x03)
-- Used for: AI training, drift detection, audit compliance

CREATE TABLE IF NOT EXISTS kpi_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL,
  domain_score_profit INT NOT NULL,        -- 0-1000 (representing 0.00-1.00 score)
  domain_score_risk INT NOT NULL,
  domain_score_perf INT NOT NULL,
  domain_score_eff INT NOT NULL,
  domain_score_health INT NOT NULL,
  domain_score_auto_opt INT NOT NULL,
  total_weighted_score INT NOT NULL,       -- GES * 1000
  solver_latency_ms INT NOT NULL,
  gas_efficiency_bps INT,                  -- TODO: populate from stats
  uptime_10x INT NOT NULL,                 -- uptime_percent field (0-1000 = 0-100.0%)
  raw_stats JSONB                          -- Full WatchtowerStats snapshot for extensibility
);

CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_ts_desc ON kpi_snapshots(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_ges ON kpi_snapshots(total_weighted_score);

-- Keep only 90 days of data (aggressive retention for high-frequency metrics)
-- Run: DELETE FROM kpi_snapshots WHERE timestamp < now() - interval '90 days';
-- Can be cron'd daily

COMMENT ON TABLE kpi_snapshots IS 'BrightSky AI: 5-minute KPI snapshots for model training and compliance';
