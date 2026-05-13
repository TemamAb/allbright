import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Activity, Radio, Wallet, BarChart2, Brain, Menu, X, ShieldCheck, Zap, Lock, Terminal, Settings, Wand, Sun, Moon } from "lucide-react";
import { useGetEngineStatus } from "@/lib/api";
import ToastContainer from "./ToastContainer";
import WalletModal from "./WalletModal";
import { useToast } from "@/hooks/useToast";
import { useTheme } from "next-themes";
import { useOffline } from "@/hooks/useOffline";

const navItems = [
  { path: "/", label: "Mission Control", icon: Activity },
  { path: "/telemetry", label: "KPI Matrix", icon: ShieldCheck },
  { path: "/copilot", label: "Intelligence Hub", icon: Brain },
  { path: "/trades", label: "Operations Ledger", icon: Terminal },
  { path: "/vault", label: "Wallet Management", icon: Wallet },
  { path: "/settings", label: "System Config", icon: Settings },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const { data: status } = useGetEngineStatus();
  const isRunning = status?.running;
  const mode = status?.mode ?? "STOPPED";
  const totalBalance = status?.totalWalletBalance ?? 0;
  const isGhostMode = status?.ghostMode;
  const { addToast } = useToast();
  const { theme, setTheme } = useTheme();
  const { isOnline, connectionQuality } = useOffline();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
    addToast(`Switched to ${theme === 'dark' ? 'light' : 'dark'} mode`, 'info');
  };

  const handleWalletConnect = (provider: string, account: any) => {
    addToast(`Connected to ${provider} wallet: ${account.address.slice(0, 6)}...${account.address.slice(-4)}`, 'success');
    // Here you would typically update global state with the connected wallet
  };

  return (
    <div className="min-h-screen flex bg-ash-black text-ash-text font-sans">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-ash-black border-r border-ash-border transition-transform duration-300 lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-3 px-6 py-6 border-b border-ash-border">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-accent to-cyan-700 flex items-center justify-center">
            <Zap className="text-white" size={20} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tighter uppercase text-white">
              {isGhostMode ? "ELITE PROTOCOL" : <>BRIGHT<span className="text-cyan-accent">SKY</span></>}
            </span>
            <div className="text-[8px] text-ash-muted uppercase tracking-widest">
              {isGhostMode ? "Operational Command" : "Elite Trading Protocol"}
            </div>
          </div>
        </div>

        {/* Engine Status Badge */}
        <div className="mx-4 mt-6 mb-4 px-4 py-3 rounded-lg bg-ash-dark/40 border border-ash-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isRunning ? "bg-emerald-accent" : "bg-ash-muted"}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-ash-muted">{mode}</span>
          </div>
          {isRunning ? (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded uppercase bg-emerald-accent/10 text-emerald-accent">LIVE</span>
          ) : (
            <span className="flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded uppercase text-red-500 bg-red-500/10">
              <Lock size={10} /> Lockdown
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          <div className="text-[10px] font-bold text-ash-muted mb-4 ml-2 tracking-widest uppercase">Mission Segments</div>
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location === path;
            return (
              <Link
                key={path}
                href={path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-medium uppercase tracking-widest transition-colors ${
                  active
                    ? "bg-cyan-accent/10 text-cyan-accent border border-cyan-accent/20"
                    : "text-ash-muted hover:text-ash-text hover:bg-ash-dark/50"
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-6 py-4 border-t border-ash-border bg-black/20">
          <div className="text-[10px] font-bold tracking-widest uppercase">{mode} MODE ACTIVE</div>
          <div className="text-[9px] text-ash-muted font-medium uppercase">allbright v2.6.0</div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} />}

{/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <header className="h-28 flex items-center gap-6 px-10 border-b border-ash-border sticky top-0 z-40 bg-ash-black/95 backdrop-blur-sm">
          <button className="lg:hidden text-ash-text" onClick={() => setMobileOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[9px] text-ash-muted uppercase tracking-[0.2em] font-bold">Network Bridge</span>
              <span className="text-[11px] text-ash-text/70 font-medium uppercase">
                {window.location.hostname === 'localhost' ? 'LOCAL_SIM • 4001' : 'CLOUD_SIM • RENDER'}
              </span>
              <span className="text-[7px] text-zinc-600 font-black uppercase tracking-tighter mt-0.5">
                {mode === 'LIVE_PRODUCTION' ? 'PRODUCTION: RENDER SIGNING KEYS ENGAGED' : 'SIMULATION: SIGNING CREDENTIALS INHIBITED'}
              </span>
            </div>
          </div>
          
          <div className="flex-1 flex justify-center items-center gap-8">
            <div className="flex bg-ash-dark rounded-lg p-0.5">
              <button className="px-3 py-1 rounded-md text-[10px] font-bold bg-black text-cyan-accent shadow-sm">ETH</button>
              <button className="px-3 py-1 rounded-md text-[10px] font-bold text-ash-muted">USD</button>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center">
                <span className="text-[8px] text-ash-muted uppercase font-black">Aggregated Liquidity</span>
                <span className="text-xs font-mono font-medium text-emerald-accent">{totalBalance.toFixed(3)} ETH</span>
              </div>
              <div className="h-6 w-px bg-ash-border" />
              <div className="flex flex-col items-center">
                <span className="text-[8px] text-ash-muted uppercase font-black">Bribe Efficiency</span>
                <span className="text-xs font-mono font-medium text-cyan-accent">96.5%</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group flex items-center gap-4 cursor-help">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-accent' : 'bg-red-500'} animate-pulse`} />
                  <div className={`absolute inset-0 w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-accent/50' : 'bg-red-500/50'} animate-ping`} />
                </div>
                <span className="text-[10px] font-bold text-ash-muted uppercase tracking-widest">Live Nodes: 4</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  connectionQuality === 'good' ? 'bg-emerald-accent' :
                  connectionQuality === 'poor' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`} />
                <span className="text-[10px] font-bold text-ash-muted uppercase tracking-widest">
                  {connectionQuality === 'good' ? 'Online' :
                   connectionQuality === 'poor' ? 'Slow' :
                   'Offline'}
                </span>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="px-2 py-1 rounded bg-ash-dark border border-ash-border text-[10px] font-bold text-cyan-accent hover:bg-ash-dark/80 transition-colors"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
            </button>
            <button
              onClick={() => setWalletModalOpen(true)}
              className="ml-2 px-2 py-1 rounded bg-ash-dark border border-ash-border text-[10px] font-bold text-cyan-accent hover:bg-ash-dark/80 transition-colors"
            >
              <Zap size={12} />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
      <ToastContainer />
      <WalletModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        onConnect={handleWalletConnect}
      />
    </div>
  );
}