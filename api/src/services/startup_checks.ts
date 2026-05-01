/**
 * BrightSky Startup Check System
 * Verifies all required environment variables and system dependencies.
 * Provides visual ✅/❌ feedback and system-ready signaling.
 */

// Track startup state
let systemReady = false;
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

/**
 * SINGLE UNIFIED COMMAND: `node run-readiness-report.js`
 * DEPRECATED - redirects to master workflow/report
 */
export async function runStartupChecks(): Promise<boolean> {
  console.log('[STRATEGIC] Initializing unified startup sequence...');
  const { generateDeploymentReadinessReport } = await import('./deploy_gatekeeper.js');
  const report = await generateDeploymentReadinessReport();
  const ready = report.overallStatus === 'READY_FOR_DEPLOYMENT';

  if (ready) {
    systemReady = true;
    startHeartbeat();
    if (process.env.PAPER_TRADING_MODE === "false") {
        triggerSystemReadyBeep();
    }
  }
  
  return ready;
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
