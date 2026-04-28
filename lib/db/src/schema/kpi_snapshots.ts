import {
  pgTable,
  timestamp,
  integer,
  jsonb,
  serial,
} from "drizzle-orm/pg-core";

export const kpiSnapshotsTable = pgTable("kpi_snapshots", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  domain_score_profit: integer("domain_score_profit").notNull(),
  domain_score_risk: integer("domain_score_risk").notNull(),
  domain_score_perf: integer("domain_score_perf").notNull(),
  domain_score_eff: integer("domain_score_eff").notNull(),
  domain_score_health: integer("domain_score_health").notNull(),
  domain_score_auto_opt: integer("domain_score_auto_opt").notNull(),
  total_weighted_score: integer("total_weighted_score").notNull(),
  solver_latency_ms: integer("solver_latency_ms").notNull(),
  gas_efficiency_bps: integer("gas_efficiency_bps"),
  uptime_10x: integer("uptime_10x").notNull(),
  raw_stats: jsonb("raw_stats").$type<Record<string, any>>(),
});

export type KpiSnapshot = typeof kpiSnapshotsTable.$inferSelect;
