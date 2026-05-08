import { Link, useLocation } from "wouter";
import {
  Gauge, ShieldCheck, Radio, Terminal, BarChart3, Wallet, Brain, Zap, Sliders, Wrench
} from "lucide-react";

const navItems = [
  { path: '/', label: 'Mission Control', icon: <Gauge size={16} /> },
  { path: '/telemetry', label: 'Telemetry', icon: <ShieldCheck size={16} /> },
  { path: '/events', label: 'Live Events', icon: <Radio size={16} /> },
  { path: '/logs', label: 'System Logs', icon: <Terminal size={16} /> },
  { path: '/trades', label: 'Trade History', icon: <BarChart3 size={16} /> },
  { path: '/vault', label: 'Vault', icon: <Wallet size={16} /> },
  { path: '/copilot', label: 'Alpha-Copilot', icon: <Brain size={16} /> },
  { path: '/optimizer', label: 'AI Optimizer', icon: <Zap size={16} /> },
  { path: '/strategies', label: 'Strategies', icon: <ShieldCheck size={16} /> },
  { path: '/settings', label: 'Settings', icon: <Sliders size={16} /> },
  { path: '/setup', label: 'Setup Wizard', icon: <Wrench size={16} /> },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-[#111217] border-r border-[#27272a] flex flex-col fixed left-0 top-0 bottom-0 z-30">
      <div className="px-6 py-6 border-b border-[#27272a] flex items-center gap-3">
        <img src="/allbright_logo.svg" alt="Allbright Logo" className="w-8 h-8 object-contain" />
        <div className="flex flex-col">
          <span className="font-bold text-lg tracking-tighter uppercase text-white">BRIGHT<span className="text-cyan-500">SKY</span></span>
          <div className="text-[8px] text-[#b4b4c2] uppercase tracking-widest font-bold">Elite Protocol</div>
        </div>
      </div>

      <div className="mx-4 mt-6 mb-4 px-4 py-3 rounded-lg bg-[#111217] border border-[#27272a] flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#b4b4c2]">LIVE</span>
        </div>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded uppercase bg-emerald-500/10 text-emerald-400">Listening</span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-bold text-[#b4b4c2] mb-3 ml-2 tracking-widest uppercase">Mission Segments</div>
        <ul className="space-y-2">
          {navItems.map(item => {
            const isActive = location === item.path;
            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      : 'text-[#b4b4c2] hover:text-white hover:bg-[#1a1c20]'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-6 py-4 border-t border-[#27272a] bg-black/10">
        <div className="text-[10px] font-bold tracking-widest uppercase text-emerald-400">LIVE MODE</div>
        <div className="text-[9px] text-[#b4b4c2] font-medium mt-1">allbright v0.2.6</div>
        <div className="mt-2 pt-2 border-t border-[#27272a] text-[8px] text-[#b4b4c2] uppercase font-bold">
          DeFi Software Ltd. © 2026
        </div>
      </div>
    </aside>
  );
}
