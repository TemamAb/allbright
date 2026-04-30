import { Link, useLocation } from "wouter";
import {
  BarChart, Globe, Wallet, Bot, Settings, Zap
} from "lucide-react";

const navItems = [
  { path: '/', label: 'Dashboard', icon: <BarChart size={18} /> },
  { path: '/strategies', label: 'Strategies', icon: <Zap size={18} /> },
  { path: '/stream', label: 'Stream', icon: <Globe size={18} /> },
  { path: '/trades', label: 'Trades', icon: <BarChart size={18} /> },
  { path: '/vault', label: 'Vault', icon: <Wallet size={18} /> },
  { path: '/settings', label: 'Settings', icon: <Settings size={18} /> },
  { path: '/copilot', label: 'Copilot', icon: <Bot size={18} /> },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-[#0a0a0b] border-r border-zinc-800 flex flex-col fixed left-0 top-16 bottom-0">
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {navItems.map(item => {
            const isActive = location === item.path;
            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary border-l-2 border-primary'
                      : 'text-muted-foreground hover:bg-zinc-900 hover:text-foreground'
                  }`}
                >
                  {item.icon}
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-4 border-t border-zinc-800">
        <div className="text-xs text-muted-foreground">
          BrightSky v1.0.0
        </div>
      </div>
    </aside>
  );
}
