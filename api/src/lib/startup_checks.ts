/**
 * BrightSky Startup Check System
 * Verifies all required environment variables and system dependencies.
 * Provides visual ✅/❌ feedback and system-ready signaling.
 */

// Track startup state
let systemReady = false;
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

// ANSI color helpers for console output
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;

function checkVar(
  name: string,
  value: string | null | undefined,
  mask = false,
): boolean {
  const hasValue = !!value;
  const display = value
    ? mask && value.length > 10
      ? value.slice(0, 6) + "..." + value.slice(-4)
      : value
    : "NOT SET";
  const status = hasValue ? green("✅") : red("❌");
  console.log(`[STARTUP CHECK] ${name}: ${status} (${display})`);
  return hasValue;
}

/**
 * Run all startup checks
 * Returns true if all critical checks pass
 */
export async function runStartupChecks(): Promise<boolean> {
  console.log("\n" + "=".repeat(60));
  console.log(cyan("[STARTUP] BrightSky Startup Check System initializing..."));
  console.log("=".repeat(60) + "\n");

  let allPassed = true;

  // ─── 1. Core API Keys ──────────────────────────────────────
  console.log(cyan("── Core API Keys ─"));
  const pimlicoKey = checkVar(
    "PIMLICO_API_KEY",
    process.env["PIMLICO_API_KEY"],
    true,
  );
  const entryPoint = checkVar(
    "ENTRYPOINT_ADDR",
    process.env["ENTRYPOINT_ADDR"],
  );
  const flashExecutor = checkVar(
    "FLASH_EXECUTOR_ADDRESS",
    process.env["FLASH_EXECUTOR_ADDRESS"],
  );
  const walletAddress = checkVar(
    "WALLET_ADDRESS",
    process.env["WALLET_ADDRESS"],
  );
  const privateKey = checkVar("PRIVATE_KEY", process.env["PRIVATE_KEY"], true);
  const profitWallet = checkVar(
    "PROFIT_WALLET_ADDRESS",
    process.env["PROFIT_WALLET_ADDRESS"],
  );

  if (!pimlicoKey) {
    allPassed = false;
  }
  if (!entryPoint) {
    allPassed = false;
  }
  if (!flashExecutor) {
    allPassed = false;
  }
  if (!walletAddress) {
    allPassed = false;
  }
  if (!privateKey) {
    allPassed = false;
  }

  // ─── 2. Chain & RPC ─────────────────────────────────────────
  console.log("\n" + cyan("── Chain & RPC ─"));
  const chainId = checkVar("CHAIN_ID", process.env["CHAIN_ID"]);
  const rpcEndpoint = checkVar("RPC_ENDPOINT", process.env["RPC_ENDPOINT"]);
  const pimlicoBundler = checkVar(
    "PIMLICO_BUNDLER_URL",
    process.env["PIMLICO_BUNDLER_URL"],
  );

  if (!rpcEndpoint) {
    allPassed = false;
  }

  // ─── 3. Verify Pimlico Connectivity ────────────────────────
  console.log("\n" + cyan("── Pimlico Connectivity ─"));
  let pimlicoOk = false;
  if (pimlicoKey && pimlicoBundler) {
    try {
      const res = await fetch(pimlicoBundler, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_supportedEntryPoints",
          params: [],
        }),
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const data = (await res.json()) as { result?: string[] };
        if (data.result && data.result.length > 0) {
          console.log(
            green("[STARTUP CHECK] PIMLICO Connectivity ✅ ") +
              `(EntryPoints: ${data.result.length})`,
          );
          pimlicoOk = true;
        } else {
          console.log(
            red("[STARTUP CHECK] PIMLICO Connectivity ❌ (Invalid response)"),
          );
        }
      } else {
        console.log(
          red(`[STARTUP CHECK] PIMLICO Connectivity ❌ (HTTP ${res.status})`),
        );
      }
    } catch (e) {
      console.log(red("[STARTUP CHECK] PIMLICO Connectivity ❌ (Unreachable)"));
    }
  } else {
    console.log(
      red(
        "[STARTUP CHECK] PIMLICO Connectivity ❌ (Missing key or bundler URL)",
      ),
    );
  }
  if (!pimlicoOk) allPassed = false;

  // ─── 4. Verify EntryPoint Format ─────────────────────────────
  if (entryPoint) {
    const isValid = entryPoint.startsWith("0x") && entryPoint.length === 42;
    const status = isValid ? green("✅") : red("❌");
    console.log(
      `[STARTUP CHECK] ENTRYPOINT_ADDR ${status} (${isValid ? "Valid format" : "Invalid format"})`,
    );
    if (!isValid) allPassed = false;
  }

  // ─── 5. Verify FlashExecutor Format ────────────────────────
  if (flashExecutor) {
    const isValid =
      flashExecutor.startsWith("0x") && flashExecutor.length === 42;
    const status = isValid ? green("✅") : red("❌");
    console.log(
      `[STARTUP CHECK] FLASH_EXECUTOR ${status} (${isValid ? "Valid format" : "Invalid format"})`,
    );
    if (!isValid) allPassed = false;
  }

  // ─── 6. Paper Trading Mode ────────────────────────────────
  console.log("\n" + cyan("── Execution Mode ─"));
  const paperTrading = process.env["PAPER_TRADING_MODE"];
  const isLive = paperTrading === "false";
  const modeStatus = isLive ? green("LIVE") : red("SHADOW");
  console.log(
    `[STARTUP CHECK] PAPER_TRADING_MODE: ${modeStatus} (${paperTrading ?? "NOT SET"})`,
  );

  // ─── Summary ─────────────────────────────────────────────
  console.log("\n" + "=".repeat(60));
  if (allPassed && isLive) {
    console.log(
      green(
        "[SYSTEM READY] LIVE execution mode armed - all systems check passed ✅",
      ),
    );
    systemReady = true;
    startHeartbeat();
    triggerSystemReadyBeep();
    return true;
  } else if (allPassed) {
    console.log(
      green("[SYSTEM READY] SHADOW mode ready - some checks passed ✅"),
    );
    systemReady = true;
    startHeartbeat();
    return true;
  } else {
    console.log(red("[SYSTEM READY] ❌ Some checks failed - review above"));
    return false;
  }
}

/**
 * Start heartbeat - logs system status every 60 seconds
 */
function startHeartbeat() {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  heartbeatInterval = setInterval(() => {
    if (systemReady) {
      console.log("[SYSTEM READY] LIVE execution mode in progress ✅");
    }
  }, 60_000); // 60 seconds
}

/**
 * Trigger double-beep when system is ready (Windows only)
 */
function triggerSystemReadyBeep() {
  try {
    if (process.platform === "win32") {
      // Use PowerShell to play Windows default beep sound
      const { exec } = require("child_process");
      // Double-beep with 1 second delay
      exec(
        '(New-Object Media.SoundPlayer).Play("C:\\Windows\\Media\\ding.wav"); Start-Sleep 1; (New-Object Media.SoundPlayer).Play("C:\\Windows\\Media\\ding.wav")',
        (err: Error | null) => {
          if (err) console.warn("[BEEP] Could not play sound:", err.message);
        },
      );
    }
  } catch {
    /* ignore sound errors */
  }
}

/**
 * Check if system is ready
 */
export function isSystemReady(): boolean {
  return systemReady;
}

/**
 * Stop heartbeat (for cleanup)
 */
export function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}
