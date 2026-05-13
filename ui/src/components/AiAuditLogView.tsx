import React, { useState, useEffect, useCallback } from 'react';
import { ScrollText, Zap, RotateCcw } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'sonner';

/**
 * AiAuditLogView: Explainable AI (XAI) Ledger.
 * Pulls real-time tuning decisions to provide an audit trail of cognitive actions.
 */
export const AiAuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      const response = await fetch('/api/copilot/ai-decisions');
      const data = await response.json();
      if (data.success) {
        setLogs(data.decisions);
      }
    } catch (err) {
      console.error("Audit log sync failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleRollback = async (log: any) => {
    const preState = log.pre_state_json;
    if (!preState || Object.keys(preState).length === 0) {
      toast.error("No valid rollback state found in this log entry.");
      return;
    }

    try {
      // The preState is already a JSON object, no need to stringify again
      await invoke('rollback_ai_state', { preStateJson: JSON.stringify(preState) });
      toast.success(`Rolled back ${log.specialist} to previous state.`);
      // Optionally refetch logs or update UI to reflect rollback
      fetchLogs();
    } catch (err) {
      console.error("Tauri rollback command failed:", err);
      toast.error("Tauri rollback command failed.", {
        description: String(err)
      });
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="rounded-lg border border-ash-border overflow-hidden bg-ash-black/20 max-h-[400px] overflow-y-auto custom-scrollbar shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead className="bg-ash-black text-[9px] uppercase text-ash-muted font-black tracking-widest border-b border-ash-border sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Specialist</th>
              <th className="px-4 py-3">Decision / Rationale</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ash-border/30 text-[11px]">
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-ash-muted italic animate-pulse">Syncing with decision ledger...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-ash-muted italic font-mono uppercase tracking-tighter">No tuning actions recorded in current session.</td></tr>
            ) : logs.map((log: any) => (
              <tr key={log.id} className="hover:bg-ash-black/40 transition-colors group">
                <td className="px-4 py-3 text-ash-muted font-mono whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString()}</td>
                <td className="px-4 py-3 font-bold text-cyan-accent uppercase text-[10px]">{log.specialist}</td>
                <td className="px-4 py-3">
                  <p className="text-white font-black">{log.command}</p>
                  <p className="text-[10px] text-ash-muted mt-1 leading-relaxed italic">"{log.rationale}"</p>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-emerald-500 font-black text-[9px] uppercase tracking-tighter">OPTIMIZED</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button 
                    onClick={() => handleRollback(log)}
                    className="p-1.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500 hover:text-black transition-all flex items-center gap-1 ml-auto group"
                  >
                    <RotateCcw size={10} className="group-hover:animate-spin" />
                    <span className="text-[9px] font-black uppercase">Rollback</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-2 text-[9px] text-ash-muted">
        <ScrollText size={10} />
        <span>BSS-60: Explainable AI (XAI) Audit Trail enabled. Sourced from pg.ai_decisions.</span>
      </div>
    </div>
  );
};