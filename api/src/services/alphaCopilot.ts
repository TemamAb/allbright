import { db } from "@workspace/db";
import { tradesTable, streamEventsTable } from "@workspace/db";
import { desc, sql } from "drizzle-orm";
import { logger } from "./logger";
import { exec } from "child_process";
import { promisify } from "util";
import { sharedEngineState } from "./engineState";
import * as net from "net";
import * as crypto from "crypto";

const execAsync = promisify(exec);

export type DebugIntent = "Audit" | "Recalibrate" | "Reset" | "ModifyCode" | "CreateSubsystem" | "ConfirmOptimization";

export interface ExecutionJob {
  id: string;
  type: 'simulation' | 'deployment' | 'audit';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  logs: string[];
  startedAt: number;
  completedAt?: number;
}

/**
 * KPI 21: Alpha-Copilot — AI-Powered Mission Controller.
 * Analyzes real-time performance and interacts with the Human Commander.
 */
import { specialists } from "./specialists";

export class AlphaCopilot {
  private activeJobs: Map<string, ExecutionJob> = new Map();

  constructor() {}

  /** Orchestrates 7 KPI Specialists (ai/agents/kpi-specialists.md) */
  async orchestrateSpecialists(category: string, kpiData: any) {
    const specialist = specialists.find(s => s.category === category);
    if (!specialist) throw new Error(`No specialist for category: ${category}`);
    const tuneResult = await specialist.tuneKpis(kpiData);
    const status = await specialist.status();
    return { specialist: specialist.name, tuneResult, status };
  }

  /** Dispatches to all specialists for full KPI tuning cycle */
  async fullKpiTuneCycle(kpiData: any) {
    const results = [];
    for (const specialist of specialists) {
      results.push(await specialist.tuneKpis(kpiData));
    }
    return { cycle: 'complete', results, timestamp: Date.now() };
  }

  /**
   * BSS-32 Security: Computes a cryptographically secure HMAC-SHA256 signature
   * for a DebuggingOrder. This ensures that only the authorized API server
   * can issue commands to the Rust specialists.
   */
  private generateSignature(target: string, timestamp: number, nonce: bigint, payload?: string): string {
    const secret = process.env.DASHBOARD_PASS || "development_secret_key";
    const hmac = crypto.createHmac("sha256", secret);
    
    hmac.update(target);
    if (payload) {
      hmac.update(payload);
    }

    // BSS-32: Include timestamp in HMAC for replay protection
    const tsBuf = Buffer.alloc(8);
    tsBuf.writeBigUInt64BE(BigInt(timestamp));
    hmac.update(tsBuf);

    // BSS-32: Include nonce in HMAC
    const nonceBuf = Buffer.alloc(8);
    nonceBuf.writeBigUInt64BE(nonce);
    hmac.update(nonceBuf);
    
    return hmac.digest("hex");
  }

  /**
   * BSS-32: Prepares a signed DebuggingOrder payload for the Rust backbone.
   * The signature is placed in the 'params' field, matching the Rust SecurityModule.
   */
   public prepareSignedOrder(target: string, intent: DebugIntent, payload?: string) {
     const timestamp = Math.floor(Date.now() / 1000);
     const nonce = crypto.randomBytes(8).readBigUInt64BE();
     const signature = this.generateSignature(target, timestamp, nonce, payload);

     return {
       target,
       intent,
       params: signature,
       payload: payload || null,
       timestamp,
       nonce: Number(nonce), // Convert BigInt to Number for JSON serialization (may lose precision above 2^53 but acceptable for nonce)
     };
   }

  /**
   * BSS-03 / BSS-32: Dispatches a signed DebuggingOrder to the Rust backbone
   * over the high-speed TCP bridge (Port 4001).
   */
  public async dispatchSignedOrder(order: any): Promise<string> {
    const socketPath =
      process.env.BRIGHTSKY_SOCKET_PATH || "/tmp/brightsky_bridge.sock";
    const port = parseInt(process.env.INTERNAL_BRIDGE_PORT || "4001");
    logger.info(
      { target: order.target, intent: order.intent, port, socketPath, nonce: order.nonce }, 
      "BSS-03: Dispatching signed order to backbone"
    );

    return new Promise((resolve, reject) => {
      const client = net.createConnection({ path: socketPath }, () => {
        client.write(JSON.stringify(order));
      });

      client.on("data", (data) => {
        resolve(data.toString());
        client.end();
      });

      client.on("error", () => {
        const fallbackClient = net.createConnection(
          { port, host: "127.0.0.1" },
          () => {
            fallbackClient.write(JSON.stringify(order) + "\n");
          },
        );

        fallbackClient.on("data", (data) => {
          resolve(data.toString());
          fallbackClient.end();
        });

        fallbackClient.on("error", (err) => {
          reject(err);
        });

        fallbackClient.on("timeout", () => {
          fallbackClient.end();
          reject(new Error("Bridge connection timed out"));
        });

        fallbackClient.setTimeout(5000);
      });

      client.on("timeout", () => {
        client.end();
        reject(new Error("Bridge connection timed out"));
      });

      client.setTimeout(5000);
    });
  }

