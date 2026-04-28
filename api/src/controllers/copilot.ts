import { Router } from "express";
import { alphaCopilot } from "../services/alphaCopilot";

const router = Router();

/**
 * POST /api/copilot/command
 * Handle commands from the Alpha-Copilot interactive interface.
 * For now, we run the analyzePerformance method to get a system report.
 * In the future, this can be expanded to handle specific intents and commands.
 */
router.post("/command", async (req, res) => {
  try {
    const { command } = req.body;

    broadcastCopilotEvent('command-received', `Human Commander: ${command}`);
    
    // Parse command for specialist orchestration
    let report = '';
    if (command.toLowerCase().includes('tune') || command.toLowerCase().includes('kpi')) {
      const result = await alphaCopilot.fullKpiTuneCycle({});
      report = `Full KPI tune cycle complete. Results:\\n${JSON.stringify(result, null, 2)}`;
      broadcastCopilotEvent('success', 'KPI Tune Cycle Complete', result);
    } else if (command.toLowerCase().includes('dispatch') || command.toLowerCase().includes('debug')) {
      const dispatchResult = await alphaCopilot.handleRouteDispatch({ target: 'bss_16', intent: 'Audit', payload: command });
      report = `Debug order dispatched. Result: ${JSON.stringify(dispatchResult)}`;
    } else {
      report = await alphaCopilot.analyzePerformance();
    }

    broadcastCopilotStatus();

    res.json({
      success: true,
      response: report,
      command,
    });
  } catch (err) {
    broadcastCopilotEvent('error', 'Command execution failed', { error: String(err) });
    console.error("Alpha-Copilot command error:", err);
    res.status(500).json({ success: false, error: String(err) });
  }
});

/**
 * GET /api/copilot/status
 * Get the current status of the Alpha-Copilot system.
 */
router.get("/status", async (req, res) => {
  try {
    // We can use the analyzePerformance method to get a status report
    const report = await alphaCopilot.analyzePerformance();
    res.json({
      success: true,
      status: "online",
      report,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

export default router;