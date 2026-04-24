/**
 * Settings Hub — Environment Orchestration & Redeploy Logic.
 */

import { Router } from "express";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db";
import { alphaCopilot } from "../lib/alphaCopilot";
import { join } from "path";
import { eq } from "drizzle-orm";

const router = Router();

/**
 * GET /settings — Returns the full Environment Data (Masked)
 * Merges Cloud Environment with Local manual overrides.
 */
router.get("/settings", async (req, res) => {
  const envData = Object.entries(process.env).map(([key, value]) => ({
    key,
    value:
      key.includes("KEY") || key.includes("SECRET") || key.includes("PRIVATE")
        ? `****${value?.slice(-4)}`
        : value,
  }));
  res.json({ success: true, env: envData });
});

/**
 * PUT /settings — Accepts either:
 * 1. { env: Array<{key:string,value:string}> } for environment variables (legacy)
 * 2. { data: { flashLoanSizeEth, minMarginPct, maxBribePct, maxSlippagePct, simulationMode, targetProtocols, openaiApiKey, pimlicoApiKey } } for UI settings
 */
router.put("/settings", async (req, res) => {
  const { env, data } = req.body;

  try {
    // Handle new UI shape: direct settings object
    if (data && typeof data === "object") {
      const { openaiApiKey, pimlicoApiKey, ...tradingSettings } = data;

      // Build update object for trading settings table
      const updates: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(tradingSettings)) {
        if (value !== undefined && value !== null) {
          updates[key] = value;
        }
      }

      if (Object.keys(updates).length > 0) {
        const rows = await db.select().from(settingsTable).limit(1);
        if (rows.length === 0) {
          await db.insert(settingsTable).values(updates);
        } else {
          await db.update(settingsTable).set(updates);
        }
      }

      // Also update sensitive env vars if provided
      if (openaiApiKey) process.env.OPENAI_API_KEY = openaiApiKey;
      if (pimlicoApiKey) process.env.PIMLICO_API_KEY = pimlicoApiKey;

      return res.json({
        success: true,
        message: "Trading settings updated successfully.",
      });
    }

    // Legacy path: environment variable updates
    if (env && Array.isArray(env)) {
      for (const { key, value } of env) {
        if (key && value) {
          process.env[key] = value;
          await db
            .insert(settingsTable)
            .values({ key, value, updatedAt: new Date() })
            .onConflictDoUpdate({
              target: (settingsTable as any).key,
              set: { value, updatedAt: new Date() },
            });
        }
      }
      res.json({
        success: true,
        message: "Environment updated. Ready for redeploy.",
      });
      return;
    }

    res
      .status(400)
      .json({
        success: false,
        error:
          "Invalid request body. Expected { data: {...} } or { env: [...] }",
      });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

/**
 * POST /settings/redeploy — System Reboot Trigger
 * Invokes the Alpha-Copilot's terminal access to restart the worker and re-detect env.
 */
router.post("/settings/redeploy", async (req, res) => {
  try {
    // Trigger terminal command for a clean reboot of the backbone
    // Optimized for Docker: Use the compiled binary in /app/bin/
    const command = "pkill -f rust-backbone || true && /app/bin/rust-backbone";
    const result = await alphaCopilot.executeMissionCommand(command);

    res.json({
      success: true,
      message: "Redeploy command dispatched to backbone.",
      output: result,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

export default router;
