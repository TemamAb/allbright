/**
 * Allbright Desktop - Deployment Readiness Component
 * Displays deployment readiness status and controls in the desktop UI
 */

import { useState, useEffect } from "react";
import { getReadinessStatus, runReadinessCheck, ReadinessStatus, ReadinessReport, CheckItem } from "../services/tauriApi";

// Helper to render status badge
function StatusBadge({ status }: { status: string }) {
  const colors = {
    PASS: "bg-green-500",
    FAIL: "bg-red-500",
    WARN: "bg-yellow-500",
  };
  const color = colors[status as keyof typeof colors] || "bg-gray-500";
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`}>
      {status}
    </span>
  );
}

// Helper to render check item row
function CheckItemRow({ item, label }: { item: CheckItem; label: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-700">
      <span className="text-sm text-gray-300">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 max-w-[200px] truncate">{item.details}</span>
        <StatusBadge status={item.status} />
      </div>
    </div>
  );
}

export default function DeploymentReadiness() {
  const [summary, setSummary] = useState<ReadinessStatus | null>(null);
  const [report, setReport] = useState<ReadinessReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch summary on mount
  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const status = await getReadinessStatus();
      setSummary(status);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleRunCheck = async () => {
    setChecking(true);
    setError(null);
    try {
      const result = await runReadinessCheck();
      setReport(result);
      setSummary({
        ready: result.overall_status === "READY_FOR_DEPLOYMENT",
        missing_approvals: result.gates.filter(g => !g.approved).map(g => g.gate_id),
        issues: result.issues,
        recommendations: result.recommendations,
      });
    } catch (e) {
      setError(String(e));
    } finally {
      setChecking(false);
    }
  };

  // Overall status coloring
  const overallStatus = report?.overall_status || (summary?.ready ? "READY_FOR_DEPLOYMENT" : "BLOCKED");
  const statusColors: Record<string, string> = {
    READY_FOR_DEPLOYMENT: "bg-green-500",
    PENDING_APPROVALS: "bg-yellow-500",
    BLOCKED: "bg-red-500",
  };
  const statusColor = statusColors[overallStatus] || "bg-gray-500";

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Deployment Readiness</h1>

      {/* Status Card */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">System Status</p>
            <p className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>
              {overallStatus.replace(/_/g, " ")}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Deployment Score</p>
            <p className="text-xl font-semibold">{report?.deployment_score ?? "--"}%</p>
          </div>
        </div>
      </div>

      {/* Control Button */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={handleRunCheck}
          disabled={checking || loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed py-3 px-4 rounded-lg font-medium transition-colors"
        >
          {checking ? "Checking..." : "Run Readiness Check"}
        </button>
        <button
          onClick={fetchSummary}
          disabled={loading || checking}
          className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 disabled:cursor-not-allowed py-3 px-4 rounded-lg font-medium transition-colors"
        >
          {loading ? "Loading..." : "Refresh Status"}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Strategic Checklist (from full report) */}
      {report?.strategic_checklist && (
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">Strategic Integration Checklist</h2>
          <div className="space-y-1">
            <CheckItemRow item={report.strategic_checklist.bribe_engine_sync} label="Bribe Engine Sync" />
            <CheckItemRow item={report.strategic_checklist.meta_learner_active} label="Meta-Learner Active" />
            <CheckItemRow item={report.strategic_checklist.kpi_persistence} label="KPI Persistence" />
            <CheckItemRow item={report.strategic_checklist.simulation_gate} label="Simulation Gate (GES)" />
            <CheckItemRow item={report.strategic_checklist.liquidity_gate} label="Liquidity / Gasless" />
            <CheckItemRow item={report.strategic_checklist.orchestrator_health} label="Orchestrator Health" />
            <CheckItemRow item={report.strategic_checklist.source_integrity} label="Source Integrity" />
            <CheckItemRow item={report.strategic_checklist.disaster_recovery} label="Disaster Recovery" />
            <CheckItemRow item={report.strategic_checklist.apex_pursuit_active} label="Apex Pursuit" />
            <CheckItemRow item={report.strategic_checklist.engineering_integrity} label="Engineering Integrity" />
            <CheckItemRow item={report.strategic_checklist.private_relay_active} label="Private Relay" />
          </div>
        </div>
      )}

      {/* Issues & Recommendations (when not ready) */}
      {(summary?.issues.length || summary?.recommendations.length) && (
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">Issues & Recommendations</h2>
          
          {summary?.issues.length ? (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-red-400 mb-2">Issues ({summary.issues.length})</h3>
              <ul className="space-y-1">
                {summary.issues.map((issue, i) => (
                  <li key={i} className="text-sm text-gray-300">• {issue}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {summary?.recommendations.length ? (
            <div>
              <h3 className="text-sm font-medium text-yellow-400 mb-2">Recommendations ({summary.recommendations.length})</h3>
              <ul className="space-y-1">
                {summary.recommendations.map((rec, i) => (
                  <li key={i} className="text-sm text-gray-300">• {rec}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}

      {/* Gates Status (from full report) */}
      {report?.gates && report.gates.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Deployment Gates</h2>
          <div className="grid grid-cols-2 gap-4">
            {report.gates.map((gate, i) => (
              <div key={i} className="flex items-center justify-between py-2 border border-gray-600 rounded px-3">
                <span className="text-sm text-gray-300">{gate.gate_name}</span>
                <StatusBadge status={gate.approved ? "PASS" : gate.status === "PENDING_HUMAN_APPROVAL" ? "WARN" : "FAIL"} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