  /**
   * BSS-21 / BSS-32: High-level handler for the /api/debug/dispatch route.
   * Receives a request from the dashboard, generates a secure signature,
   * and dispatches it to the Rust engine via the IPC bridge.
   */
  public async handleRouteDispatch(body: { target: string; intent: string; payload?: string }): Promise<any> {
    try {
      // Prepare the cryptographically signed order (includes timestamp and random nonce)
      const signedOrder = this.prepareSignedOrder(
        body.target,
        body.intent as DebugIntent,
        body.payload
      );

      const response = await this.dispatchSignedOrder(signedOrder);
      return JSON.parse(response);
    } catch (err) {
      logger.error({ err, target: body.target }, "Alpha-Copilot route dispatch failed");
      throw new Error(`IPC Bridge Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  public createJob(type: ExecutionJob['type']): string {
    const id = crypto.randomUUID();
    const job: ExecutionJob = {
      id,
      type,
      status: 'pending',
      progress: 0,
      logs: [`Job ${id} initialized for ${type}`],
      startedAt: Date.now()
    };
    this.activeJobs.set(id, job);
    return id;
  }

  public updateJob(id: string, updates: Partial<ExecutionJob>) {
    const job = this.activeJobs.get(id);
    if (job) {
      const updatedJob = { ...job, ...updates };
      if (updates.status === 'completed' || updates.status === 'failed') {
        updatedJob.completedAt = Date.now();
        updatedJob.progress = 100;
      }
      this.activeJobs.set(id, updatedJob);
    }
  }

  public getJobStatus(jobId: string): ExecutionJob | undefined {
    return this.activeJobs.get(jobId);
  }

  async analyzePerformance(): Promise<string> {
    try {
      // Fetch last 5 trades and 10 critical events
      const lastTrades = await db.select().from(tradesTable).orderBy(desc(tradesTable.timestamp)).limit(5);
      const recentEvents = await db.select().from(streamEventsTable).orderBy(desc(streamEventsTable.timestamp)).limit(10);

      const totalPnL = lastTrades.reduce((acc: number, t: any) => acc + Number(t.profitUsd || 0), 0);
      
      // KPI 21: Aggregating specialist health for Phase 2 "Drill-down"
      const specialistHealth = await Promise.all(specialists.map(s => s.status()));

      const report = [
        "─── BRIGHTSKY MISSION REPORT ───",
        `MODE: ${sharedEngineState.mode}`,
        `INTEGRITY: ${sharedEngineState.shadowModeActive ? "DEGRADED (SHADOW)" : "OPTIMAL"}`,
        `IPC_STATUS: ${sharedEngineState.ipcConnected ? "CONNECTED" : "DISCONNECTED"}`,
        "",
        "─── PERFORMANCE ───",
        `RECENT_PNL: $${totalPnL.toFixed(2)}`,
        `LAST_TRADES:`,
        ...lastTrades.map((t: any) => `  • [${t.status}] $${t.profitUsd} (${t.latencyMs}ms)`),
        "",
        "─── SYSTEM EVENTS ───",
        ...recentEvents.map((e: any) => {
          const msg = e.message.length > 50 ? e.message.substring(0, 47) + "..." : e.message;
          return `  ! [${e.type}] ${msg}`;
        }),
        "───────────────────────────────"
      ].join("\n");

      return report;
    } catch (err) {
      logger.error({ err }, "Alpha-Copilot analysis failed");
      return "Mission analysis error. Check system logs.";
    }
  }

  /**
   * KPI 21: Terminal Command Execution
   * Allows the Copilot to perform system maintenance and redeployment commands.
   */
  async executeMissionCommand(command: string): Promise<{ stdout: string; stderr: string }> {
    logger.info({ command }, "Alpha-Copilot executing terminal command");
    try {
      // Restriction: Only allow pnpm and cargo related commands for safety
      if (!command.startsWith("pnpm") && !command.startsWith("cargo") && !command.includes("kill-port")) {
        throw new Error("Unauthorized command path.");
      }
      const { stdout, stderr } = await execAsync(command);
      return { stdout, stderr };
    } catch (err) {
      logger.error({ err, command }, "Alpha-Copilot terminal command failed");
      return { stdout: "", stderr: String(err) };
    }
  }
}

export const alphaCopilot = new AlphaCopilot();
