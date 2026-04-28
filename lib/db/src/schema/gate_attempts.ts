import {
  pgTable,
  timestamp,
  integer,
  boolean,
  jsonb,
  varchar,
  serial,
} from "drizzle-orm/pg-core";

export const gateAttemptsTable = pgTable(
  "gate_attempts",
  {
    id: serial("id").primaryKey(),
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
    ges: integer("ges").notNull(), // GES * 100 (0-10000 representing 0-100.00%)
    passed: boolean("passed").notNull(),
    retry_num: integer("retry_num").notNull().default(0),
    gaps: jsonb("gaps").$type<string[]>(),
    override_used: boolean("override_used").notNull().default(false),
    override_user: varchar("override_user", { length: 100 }),
    optimization_applied: boolean("optimization_applied").notNull().default(false),
  },
  (table) => ({
    idxTimestamp: { fn: "idx_gate_attempts_ts", columns: [table.timestamp] },
  })
);

export type GateAttempt = typeof gateAttemptsTable.$inferSelect;