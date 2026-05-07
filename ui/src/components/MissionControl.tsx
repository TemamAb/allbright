/**
 * Allbright Desktop - Mission Control Component
 * Engine controls for starting, stopping, and monitoring the arbitrage solver
 * Supports all workflow stages from work-flow-guide.md
 */

import { useState, useEffect } from "react";
import { startSolver, stopSolver, getSolverStatus, getLogs, SolverStatus, WorkflowStage, WORKFLOW_STAGES, requiresConfirmation } from "../services/tauriApi";

export default function MissionControl() {
  const [status, setStatus] = useState<SolverStatus>({ running: false, mode: "simulation" });
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingMode, setPendingMode] = useState<WorkflowStage | null>(null);
  const [selectedStage, setSelectedStage] = useState<WorkflowStage>("simulation");

  // Poll status every 2 seconds
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const s = await getSolverStatus();
        setStatus(s);
      } catch (e) {
        console.error("Failed to get status:", e);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  // Fetch logs when running
  useEffect(() => {
    if (!status.running) return;

    const fetchLogs = async () => {
      try {
        const l = await getLogs();
        setLogs(l);
      } catch (e) {
        console.error("Failed to get logs:", e);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 1000);
    return () => clearInterval(interval);
  }, [status.running]);

  const handleStart = async (stage: WorkflowStage) => {
    if (requiresConfirmation(stage)) {
      setPendingMode(stage);
      setShowConfirm(true);
      return;
    }
    await doStart(stage);
  };

  const doStart = async (stage: WorkflowStage) => {
    setLoading(true);
    setError(null);
    try {
      await startSolver(stage);
      setStatus({ running: true, mode: stage, stage });
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    setError(null);
    try {
      await stopSolver();
      setStatus({ running: false, mode: status.mode });
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const confirmLive = () => {
    if (pendingMode) {
      doStart(pendingMode);
    }
    setShowConfirm(false);
    setPendingMode(null);
  };

  // Get stage info
  const currentStageInfo = WORKFLOW_STAGES.find(s => s.value === status.mode);

  // Status color - based on risk level
  const getStatusColor = () => {
    if (!status.running) return "bg-gray-500";
    const mode = status.mode;
    if (mode === "live") return "bg-red-600";
    if (mode === "canary" || mode === "live-simulation") return "bg-orange-500";
    if (mode === "shadow" || mode === "paper-trading") return "bg-yellow-500";
    return "bg-green-500";
  };

  // Filter stages based on current state
  const availableStages = status.running 
    ? WORKFLOW_STAGES.filter(s => s.value === status.mode)
    : WORKFLOW_STAGES;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Mission Control</h1>

      {/* Status Card */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Engine Status</p>
            <p className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
              {status.running ? "Running" : "Stopped"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Current Stage</p>
            <p className="text-xl font-semibold uppercase">{currentStageInfo?.label || status.mode}</p>
          </div>
        </div>
        {currentStageInfo && (
          <p className="text-sm text-gray-500 mt-2">{currentStageInfo.description}</p>
        )}
      </div>

      {/* Stage Selector */}
      {!status.running && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Select Workflow Stage
          </label>
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value as WorkflowStage)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 px-4 text-white"
          >
            {WORKFLOW_STAGES.map(stage => (
              <option key={stage.value} value={stage.value}>
                {stage.label} - {stage.description}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => handleStart(selectedStage)}
          disabled={loading || status.running}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed py-3 px-4 rounded-lg font-medium transition-colors"
        >
          Start {currentStageInfo?.label || selectedStage}
        </button>
        <button
          onClick={handleStop}
          disabled={loading || !status.running}
          className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 disabled:cursor-not-allowed py-3 px-4 rounded-lg font-medium transition-colors"
        >
          Stop
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Log Viewer */}
      <div className="bg-gray-900 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3">Engine Logs</h2>
        <div className="h-64 overflow-y-auto font-mono text-sm">
          {logs.length === 0 ? (
            <p className="text-gray-500">No logs available</p>
          ) : (
            logs.map((log, i) => (
              <p key={i} className="text-gray-300 py-0.5">{log}</p>
            ))
          )}
        </div>
      </div>

      {/* Live Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md">
            <h3 className="text-xl font-bold text-red-400 mb-4">
              ⚠️ {pendingMode === "live" ? "Live Trading" : "Risk Stage"} Warning
            </h3>
            <p className="text-gray-300 mb-6">
              You are about to start <strong className="text-white">{currentStageInfo?.label}</strong>.
              {pendingMode === "live-simulation" && " This will use real funds with limited exposure."}
              {pendingMode === "canary" && " This will begin canary release to production."}
              {pendingMode === "live" && " This will trade with REAL money. Are you absolutely sure?"}
            </p>
            <div className="flex gap-4">
              <button
                onClick={confirmLive}
                className="flex-1 bg-red-600 hover:bg-red-700 py-2 px-4 rounded-lg font-medium"
              >
                Yes, Proceed
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 py-2 px-4 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
