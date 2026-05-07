import { isTauri } from '@tauri-apps/api/core';
import * as tauriEvent from '@tauri-apps/api/event';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import * as tauriLogger from '@tauri-apps/plugin-log';
import { JSX, lazy, Suspense, useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import { 
  Bolt, 
  LayoutDashboard, 
  ShieldCheck, 
  Radio, 
  Terminal, 
  BarChart3, 
  Wallet, 
  BrainCircuit, 
  Sliders, 
  Wrench,
  TrendingUp,
  Shield
} from 'lucide-react';

import DashboardView from './views/DashboardView';
import TelemetryView from './views/TelemetryView';
import EventsView from './views/EventsView';
import LogsView from './views/LogsView';
import TradesView from './views/TradesView';
import WalletsView from './views/WalletsView';
import CopilotView from './views/CopilotView';
import OptimizerView from './views/OptimizerView';
import StrategiesView from './views/StrategiesView';
import SettingsView from './views/SettingsView';
import SetupWizardView from './views/SetupWizardView';

import FallbackAppRender from './views/FallbackErrorBoundary';
import FallbackSuspense from './views/FallbackSuspense';

interface View {
	component: (() => JSX.Element) | any,
	path: string,
	name: string,
  icon: any
}

export default function App() {
  const location = useLocation();
  const [currency, setCurrency] = useState<'ETH' | 'USD'>('ETH');

  const views: View[] = [
    { component: DashboardView, path: '/dashboard', name: 'Mission Control', icon: LayoutDashboard },
    { component: TelemetryView, path: '/telemetry', name: 'Telemetry', icon: ShieldCheck },
    { component: EventsView, path: '/events', name: 'Live Events', icon: Radio },
    { component: LogsView, path: '/logs', name: 'System Logs', icon: Terminal },
    { component: TradesView, path: '/trades', name: 'Trade History', icon: BarChart3 },
    { component: WalletsView, path: '/vault', name: 'Vault', icon: Wallet },
    { component: CopilotView, path: '/copilot', name: 'Alpha-Copilot', icon: BrainCircuit },
    { component: OptimizerView, path: '/optimizer', name: 'AI Optimizer', icon: Bolt },
    { component: StrategiesView, path: '/strategies', name: 'Strategies', icon: Shield },
    { component: SettingsView, path: '/settings', name: 'Settings', icon: Sliders },
    { component: SetupWizardView, path: '/setup', name: 'Setup Wizard', icon: Wrench }
  ];

  useEffect(() => {
    if (isTauri()) {
      const appWindow = getCurrentWebviewWindow();
      appWindow.show().catch(tauriLogger.error);
    }
  }, []);

  return (
    <div className="flex min-h-screen bg-ash text-text-primary">
      {/* SIDEBAR */}
      <aside className="w-64 flex flex-col sidebar-ash fixed h-full z-30 overflow-y-auto">
        <div className="px-6 py-6 border-b border-ash flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center">
            <Bolt size={16} className="text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tighter uppercase text-white">BRIGHT<span className="text-cyan-500">SKY</span></span>
            <div className="text-[8px] text-secondary uppercase tracking-widest">Elite Protocol</div>
          </div>
        </div>

        <div className="mx-4 mt-6 mb-4 px-4 py-3 rounded-lg bg-ash border border-ash flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">LIVE</span>
          </div>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded uppercase bg-emerald-500/10 text-emerald-400">Live Listening</span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          <div className="text-[10px] font-bold text-secondary mb-3 ml-2 tracking-widest uppercase">Mission Segments</div>
          {views.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-medium uppercase tracking-widest transition-all ${
                  isActive 
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                    : 'text-secondary hover:text-white hover:bg-[#353542]'
                }`
              }
            >
              <item.icon size={16} />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="px-6 py-4 border-t border-ash bg-black/10">
          <div className="text-[10px] font-bold tracking-widest uppercase text-emerald-400">LIVE MODE</div>
          <div className="text-[9px] text-secondary font-medium mt-1">allbright v2.6.0</div>
          <div className="mt-2 pt-2 border-t border-ash text-[8px] text-secondary uppercase font-bold">allbright DeFi Software Ltd. © 2026</div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen relative">
        {/* Header */}
        <header className="h-28 flex items-center gap-10 px-10 topbar-ash sticky top-0 z-20" data-tauri-drag-region>
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[9px] text-secondary uppercase tracking-[0.2em] font-bold">Network Bridge</span>
              <span className="text-[11px] text-secondary font-medium uppercase">IPC ACTIVE • 4001</span>
              <span className="text-[7px] text-zinc-600 font-black uppercase tracking-tighter mt-0.5">Elite Protocol Operations</span>
            </div>
          </div>
          
          <div className="flex-1 flex justify-center items-center gap-8">
            <div className="flex bg-ash border border-ash rounded-lg p-0.5">
              <button 
                onClick={() => setCurrency('ETH')} 
                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${currency === 'ETH' ? 'bg-black text-cyan-400 shadow-sm' : 'text-secondary'}`}
              >
                ETH
              </button>
              <button 
                onClick={() => setCurrency('USD')} 
                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${currency === 'USD' ? 'bg-black text-emerald-400 shadow-sm' : 'text-secondary'}`}
              >
                USD
              </button>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center">
                <span className="text-[8px] text-secondary uppercase font-black">24H Net</span>
                <span className="text-xs font-mono font-medium text-emerald-500">
                  {currency === 'ETH' ? '14.770 ETH' : `$${(14.77 * 2450).toLocaleString()}`}
                </span>
              </div>
              <div className="h-6 w-px bg-ash"></div>
              <div className="flex flex-col items-center">
                <span className="text-[8px] text-secondary uppercase font-black">Bribe Efficiency</span>
                <span className="text-xs font-mono font-medium text-cyan-500">96.5%</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              </div>
              <span className="text-[10px] font-bold text-secondary uppercase">Live Nodes: 4</span>
            </div>
            <div className="px-3 py-1 rounded bg-black border border-ash text-[10px] font-mono text-secondary">0x742...f44e</div>
          </div>
        </header>

        <main className="flex-1 overflow-hidden relative">
          <SimpleBar className="h-[calc(100vh-7rem)] px-6 py-6">
            <ErrorBoundary FallbackComponent={FallbackAppRender} onError={(e: Error) => tauriLogger.error(e.message)}>
              <Suspense fallback={<FallbackSuspense />}>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  {views.map((view) => (
                    <Route key={view.path} path={view.path} element={<view.component />} />
                  ))}
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </SimpleBar>
        </main>
      </div>
    </div>
  );
}

