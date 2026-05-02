import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import {
  Activity, Radio, Wallet, Settings, BarChart2, Zap, Menu, X, ShieldCheck, Brain, Globe, ChevronDown, Coins, DollarSign
} from "lucide-react";
import { useGetEngineStatus } from "@/lib/api";
import { useTheme } from "next-themes";

const navItems = [
  { path: "/", label: "Mission Control", icon: Activity },
  { path: "/stream", label: "Stream", icon: Radio },
  { path: "/trades", label: "Trade History", icon: BarChart2 },
  { path: "/vault", label: "Vault", icon: Wallet },
  { path: "/copilot", label: "Alpha-Copilot", icon: Brain },
]; // Removed Audit Report and Settings

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currency, setCurrency] = useState<'ETH' | 'USD'>('ETH');
  const [ethPrice, setEthPrice] = useState(2450.00); // Mocked Oracle Price
  const { theme } = useTheme();
  const { data: status } = useGetEngineStatus();

  // Mock Node List - In production this comes from rpc_orchestrator stats
  const activeNodes = ["LlamaNodes (Base)", "PublicNode (Base)", "Flashbots (Eth)"];

  const isRunning = status?.running;
  const mode = status?.mode ?? "STOPPED";
  const isShadowMode = mode === "SHADOW";

  return (
    <div className="min-h-screen flex font-sans selection:bg-cyan-500/20 relative overflow-hidden bg-[#1a1c20] text-zinc-300">
      {/* Pure Grafana Dark Shell */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-[#111217] border-r border-zinc-800/50
        transition-transform duration-300 ease-in-out shadow-2xl shadow-black/50
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:inset-auto
        hover:border-zinc-700/50
      `}>
        <div className="flex items-center gap-3 px-6 py-6 border-b border-zinc-800/50 relative">
          <div className={`w-8 h-8 rounded bg-gradient-to-br flex items-center justify-center ${
            theme === 'light' ? 'from-cyan-400 to-cyan-600' :
            theme === 'colorblind' ? 'from-red-400 to-red-600' :
            'from-cyan-500 to-cyan-700'
          }`}>
            <Zap className="text-white" size={20} />
          </div>
          <div className="flex flex-col">
            <span className={`font-bold text-lg tracking-tighter uppercase ${
              theme === 'light' ? 'text-slate-900' :
              theme === 'colorblind' ? 'text-black' :
              'text-white'
            }`}>
              BRIGHT
              <span className={`${
                theme === 'light' ? 'text-cyan-600' :
                theme === 'colorblind' ? 'text-red-600' :
                'text-cyan-500'
              }`}>SKY</span>
            </span>
            <div className="text-[8px] text-muted-foreground uppercase tracking-widest">
              Elite Trading Protocol
            </div>
          </div>
        </div>

        {/* Engine status badge */}
        <div className="mx-4 mt-6 mb-4 px-4 py-3 rounded-lg bg-black/40 border border-zinc-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isRunning ? "bg-cyan-500" : "bg-zinc-600"}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{mode}</span>
          </div>
          {isRunning && (
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter ${
              isShadowMode ? "text-amber-400 bg-amber-500/10" : "text-emerald-400 bg-emerald-500/10"
            }`}>
              {isShadowMode ? "Shadow Simulation" : "Live Listening"}
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
                  flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-medium uppercase tracking-widest transition-colors group hover:shadow-md
                  ${active
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-md"
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
              BrightSky v2.6.0
            </div>
            <div className="mt-2 pt-2 border-t border-zinc-800/30">
              <div className="text-[7px] text-zinc-500 uppercase tracking-widest font-black">Branding & Credits</div>
              <div className="text-[8px] text-zinc-600 font-bold uppercase mt-0.5">BrightSky DeFi Software Developer Ltd.</div>
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
        {/* Top Bar */}
        <header className="h-14 flex items-center gap-6 px-8 border-b border-zinc-800/50 sticky top-0 z-40 bg-[#1a1c20]/95 backdrop-blur-sm">
          <div className="flex flex-col">
            <span className="text-[9px] text-zinc-500 uppercase tracking-[0.2em] font-bold">Network Bridge</span>
            <span className="text-[11px] text-zinc-400 font-medium">IPC ACTIVE • 4001</span>
          </div>
          
          <div className="flex-1 flex justify-center items-center gap-8">
             {/* Currency Toggle */}
             <div className="flex items-center bg-black/40 border border-zinc-800 rounded-lg p-0.5">
               <button 
                onClick={() => setCurrency('ETH')}
                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${currency === 'ETH' ? 'bg-zinc-800 text-cyan-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
               >
                 ETH
               </button>
               <button 
                onClick={() => setCurrency('USD')}
                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${currency === 'USD' ? 'bg-zinc-800 text-emerald-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
               >
                 USD
               </button>
             </div>

             {/* Global Numeric Metrics - Clean, tabular format */}
             <div className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                   <span className="text-[8px] text-zinc-600 uppercase font-black">24H Net</span>
                   <span className="text-xs font-mono font-medium text-emerald-500 tabular-nums">
                     {currency === 'ETH' ? '14.770 ETH' : `$${(14.77 * ethPrice).toFixed(2)}`}
                   </span>
                </div>
                <div className="h-6 w-px bg-zinc-800" />
                <div className="flex flex-col items-center">
                   <span className="text-[8px] text-zinc-600 uppercase font-black">Bribe Efficiency</span>
                   <span className="text-xs font-mono font-medium text-cyan-500 tabular-nums">96.5%</span>
                </div>
             </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Node Status - Blinking light with hover */}
            <div className="relative group flex items-center gap-2 cursor-help">
              <div className="relative">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-emerald-500/50 animate-ping" />
              </div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Live Nodes</span>
              
              {/* Hover Dropdown */}
              <div className="absolute top-full right-0 mt-2 w-48 bg-[#111217] border border-zinc-800 rounded-lg shadow-2xl p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                <div className="text-[9px] font-black text-zinc-500 uppercase mb-2 border-b border-zinc-800 pb-1">Connected Providers</div>
                <div className="space-y-1.5">
                  {activeNodes.map(node => (
                    <div key={node} className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-emerald-500" />
                      <span className="text-[10px] text-zinc-400 font-mono">{node}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-3 py-1 rounded bg-black/40 border border-zinc-800 flex items-center gap-2">
              <span className="text-[10px] font-mono text-zinc-400">0x742...f44e</span>
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Page content */}
          <main className="flex-1 overflow-auto p-6 scrollbar-hide">
            {children}
          </main>

          {/* Professional Trade Sidebar */}
          <aside className="w-64 border-l border-zinc-800/50 bg-[#111217]/50 hidden xl:flex flex-col p-6 space-y-8">
            <div className="space-y-1">
              <h3 className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">Strategy Performance</h3>
              <div className="pt-4 space-y-6">
                <MetricRow label="Profit / Trade" value="0.042 ETH" trend="+2.1%" color="text-emerald-500" />
                <MetricRow label="Trades / Hour" value="124" trend="Optimal" color="text-cyan-500" />
                <MetricRow label="24H Velocity" value="23.1 ETH" trend="+14%" color="text-emerald-500" />
              </div>
            </div>
            
            <div className="pt-6 border-t border-zinc-800/50">
              <h3 className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">Safety Gates</h3>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center px-3 py-2 rounded bg-emerald-500/5 border border-emerald-500/10">
                  <span className="text-[10px] font-bold text-emerald-500/80">MEV-SHIELD</span>
                  <ShieldCheck size={12} className="text-emerald-500" />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function MetricRow({ label, value, trend, color }: { label: string, value: string, trend: string, color: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-zinc-500 font-medium">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className={`text-lg font-mono font-medium ${color} tabular-nums`}>{value}</span>
        <span className="text-[9px] text-zinc-600 font-bold font-mono tabular-nums">{trend}</span>
      </div>
    </div>
  );
}
