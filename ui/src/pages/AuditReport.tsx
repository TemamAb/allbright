import { useGetAuditReport } from "@workspace/api-client-react";
import { AlertCircle, CheckCircle, Shield, Activity } from "lucide-react";

export default function AuditReport() {
  const { data: audit } = useGetAuditReport();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield size={20} className="text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Architect Audit Report</h1>
      </div>

      <div className="glass-panel p-6 rounded-lg border">
        <h2 className="text-lg font-bold mb-4">KPI Specialist Status (7 Categories)</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {audit?.specialists?.map((spec, idx) => (
            <div key={idx} className={`p-4 rounded border ${spec.active ? 'border-emerald-400/30 bg-emerald-400/5' : 'border-destructive/30 bg-destructive/5'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Activity size={16} className="text-primary" />
                <span className="font-bold text-sm">{spec.name}</span>
              </div>
              <div className="text-xs text-muted-foreground mb-1">{spec.category}</div>
              <div className={`text-xs font-mono ${spec.active ? 'text-emerald-400' : 'text-destructive'}`}>
                Status: {spec.active ? 'Tuning 24/7' : 'Inactive'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel p-6 rounded-lg border">
        <h2 className="text-lg font-bold mb-4">AlphaCopilot Orchestration</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-bold mb-2">Last Tune Cycle</div>
            <div className="text-xs text-muted-foreground">
              {audit?.lastTuneCycle || 'Never'}
            </div>
          </div>
          <div>
            <div className="text-sm font-bold mb-2">Orchestrated Specialists</div>
            <div className="text-xs text-muted-foreground">
              {audit?.specialists?.length || 0}/7
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

