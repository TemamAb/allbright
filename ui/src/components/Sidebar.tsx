// ui/src/components/Sidebar.tsx
/**
 * @deprecated DEPRECATED - Use Layout.tsx as the single source of truth for navigation
 * Per DASHBOARD_REBUILD_PROPOSAL.md: Sidebar.tsx is deprecated in favor of Layout.tsx
 * which provides unified "Mission Control" navigation.
 */
import React from 'react';
import { Link } from 'wouter'; // Assuming wouter for routing
import { LayoutDashboard, Activity, Wallet, Brain, Settings, Wand2, ShieldCheck } from 'lucide-react';
import AllbrightLogo from '../assets/allbright_logo.svg'; // Import the SVG logo

interface SidebarProps {
  activePath: string;
}

const sidebarItems = [
  { name: 'Mission Control', path: '/', icon: LayoutDashboard },
  { name: 'System Telemetry', path: '/telemetry', icon: ShieldCheck }, // Elite 39-KPI Audit Matrix
  { name: 'Live Blockchain Events', path: '/events', icon: Activity },
  { name: 'Wallet Management', path: '/wallet', icon: Wallet },
  { name: 'AI Auto-Optimizer', path: '/ai-optimizer', icon: Brain },
  { name: 'System Settings', path: '/settings', icon: Settings },
  { name: 'Setup Wizard', path: '/setup', icon: Wand2 },
];

const Sidebar: React.FC<SidebarProps> = ({ activePath }) => {
  return (
    <aside className="w-64 bg-muted text-foreground flex flex-col h-full border-r border-border">
      <div className="p-4 flex items-center justify-center border-b border-border">
        <img src={AllbrightLogo} alt="Allbright Logo" className="h-8 w-8 mr-2" />
        <h1 className="text-xl font-bold text-success">Allbright</h1>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePath === item.path;
          return (
            <Link key={item.name} href={item.path}>
              <a
                className={`flex items-center p-3 rounded-lg transition-colors duration-200 
                  ${isActive ? 'bg-success/20 text-success' : 'hover:bg-card text-muted-foreground hover:text-foreground'}`}
              >
                <Icon className="h-5 w-5 mr-3" />
                <span className="font-medium">{item.name}</span>
              </a>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 text-xs text-muted-foreground border-t border-border">
        <p>&copy; 2024 Allbright Systems</p>
        <p>Elite Grade Authorized</p>
      </div>
    </aside>
  );
};

export default Sidebar;