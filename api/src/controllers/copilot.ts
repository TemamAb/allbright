import { Router } from "express";
import { alphaCopilot } from "../services/alphaCopilot";
const router = Router();

const broadcastCopilotEvent = (type: string, data: any) => {
  try {
    const io = (global as any).io;
    if (io) io.emit('copilot_event', { type, data, timestamp: Date.now() });
  } catch(e) {}
};

const broadcastCopilotStatus = (status?: string, data?: any) => {
  try {
    const io = (global as any).io;
    if (io) io.emit('copilot_status', { status, data, timestamp: Date.now() });
  } catch(e) {}
};

/**
 * POST /api/copilot/command
 * Handle commands from the Alpha-Copilot interactive interface.
 * For now, we run the analyzePerformance method to get a system report.
 * In the future, this can be expanded to handle specific intents and commands.
 */
router.post("/command", async (req, res) => {
  try {
    const { command } = req.body;

    broadcastCopilotEvent('user-message', { content: command, role: 'user' });
    
    // Parse command for specialist orchestration
    let report = '';
    if (command.toLowerCase().includes('tune') || command.toLowerCase().includes('kpi')) {
      broadcastCopilotEvent('ai-status', 'Analyzing KPI Drift...');
      const result = await alphaCopilot.fullKpiTuneCycle({});
      report = `Full KPI tune cycle complete. Results:\\n${JSON.stringify(result, null, 2)}`;
      broadcastCopilotEvent('ai-message', { content: report, role: 'assistant', meta: result });
    } else if (command.toLowerCase().includes('audit') || command.toLowerCase().includes('readiness')) {
      const auditResult = await alphaCopilot.checkDeploymentReadiness();
      report = `System Audit complete. Result: ${JSON.stringify(auditResult)}`;
      broadcastCopilotEvent('audit-complete', auditResult);
    } else if (command.toLowerCase().includes('dispatch') || command.toLowerCase().includes('debug')) {
      const dispatchResult = await alphaCopilot.handleRouteDispatch({ target: 'bss_16', intent: 'Audit', payload: command });
      report = `Debug order dispatched. Result: ${JSON.stringify(dispatchResult)}`;
    } else if (command.toLowerCase().includes('start engine')) {
      // Direct command to start engine
      const result = await fetch(`http://localhost:${process.env.PORT || 3000}/api/engine/start`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'LIVE' })
      });
      const data = await result.json();
      report = `Engine Activation Order: ${data.success ? 'EXECUTED' : 'FAILED - ' + data.error}`;
      broadcastCopilotEvent('engine-update', data);
    } else if (command.toLowerCase().includes('stop engine')) {
      const result = await fetch(`http://localhost:${process.env.PORT || 3000}/api/engine/stop`, { method: 'POST' });
      const data = await result.json();
      report = `Engine Deactivation Order: ${data.success ? 'EXECUTED' : 'FAILED'}`;
      broadcastCopilotEvent('engine-update', data);
    } else if (command.toLowerCase().includes('mode')) {
      const targetMode = command.toLowerCase().includes('live') ? 'LIVE' : 'SHADOW';
      const result = await fetch(`http://localhost:${process.env.PORT || 3000}/api/engine/start`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: targetMode })
      });
      const data = await result.json();
      report = `Engine Mode Shifted to ${targetMode}: ${data.success ? 'SUCCESS' : 'FAILED'}`;
      broadcastCopilotEvent('engine-update', data);
    } else if (command.toLowerCase().startsWith('set ai model')) {
      const model = command.toLowerCase().replace('set ai model', '').trim();
      const success = alphaCopilot.switchModel(model);
      report = success ? `AI Intelligence successfully switched to ${model.toUpperCase()}.` : `Provider ${model} is unavailable. Verify API keys in .env.`;
      broadcastCopilotEvent('model-update', { model, success });
    } else {
      report = await alphaCopilot.askLLM(command);
    }

    broadcastCopilotStatus();

    res.json({
      success: true,
      response: report,
      command,
    });
  } catch (err) {
    broadcastCopilotEvent('error', { message: 'Command execution failed', error: String(err) });
    console.error("Alpha-Copilot command error:", err);
    res.status(500).json({ success: false, error: String(err) });
  }
});

/**
 * POST /api/copilot/articulate
 * BSS-28: Refines user prompts before execution to help less skilled operators.
 */
router.post("/articulate", async (req, res) => {
  try {
    const { command } = req.body;
    // Broadcast raw intent to UI for context
    broadcastCopilotEvent('user-message', { content: command, role: 'user' });
    const articulated = await alphaCopilot.articulateCommand(command);
    res.json({ success: true, articulated });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

/**
 * POST /api/copilot/save-model
 * BSS-28: Manually triggers persistence of the MetaLearner state.
 */
router.post("/save-model", async (req, res) => {
  try {
    await alphaCopilot.save_model();
    res.json({ success: true, message: "MetaLearner state persisted to database." });
  } catch (err) {
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
      availableModels: alphaCopilot.getAvailableModels(),
      report,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

/**
 * GET /api/copilot/orchestrator-status
 * Get the comprehensive orchestrator integration status.
 */
router.get("/orchestrator-status", async (req, res) => {
  try {
    const orchestratorStatus = await alphaCopilot.getOrchestratorIntegrationStatus();
    res.json({
      success: true,
      orchestratorStatus,
    });
  } catch (err) {
    console.error("Orchestrator status error:", err);
    res.status(500).json({ success: false, error: String(err) });
  }
});

/**
 * POST /api/copilot/orchestrate
 * Orchestrate specialists with optional gate approval integration.
 */
router.post("/orchestrate", async (req, res) => {
  try {
    const { category, kpiData, requireGateApproval = false } = req.body;

    const result = await alphaCopilot.orchestrateWithGateApproval(
      category,
      kpiData,
      requireGateApproval
    );

    res.json({
      success: true,
      orchestration: result,
    });
  } catch (err) {
    console.error("Orchestration error:", err);
    res.status(500).json({ success: false, error: String(err) });
  }
});

/**
 * POST /api/copilot/orchestrate-kpi
 * Orchestrate specialist by specific KPI name.
 */
router.post("/orchestrate-kpi", async (req, res) => {
  try {
    const { kpiName, kpiData } = req.body;

    const result = await alphaCopilot.orchestrateByKPI(kpiName, kpiData);

    res.json({
      success: true,
      kpiOrchestration: result,
    });
  } catch (err) {
    console.error("KPI orchestration error:", err);
    res.status(500).json({ success: false, error: String(err) });
  }
});

/**
 * GET /api/copilot/kpi-specialists
 * Get comprehensive KPI specialist integration overview.
 */
router.get("/kpi-specialists", async (req, res) => {
  try {
    const overview = await alphaCopilot.getKPISpecialistOverview();

    res.json({
      success: true,
      kpiSpecialists: overview,
    });
  } catch (err) {
    console.error("KPI specialists overview error:", err);
    res.status(500).json({ success: false, error: String(err) });
  }
});

/**
 * GET /api/copilot/specialist-gate-integration
 * Get comprehensive specialist-gate keeper integration status.
 */
router.get("/specialist-gate-integration", async (req, res) => {
  try {
    const integrationStatus = await alphaCopilot.getSpecialistGateIntegrationStatus();
    res.json({
      success: true,
      integrationStatus,
    });
  } catch (err) {
    console.error("Specialist-gate integration status error:", err);
    res.status(500).json({ success: false, error: String(err) });
  }
});

export default router;
