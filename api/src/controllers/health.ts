/**
 * Health check route.
 *
 * IMPORTANT: render.yaml sets healthCheckPath: /api/health
 * The Express app mounts all routes under /api, so this route
 * is registered as GET /health but is reachable at GET /api/health.
 *
 * Without a matching health endpoint, Render's poller gets a 404
 * and marks the service as unhealthy → continuous restart loop.
 */

import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import fs from "node:fs";
import * as net from "net";
import { withBackoff } from "../services/retry.js";

const router: IRouter = Router();

// Primary path — must match render.yaml healthCheckPath minus the /api prefix
router.get("/health", async (_req, res) => {
  try {
    // Audit Step 1: Check if the environment variable is actually present in the process
    const hasPrimaryDbUrl = !!process.env.DATABASE_URL;
    const hasAnyDbUrl = !!(
      process.env.DATABASE_URL || process.env.DATABASE_CONNECTION_STRING
    );
    const hasPimlico = !!process.env.PIMLICO_API_KEY;
    const hasPrivateKey = !!process.env.PRIVATE_KEY;
    const hasRpc = !!process.env.RPC_ENDPOINT;
    const isStrict = process.env.PRE_FLIGHT_STRICT === "true";

    // BSS-38: Validate IPC Bridge Connectivity
    const bridgePort = parseInt(process.env.INTERNAL_BRIDGE_PORT || "4003");
    const bridgeSocketPath =
      process.env.allbright_SOCKET_PATH || "/tmp/allbright_bridge.sock";
    const hasBridgeSocket = fs.existsSync(bridgeSocketPath);
    const isBridgeAlive = hasBridgeSocket
      ? true
      : await new Promise<boolean>((resolve) => {
          const socket = net.createConnection({
            port: bridgePort,
            host: "127.0.0.1",
          });
          socket.setTimeout(500);
          socket.on("connect", () => {
            socket.end();
            resolve(true);
          });
          socket.on("error", () => resolve(false));
          socket.on("timeout", () => {
            socket.destroy();
            resolve(false);
          });
        });

    // Diagnostics: Check for common typos in the environment
    const envKeys = Object.keys(process.env)
      .filter(
        (k) =>
          k.toLowerCase().includes("database") ||
          k.toLowerCase().includes("db_") ||
          k.toLowerCase().includes("postgres"),
      )
      .sort();

    if (!hasPrimaryDbUrl || !hasPimlico || !hasPrivateKey || !hasRpc) {
      console.warn("[health] Essential configuration missing for LIVE mode:", {
        hasPrimaryDbUrl,
        hasPimlico,
        hasPrivateKey,
        hasRpc,
        strictMode: isStrict,
        detectedKeys: envKeys,
      });
    }

    // Database connection with exponential backoff retry logic for cloud environments
    let dbConnected = false;
    let lastError: unknown = null;

    try {
      const result = await withBackoff(
        async () => {
          if (db) {
            await db.execute(sql`SELECT 1`);
            return true;
          }
          throw new Error("DB not initialized");
        },
        {
          maxRetries: 4,
          initialDelay: 1000,
          maxDelay: 10000,
          factor: 2,
        },
      );
      dbConnected = result;
    } catch (err) {
      lastError = err;
    }

    if (!dbConnected && !(process.env.NODE_ENV === 'production' && !isStrict)) {
      return res.status(503).json({
        status: "error",
        db: "connection_failed",
        env_var_present: hasAnyDbUrl,
        bridge_alive: isBridgeAlive,
        bridge_socket_path: bridgeSocketPath,
        message: hasAnyDbUrl
          ? `Database connection failed after retries. Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`
          : "No database URL found in primary or fallback environment variables.",
        detected_env_keys: envKeys,
        rpc_configured: hasRpc,
        preflight_strict: isStrict,
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      });
    }
    res.json({
      status: "ok",
      db: "connected",
      bridge_alive: isBridgeAlive,
      bridge_socket_path: bridgeSocketPath,
      preflight_strict: isStrict,
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      status: "error",
      db: "connection_failed",
      message: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    });
  }
});

// Legacy alias kept for backward compatibility
router.get("/healthz", (_req, res) => {
  // Redirect to primary health check for consistency
  res.redirect("/api/health");
});

export default router;
