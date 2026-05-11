import React, { useState } from "react";
import {
  Database,
  Eye,
  Globe,
  RefreshCcw,
  Save,
  Server,
  ShieldCheck,
  X,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { useSettingsOverview } from "@/lib/api";
import { useEngine } from "@/stores/engine";

const SystemSettings: React.FC = () => {
  const { data, isLoading, error, refetch } = useSettingsOverview();
  const { engine } = useEngine();
  const [showConfigModal, setShowConfigModal] = useState(false);

  const preloadedConfig = {
    RENDER_SERVICE_ID: 'srv-allbright-api-c4kl9',
    RENDER_INSTANCE_ID: 'inst-0af8-production',
    NODE_ENV: 'production',
    VITE_API_BASE_URL: 'https://allbright-api.onrender.com',
    REGION: 'Oregon (us-west-2)'
  };

  const importantEnv = (data?.env || []).filter((entry) =>
    [
      "NODE_ENV",
      "CHAIN_ID",
      "RPC_ENDPOINT",
      "PIMLICO_API_KEY",
      "DATABASE_URL",
      "PAPER_TRADING_MODE",
      "MEV_PROTECTION",
    ].includes(entry.key),
  );

  return (
    <div className="p-8 space-y-12 max-w-5xl animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">
            System Settings
          </h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] mt-3">
            Deployment-grade configuration overview
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="h-12 px-6 rounded-xl border-ash-border bg-ash-black text-zinc-300 hover:bg-zinc-800 font-black uppercase tracking-widest"
          >
            <RefreshCcw size={16} className="mr-2" />
            Refresh
          </Button>
          <Button
            disabled
            className="h-12 px-8 rounded-xl bg-emerald-accent/30 text-black/70 cursor-not-allowed font-black uppercase tracking-widest shadow-xl shadow-emerald-accent/10 flex items-center gap-3"
          >
            <Save size={18} />
            Admin Commit Required
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-xs font-bold text-red-400 uppercase tracking-widest">
          Settings overview unavailable
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-ash-black border border-ash-border rounded-2xl p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-cyan-accent/30" />
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
              <Server size={14} className="text-cyan-accent" /> Runtime Control Plane
            </h3>

            <div className="space-y-4">
              <ConfigRow label="Execution Mode" value={engine?.mode || "UNKNOWN"} />
              <ConfigRow
                label="Workflow Status"
                value={engine?.running ? "RUNNING" : "STOPPED"}
              />
              <ConfigRow
                label="Client Profile"
                value={data?.clientProfile || engine?.clientProfile || "DEFAULT"}
              />
              <ConfigRow
                label="Integrity Threshold"
                value={
                  data?.integrityThreshold != null
                    ? String(data.integrityThreshold)
                    : "--"
                }
              />
              <ConfigRow
                label="Ghost Mode"
                value={data?.ghostMode ? "ENABLED" : "DISABLED"}
              />
            </div>
          </div>

          <div className="bg-ash-black border border-ash-border rounded-2xl p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-accent/30" />
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
              <Database size={14} className="text-emerald-accent" /> Environment Surface
            </h3>

            <div className="space-y-3">
              {isLoading ? (
                <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                  Synchronizing environment registry...
                </div>
              ) : importantEnv.length === 0 ? (
                <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                  No environment keys available
                </div>
              ) : (
                importantEnv.map((entry) => (
                  <ConfigRow key={entry.key} label={entry.key} value={entry.value || "--"} mono />
                ))
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-ash-border/30">
              <button 
                onClick={() => setShowConfigModal(true)}
                className="text-[10px] font-black uppercase tracking-widest text-cyan-accent hover:text-white transition-colors flex items-center gap-2"
              >
                <Eye size={14} /> View Preloaded Config
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-8">
          <div className="bg-ash-black border border-ash-border rounded-2xl p-8 shadow-xl h-full flex flex-col">
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
              <ShieldCheck size={14} className="text-zinc-500" /> Security State
            </h3>

            <div className="space-y-6 flex-grow">
              <StatusRow label="Ghost Mode Isolation" status={data?.ghostMode ? "ACTIVE" : "STANDARD"} good />
              <StatusRow label="AA / Pimlico" status={engine?.pimlicoEnabled ? "ENABLED" : "DISABLED"} good={Boolean(engine?.pimlicoEnabled)} />
              <StatusRow label="Live Capability" status={engine?.liveCapable ? "READY" : "LIMITED"} good={Boolean(engine?.liveCapable)} />
              <StatusRow label="Circuit Breaker" status={engine?.circuitBreakerOpen ? "OPEN" : "NOMINAL"} good={!engine?.circuitBreakerOpen} />
            </div>

            <div className="mt-8 pt-8 border-t border-ash-border/50">
              <div className="bg-ash-dark rounded-2xl p-6 border border-ash-border/30">
                <div className="flex items-center gap-4 mb-4">
                  <Globe size={24} className="text-zinc-700" />
                  <div>
                    <h4 className="text-[10px] font-black text-white uppercase tracking-widest">
                      Deployment Registry
                    </h4>
                    <p className="text-[9px] text-zinc-600 font-bold uppercase mt-1">
                      {data?.deploymentRegistry?.length || 0} recorded deploy events
                    </p>
                  </div>
                </div>
                <Badge className="bg-zinc-800 text-zinc-400 text-[8px] font-black uppercase px-2 py-0.5 rounded tracking-widest">
                  Web Review Mode
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cloud Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-ash-black border border-ash-border w-full max-w-lg overflow-hidden shadow-2xl rounded-2xl">
            <div className="px-6 py-4 border-b border-ash-border flex justify-between items-center bg-ash-dark">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white italic">Cloud Environment Configuration</h3>
              <button onClick={() => setShowConfigModal(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {Object.entries(preloadedConfig).map(([key, val]) => (
                <div key={key} className="flex justify-between items-center p-3 bg-black border border-ash-border rounded-lg">
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{key}</span>
                  <span className="font-mono text-[11px] text-cyan-accent">{val}</span>
                </div>
              ))}
              <div className="p-4 bg-cyan-accent/5 border border-cyan-accent/20 rounded-xl">
                <p className="text-[9px] text-cyan-accent/80 font-bold uppercase leading-relaxed">
                  <ShieldCheck size={12} className="inline mr-2" />
                  Security Note: Sensitive credentials (PRIVATE_KEYS) are masked and only decrypted during LIVE_PRODUCTION execution.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ConfigRow = ({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) => (
  <div className="flex items-center justify-between py-3 border-b border-ash-border/30 last:border-0 gap-6">
    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
      {label}
    </span>
    <span
      className={`text-[10px] font-black text-zinc-300 truncate ${
        mono ? "font-mono" : ""
      }`}
    >
      {value}
    </span>
  </div>
);

const StatusRow = ({
  label,
  status,
  good,
}: {
  label: string;
  status: string;
  good?: boolean;
}) => (
  <div className="flex items-center justify-between py-4 border-b border-ash-border/30 last:border-0">
    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
      {label}
    </span>
    <div className="flex items-center gap-3">
      <span className={`text-[10px] font-black ${good ? "text-emerald-accent" : "text-amber-400"}`}>
        {status}
      </span>
      <div className={`w-1.5 h-1.5 rounded-full ${good ? "bg-emerald-accent animate-pulse" : "bg-amber-400"}`} />
    </div>
  </div>
);

export default SystemSettings;
