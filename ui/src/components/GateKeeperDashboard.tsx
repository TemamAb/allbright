import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GateStatus {
  gateId: string;
  gateName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  approvedBy?: string;
  approvedAt?: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  automatedChecks: number;
  requiresHumanApproval: boolean;
}

interface DeploymentReadiness {
  overallStatus: string;
  authorizationStatus: {
    authorized: boolean;
    missingApprovals: string[];
  };
  systemHealth: Record<string, string>;
  deploymentGates: Record<string, any>;
  riskAssessment: {
    overallRisk: string;
    blockingIssues: string[];
    recommendations: string[];
  };
}

export const GateKeeperDashboard: React.FC = () => {
  const [readiness, setReadiness] = useState<DeploymentReadiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedGate, setSelectedGate] = useState<string | null>(null);

  useEffect(() => {
    fetchReadiness();
    const interval = setInterval(fetchReadiness, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchReadiness = async () => {
    try {
      const response = await fetch('/api/deployment/readiness');
      const data = await response.json();
      setReadiness(data.readinessReport);
    } catch (error) {
      console.error('Failed to fetch deployment readiness:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestApproval = async (gateId: string) => {
    try {
      const response = await fetch(`/api/engine/gates/request/${gateId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requester: 'UI_USER',
          context: { source: 'dashboard' }
        })
      });
      const result = await response.json();
      alert(result.message);
      fetchReadiness(); // Refresh status
    } catch (error) {
      alert('Failed to request approval');
    }
  };

  const approveGate = async (gateId: string) => {
    const reason = prompt('Approval reason:');
    if (!reason) return;

    try {
      const response = await fetch(`/api/engine/gates/approve/${gateId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approver: 'UI_USER',
          reason
        })
      });
      const result = await response.json();
      alert(result.approved ? 'Gate approved!' : 'Approval failed');
      fetchReadiness();
    } catch (error) {
      alert('Failed to approve gate');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!readiness) {
    return <div className="text-red-500">Failed to load deployment status</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'text-green-500 bg-green-500/10 border-green-500';
      case 'PENDING': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500';
      case 'REJECTED': return 'text-red-500 bg-red-500/10 border-red-500';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'CRITICAL': return 'text-red-600';
      case 'HIGH': return 'text-orange-600';
      case 'MEDIUM': return 'text-yellow-600';
      default: return 'text-green-600';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">🚪 Gate Keeper System</h1>
        <p className="text-blue-100">Multi-layer deployment approval and authorization framework</p>

        <div className="mt-4 flex items-center space-x-4">
          <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
            readiness.overallStatus === 'READY_FOR_DEPLOYMENT'
              ? 'bg-green-500/20 text-green-100'
              : 'bg-red-500/20 text-red-100'
          }`}>
            {readiness.overallStatus === 'READY_FOR_DEPLOYMENT' ? '✅' : '❌'} {readiness.overallStatus}
          </div>

          <div className="text-sm">
            Missing: {readiness.authorizationStatus.missingApprovals.join(', ') || 'None'}
          </div>
        </div>
      </div>

      {/* Deployment Gates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(readiness.deploymentGates).map(([gateId, gate]: [string, any]) => (
          <motion.div
            key={gateId}
            className={`p-4 rounded-lg border-2 ${getStatusColor(gate.status)} cursor-pointer`}
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedGate(gateId)}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold capitalize">{gateId.replace('Gate', '')}</h3>
              <span className={`text-xs px-2 py-1 rounded ${getStatusColor(gate.status)}`}>
                {gate.status}
              </span>
            </div>

            <div className="text-sm space-y-1">
              {gate.approvedBy && <div>Approved by: {gate.approvedBy}</div>}
              {gate.approvedAt && <div>At: {new Date(gate.approvedAt).toLocaleString()}</div>}
            </div>

            <div className="mt-3 flex space-x-2">
              {gate.status === 'PENDING' && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); requestApproval(gateId); }}
                    className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                  >
                    Request
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); approveGate(gateId); }}
                    className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                  >
                    Approve
                  </button>
                </>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Risk Assessment */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-yellow-600 mb-2">⚠️ Risk Assessment</h3>
        <div className="text-sm space-y-1">
          <div>Overall Risk: <span className={getRiskColor(readiness.riskAssessment.overallRisk)}>
            {readiness.riskAssessment.overallRisk}
          </span></div>
          <div>Blocking Issues: {readiness.riskAssessment.blockingIssues.join(', ') || 'None'}</div>
          <div className="mt-2">
            <strong>Recommendations:</strong>
            <ul className="list-disc list-inside mt-1">
              {readiness.riskAssessment.recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-green-600 mb-2">🏥 System Health</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(readiness.systemHealth).map(([system, status]) => (
            <div key={system} className="text-center">
              <div className="text-xs text-gray-500 capitalize">{system.replace(/([A-Z])/g, ' $1')}</div>
              <div className={`text-lg ${status === 'PASS' ? 'text-green-500' : 'text-red-500'}`}>
                {status === 'PASS' ? '✅' : '❌'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency Override (for authorized users only) */}
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-red-600 mb-2">🚨 Emergency Override</h3>
        <p className="text-sm text-gray-600 mb-2">
          Bypasses all gates for critical deployments. Requires CEO/CTO authorization.
        </p>
        <button
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          disabled={true} // Disabled in UI for security
        >
          Emergency Override (Disabled)
        </button>
      </div>
    </div>
  );
};