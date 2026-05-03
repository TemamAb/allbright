import { Router } from "express";
import { logger } from "../services/logger";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db";
import { alphaCopilot } from "../services/alphaCopilot";
import { sharedEngineState } from "../services/engineState";
import { sql } from "drizzle-orm";
import jwt from "jsonwebtoken";
import * as fs from "node:fs";
import * as path from "node:path";

const router = Router();

/**
 * Middleware: checkAdmin
 * Hardened: Verifies JWT session token and extracts role.
 */
const checkAdmin = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: "UNAUTHORIZED", message: "Session token required." });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'allbright-elite-secret');
    
    if (decoded.role !== 'ADMIN') {
      logger.warn({ user: decoded.email }, "[AUTH] Forbidden administrative action attempt");
      return res.status(403).json({ success: false, error: "FORBIDDEN", message: "Admin privileges required." });
    }

    req.user = decoded; // Attach user context to request
    next();
  } catch (err) {
    logger.error("[AUTH] Invalid or expired session token");
    return res.status(403).json({ 
      success: false, 
      error: "INVALID_SESSION", 
      message: "Your session has expired. Please log in again." 
    });
  }
};

/**
 * GET /api/settings/
 * BSS-56: Retrieves masked environment variables and the deployment registry.
 */
router.get("/", async (req, res) => {
  const envData = Object.entries(process.env).map(([key, value]) => ({
    key,
    value:
      key.includes("KEY") || key.includes("SECRET") || key.includes("PRIVATE")
        ? `****${value?.slice(-4)}`
        : value,
  }));

  res.json({ 
    success: true, 
    env: envData,
    deploymentRegistry: sharedEngineState.deploymentHistory,
    ghostMode: sharedEngineState.ghostMode,
    clientProfile: sharedEngineState.clientProfile,
    integrityThreshold: sharedEngineState.integrityThreshold
  });
});

/**
 * POST /api/settings/redeploy
 * BSS-52: Triggers a system reboot via Alpha-Copilot Mission Command.
 */
router.post("/redeploy", checkAdmin, async (req, res) => {
  try {
    // Command directed at the Rust backbone for a clean performance optimization restart
    const command = "pkill -f rust-backbone || true && /app/bin/rust-backbone";
    const result = await alphaCopilot.executeMissionCommand(command);

    if (!result.executed) {
      return res.status(403).json({ 
        success: false, 
        error: result.error, 
        message: result.message 
      });
    }

    // BSS-56: Register the manual/AI upgrade in the history ledger
    sharedEngineState.deploymentHistory.unshift({
      id: sharedEngineState.deploymentHistory.length + 1,
      commitHash: 'UPGRADE',
      commitMessage: 'Alpha-Copilot: Performance Optimization Redeploy',
      cloudProvider: 'RENDER',
      timestamp: new Date(),
      smartAccount: sharedEngineState.walletAddress || '0x...',
      contractAddress: sharedEngineState.flashloanContractAddress || '0x...',
      isActive: true,
      triggeredBy: sharedEngineState.currentUserRole === 'ADMIN' ? 'USER' : 'ALPHA_COPILOT'
    });

    logger.info("[SETTINGS] System reboot sequence initiated via command gateway");
    res.json({
      success: true,
      message: "Redeploy command dispatched to backbone.",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

/**
 * PUT /api/settings/
 * BSS-WhiteLabel: Updates system operational state (Ghost Mode, Integrity Thresholds).
 */
router.put("/", checkAdmin, async (req, res) => {
  const { env, data } = req.body;
  
  if (data) {
    if (data.ghostMode !== undefined) sharedEngineState.ghostMode = data.ghostMode;
    if (data.integrityThreshold !== undefined) sharedEngineState.integrityThreshold = data.integrityThreshold;
    logger.info({ data }, "[SETTINGS] System state updated");
  }

  if (env && Array.isArray(env)) {
    for (const item of env) {
      process.env[item.key] = item.value;
    }
    logger.info("[SETTINGS] Environment variables updated for current session");
  }

  res.json({ success: true });
});

/**
 * GET /api/settings/audit/export
 * BSS-52: Generates and streams the signed PDF Audit Report.
 */
router.get("/audit/export", async (req, res) => {
  try {
    const pdfBuffer = await alphaCopilot.generateAuditPDFBuffer();
    const appName = sharedEngineState.appName || (sharedEngineState.ghostMode ? 'Elite Protocol' : 'allbright');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${appName.replace(/\s/g, '_')}_Audit_${timestamp}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

export default router;
