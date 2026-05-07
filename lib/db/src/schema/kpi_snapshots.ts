import { pgTable, serial, timestamp, doublePrecision, integer, jsonb } from 'drizzle-orm/pg-core';

export const kpiSnapshotsTable = pgTable('kpi_snapshots', {
  id: serial('id').primaryKey(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  
  // Core GES Metrics
  globalEfficiencyScore: doublePrecision('ges').notNull(),
  netRealizedProfit: doublePrecision('nrp_eth').notNull(),
  
  // Domain Scores (0.0 - 1.0)
  performanceScore: doublePrecision('performance_score').notNull(),
  efficiencyScore: doublePrecision('efficiency_score').notNull(),
  riskScore: doublePrecision('risk_score').notNull(),
  healthScore: doublePrecision('health_score').notNull(),

  // BSS-49/50/51 Raw Data
  p99LatencyMs: doublePrecision('p99_latency_ms'),
  gasEfficiencyRatio: doublePrecision('gas_efficiency_ratio'),
  capitalTurnover: doublePrecision('capital_turnover'),
  
  // Meta-Learner State
  policyWeights: jsonb('policy_weights').notNull(), // Stores the AI's current tuning parameters
});