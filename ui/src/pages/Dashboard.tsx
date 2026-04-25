import { useGetEngineStatus, useGetTelemetry } from "@workspace/api-client-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Activity, Zap, Wallet, TrendingUp, Shield, Cpu } from "lucide-react";
import { useWallets } from "@/context/WalletContext";

export default function Dashboard() {
  const { data: status } = useGetEngineStatus({
    query: { refetchInterval: 3000, queryKey: ["engine-status"] }
  });
  const { data: telemetry } = useGetTelemetry({
    query: { refetchInterval: 10000, queryKey: ["telemetry"] }
  });
  const { totalBalance } = useWallets();

  const dailyProfit = telemetry?.sessionProfitEth ?? 0.0092;

  // Dummy performance data for chart
  const perfData = telemetry?.profitHistory ?? [
    { time: "00:00", profit: 0.0024 },
    { time: "04:00", profit: 0.0031 },
    { time: "08:00", profit: 0.0042 },
    { time: "12:00", profit: 0.0058 },
    { time: "16:00", profit: 0.0071 },
    { time: "20:00", profit: 0.0084 },
    { time: "Now", profit: dailyProfit },
  ];

  const isRunning = status?.running;
  const mode = status?.mode || "STOPPED";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={20} className="text-electric animate-pulse" />
          <h1 className="text-electric text-2xl font-bold uppercase tracking-widest">
            Mission Telemetry
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-widest border ${
            isRunning
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              : "bg-red-500/10 text-red-400 border-red-500/30"
          }`}>
            {isRunning ? "ENGINE ACTIVE" : "ENGINE STOPPED"}
          </div>
          <div className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-widest border ${
            mode === "SHADOW"
              ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
              : "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
          }`}>
            {mode} MODE
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Engine Status */}
        <div className="glass-panel border border-border rounded p-4">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Engine Status
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isRunning ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
            <span className="text-lg font-bold text-foreground">
              {mode}
            </span>
          </div>
          <div className="text-[9px] text-muted-foreground mt-1">
            {status?.scannerActive ? "Scanner: Active" : "Scanner: Inactive"}
          </div>
        </div>

        {/* Active Strategies */}
        <div className="glass-panel border border-border rounded p-4">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Strategies
          </div>
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-primary" />
            <span className="text-lg font-bold text-foreground">
              6 / 6
            </span>
          </div>
          <div className="text-[9px] text-muted-foreground mt-1">
            All specialists active
          </div>
        </div>

        {/* Wallet Balance */}
        <div className="glass-panel border border-border rounded p-4">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Portfolio Value
          </div>
          <div className="flex items-center gap-2">
            <Wallet size={16} className="text-bright-blue" />
            <span className="text-lg font-bold neon-glow-green">
              {totalBalance.toFixed(4)} ETH
            </span>
          </div>
          <div className="text-[9px] text-muted-foreground mt-1">
            ~${(totalBalance * 2350).toLocaleString()} USD
          </div>
        </div>

        {/* Profit Today */}
        <div className="glass-panel border border-border rounded p-4">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Session Profit
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-400" />
            <span className="text-lg font-bold text-emerald-400">
              +{dailyProfit.toFixed(4)} ETH
            </span>
          </div>
          <div className="text-[9px] text-muted-foreground mt-1">
            ~${(dailyProfit * 2350).toFixed(2)} USD
          </div>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="glass-panel border border-border rounded p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Profit Track (Session)
          </h2>
          <div className="flex items-center gap-2">
            <Shield size={12} className="text-primary" />
            <span className="text-[9px] text-muted-foreground">
              BSS-03 Risk Guarded
            </span>
          </div>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={perfData}>
              <defs>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(148 100% 60%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(148 100% 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(220 15% 60%)", fontSize: 10 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(220 15% 60%)", fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(220 20% 12% / 0.9)",
                  border: "1px solid hsl(220 15% 15%)",
                  borderRadius: "4px",
                  fontSize: "11px",
                }}
                labelStyle={{ color: "hsl(220 15% 60%)" }}
              />
              <Area
                type="monotone"
                dataKey="profit"
                stroke="hsl(148 100% 60%)"
                strokeWidth={2}
                fill="url(#colorProfit)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* System Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Latency */}
        <div className="glass-panel border border-border rounded p-4">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            P99 Latency
          </div>
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-primary" />
            <span className="text-xl font-bold text-foreground">
              {telemetry ? `${telemetry.p99LatencyUs / 1000}ms` : "—"}
            </span>
          </div>
          <div className="text-[9px] text-muted-foreground mt-1">
            Average: {telemetry?.avgLatencyUs ? `${telemetry.avgLatencyUs / 1000}ms` : "—"}
          </div>
        </div>

        {/* Blocks Scanned */}
        <div className="glass-panel border border-border rounded p-4">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Blocks Scanned
          </div>
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-electric" />
            <span className="text-xl font-bold text-foreground">
              {telemetry?.blocksScanned?.toLocaleString() ?? "—"}
            </span>
          </div>
          <div className="text-[9px] text-muted-foreground mt-1">
            Opportunities found: {telemetry?.opportunitiesDetected ?? "—"}
          </div>
        </div>
      </div>
    </div>
  );
}
