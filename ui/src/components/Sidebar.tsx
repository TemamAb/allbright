import React from 'react';
import { Link, useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  Activity, 
  Wallet, 
  Brain, 
  Settings, 
  Wand2, 
  ShieldCheck, 
  Terminal, 
  Zap, 
  Target,
  BarChart3,
  Cpu
} from 'lucide-react';

const sidebarItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Kpi-Matrix', path: '/telemetry', icon: ShieldCheck },
  { name: 'Live Events', path: '/events', icon: Activity },
  { name: 'Wallet', path: '/wallet', icon: Wallet },
  { name: 'Copilot', path: '/copilot', icon: Zap },
  { name: 'Optimizer', path: '/optimizer', icon: Brain },
  { name: 'Strategies', path: '/strategies', icon: Target },
  { name: 'Trades', path: '/trades', icon: BarChart3 },
  { name: 'Logs', path: '/logs', icon: Terminal },
  { name: 'Settings', path: '/settings', icon: Settings },
];

const Sidebar: React.FC = () => {
  const [location] = useLocation();

  return (
    <aside className="fixed left-0 top-0 w-64 h-full bg-ash-black border-r border-ash-border flex flex-col z-50">
      {/* Brand */}
      <div className="h-20 flex items-center px-8 border-b border-ash-border/50">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-accent to-emerald-accent flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.2)]">
          <Cpu className="text-black" size={18} />
        </div>
        <span className="ml-3 text-xl font-black text-white tracking-tighter uppercase italic">
          Allbright
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto custom-scrollbar">
        {sidebarItems.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;
          
          return (
            <Link key={item.path} href={item.path}>
              <a className={`
                flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group
                ${isActive 
                  ? 'bg-white/[0.05] text-cyan-accent shadow-[inset_0_0_10px_rgba(255,255,255,0.02)]' 
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.02]'
                }
              `}>
                <div className={`
                  transition-colors duration-300
                  ${isActive ? 'text-cyan-accent' : 'text-zinc-600 group-hover:text-zinc-400'}
                `}>
                  <Icon size={18} />
                </div>
                <span className={`text-xs font-black uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>
                  {item.name}
                </span>
                {isActive && (
                  <div className="ml-auto w-1 h-1 rounded-full bg-cyan-accent shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                )}
              </a>
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-6 border-t border-ash-border/50">
        <div className="bg-ash-dark rounded-2xl p-4 border border-ash-border/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-accent animate-pulse" />
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Protocol V0.8.2</span>
          </div>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Elite Grade Auth Active</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;