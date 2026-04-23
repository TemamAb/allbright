import { Link, useLocation } from "wouter";
import { useState } from "react";
import {
  Activity, Radio, Wallet, Settings, BarChart2, Zap, Menu, X, ShieldCheck
} from "lucide-react";
import { useGetEngineStatus } from "@workspace/api-client-react";

const navItems = [
  { path: "/", label: "Telemetry", icon: Activity },
  { path: "/stream", label: "Stream", icon: Radio },
  { path: "/trades", label: "Trade History", icon: BarChart2 },
  { path: "/vault", label: "Vault", icon: Wallet },
  { path: "/audit", label: "Audit Report", icon: ShieldCheck },
  { path: "/settings", label: "Settings", icon: Settings },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: status } = useGetEngineStatus({ query: { refetchInterval: 2000 } });

  const isRunning = status?.running;
  const mode = status?.mode ?? "STOPPED";

  return (
    <div className="min-h-screen flex bg-[#0A0A0B] text-zinc-300 font-mono selection:bg-cyan-500/30">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-[#0D0D0E]/80 backdrop-blur-xl border-r border-zinc-800/50
        transition-transform duration-200
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:inset-auto
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-zinc-800/50">
          <div className="w-8 h-8 rounded bg-cyan-600 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)]">
            <Zap className="text-white" size={20} />
          </div>
          <span className="font-bold text-lg tracking-tighter text-white uppercase">BRIGHT<span className="text-cyan-500">SKY</span></span>
        </div>

        {/* Engine status badge */}
        <div className="mx-4 mt-6 mb-4 px-4 py-3 rounded-lg bg-black/40 border border-zinc-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isRunning ? "bg-cyan-500 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" : "bg-zinc-600"}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{mode}</span>
          </div>
          {isRunning && (
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter transition-colors duration-300 ${
              status?.shadowModeActive ? "text-amber-400 bg-amber-500/10" : "text-emerald-400 bg-emerald-500/10 shadow-[0_0_8px_rgba(52,211,153,0.15)]"
            }`}>
              {status?.shadowModeActive ? "Shadow Simulation" : "Live Listening"}
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-4 space-y-2">
          <div className="text-[10px] font-bold text-zinc-600 mb-4 ml-2 tracking-widest uppercase">Mission Segments</div>
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location === path;
            return (
              <Link
                key={path}
                href={path}
                data-testid={`nav-${label.toLowerCase().replace(/\s/g, "-")}`}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-medium uppercase tracking-widest transition-all group
                  ${active
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                    : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50"
                  }
                `}
              >
                <Icon size={16} className={active ? "text-cyan-400" : "group-hover:text-zinc-200"} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800/50 bg-black/20">
          <div className="flex flex-col gap-1">
            <div className={`text-[10px] font-bold tracking-widest uppercase ${mode === "LIVE" ? "text-cyan-400" : "text-zinc-500"}`}>
              {mode} MODE ACTIVE
            </div>
            <div className="text-[9px] text-zinc-600 font-medium uppercase">
              BSS-Nexus v2.6.0
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 flex items-center gap-3 px-8 border-b border-zinc-800/50 bg-[#0D0D0E]/50 backdrop-blur-md sticky top-0 z-40">
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Bridge Status</span>
            <span className="text-xs text-zinc-300">NEXUS IPC <span className="text-zinc-700">•</span> PORT 4001</span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
             <div className="px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
              <span className="text-[10px] font-bold text-zinc-400 tracking-tight">0x742d...f44e</span>
            </div>
            <button className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              ENGINE ACTIVE
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
