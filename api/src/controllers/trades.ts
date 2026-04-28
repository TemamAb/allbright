import { Router } from "express";
import { db } from "@workspace/db";
import { tradesTable, streamEventsTable } from "@workspace/db";
import { desc, eq, sql, and, or, gte, count, sum, avg, inArray } from "drizzle-orm";
import { getEthPriceUsd } from "../services/priceOracle";
import { sharedEngineState } from "../services/engineState";
import { z } from "zod";

const router = Router();

// BSS-06: Schema for trade list pagination and filtering
const tradesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  status: z.string().optional(),
});

router.get("/trades", async (req, res) => {
  // Validate incoming query parameters using Zod
  const validation = tradesQuerySchema.safeParse(req.query);
  
  if (!validation.success) {
    return res.status(400).json({ 
      success: false, 
      error: validation.error.flatten().fieldErrors 
    });
  }

  const { limit, offset, status } = validation.data;
  const filters = status ? eq(tradesTable.status, status) : undefined;

  const [trades, totalRes] = await Promise.all([
    db.select()
      .from(tradesTable)
      .where(filters)
      .orderBy(desc(tradesTable.timestamp))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() })
      .from(tradesTable)
      .where(filters)
  ]);

  res.json({ 
    trades, 
    total: Number(totalRes[0]?.count ?? 0),
    limit,
    offset 
  });
});

router.get("/trades/summary", async (req, res) => {
  // Aligned with telemetry.ts: Prioritize backbone price for consistency
  const ethPrice = sharedEngineState.lastBackbonePrice || (await getEthPriceUsd());
  const sessionCutoff = new Date(Date.now() - 3600 * 1000);

  const [allTimeStats, sessionStats, topProtocolRes] = await Promise.all([
    db.select({
      totalTrades: count(),
      executedCount: sql<number>`count(*) filter (where ${tradesTable.status} = 'EXECUTED')`,
      totalProfitEth: sql<string>`sum(cast(${tradesTable.profit} as numeric))`,
      totalBribesPaid: sql<string>`sum(cast(${tradesTable.bribePaid} as numeric))`,
      avgProfit: sql<string>`avg(cast(${tradesTable.profit} as numeric)) filter (where ${tradesTable.status} = 'EXECUTED')`
    }).from(tradesTable),
    
    db.select({
      sessionProfitEth: sql<string>`sum(cast(${tradesTable.profit} as numeric))`,
      sessionCount: count()
    })
    .from(tradesTable)
    .where(
      and(
        // Optimized to utilize composite index on (status, timestamp)
        inArray(tradesTable.status, ["EXECUTED", "SHADOW"]),
        gte(tradesTable.timestamp, sessionCutoff)
      )
    ),

    db.select({ protocol: tradesTable.protocol, count: count() })
      .from(tradesTable)
      .where(eq(tradesTable.status, "EXECUTED"))
      .groupBy(tradesTable.protocol)
      .orderBy(desc(count()))
      .limit(1)
  ]);

  const totalProfitEth = parseFloat(allTimeStats[0].totalProfitEth || "0");
  const totalBribesPaid = parseFloat(allTimeStats[0].totalBribesPaid || "0");
  const totalProfitUsd = totalProfitEth * ethPrice;
  const successRate = allTimeStats[0].totalTrades > 0 
    ? (allTimeStats[0].executedCount / allTimeStats[0].totalTrades) * 100 
    : 0;

  const sessionProfitEthVal = parseFloat(sessionStats[0].sessionProfitEth || "0");

  res.json({
    totalProfitEth,
    totalProfitUsd,
    totalTrades: allTimeStats[0].totalTrades,
    successRate,
    avgProfitPerTrade: parseFloat(allTimeStats[0].avgProfit || "0"),
    sessionProfitEth: sessionProfitEthVal,
    sessionProfitUsd: sessionProfitEthVal * ethPrice,
    tradesPerHour: sessionStats[0].sessionCount,
    topProtocol: topProtocolRes[0]?.protocol ?? null,
    totalBribesPaid,
  });
});

router.get("/trades/stream", async (req, res) => {
  const events = await db.select().from(streamEventsTable).orderBy(desc(streamEventsTable.timestamp)).limit(100);
  res.json({ events: events.reverse() });
});

export default router;
