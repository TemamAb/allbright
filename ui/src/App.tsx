import React, { useEffect } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Telemetry from './components/Telemetry';
import LiveEvents from './components/LiveEvents';
import SystemLogs from './components/SystemLogs';           // System Logs
import WalletPage from './components/WalletPage';
import Copilot from './components/Copilot';
import AiOptimizer from './components/AiOptimizer';
import SystemSettings from './components/SystemSettings';
import SetupWizard from './components/SetupWizard';
import Trades from './components/Trades';
import StrategiesPage from './components/StrategiesPage';
import NotFound from './components/NotFound';
import ErrorBoundary from './components/ErrorBoundary';
import AdminAuditDashboard from './components/AdminAuditDashboard';

import DeploymentReadiness from './components/DeploymentReadiness';
import { Toaster } from "sonner";

import { EngineProvider } from './stores/engine';

/**
 * Allbright Elite Dashboard - Unified Architecture
 * 
 * Per DASHBOARD-GUIDE.MD:
 * - Single unified Layout component
 * - Consistent ash.black theme
 * - No duplicate components
 * - 39-KPI telemetry matrix
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

const App: React.FC = () => {
  const [location, navigate] = useLocation();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 't':
            event.preventDefault();
            navigate('/telemetry');
            break;
          case 'l':
            event.preventDefault();
            navigate('/logs');
            break;
        }
      } else if (event.key === 'Escape') {
        event.preventDefault();
        navigate('/');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <ThemeProvider
      attribute="class" 
      defaultTheme="dark" 
      themes={["light", "dark", "black"]}
      enableSystem={false}
    >
      <QueryClientProvider client={queryClient}>
        <EngineProvider>
        <Layout>
          <ErrorBoundary>
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/telemetry" component={Telemetry} />
              <Route path="/events" component={LiveEvents} />
              <Route path="/logs" component={SystemLogs} />
              <Route path="/wallet" component={WalletPage} />
              <Route path="/copilot" component={Copilot} />
              <Route path="/optimizer" component={AiOptimizer} />
              <Route path="/strategies" component={StrategiesPage} />
              <Route path="/trades" component={Trades} />
              <Route path="/readiness" component={DeploymentReadiness} />
              <Route path="/settings" component={SystemSettings} />
              <Route path="/setup" component={SetupWizard} />
              <Route path="/admin/audit" component={AdminAuditDashboard} />
              <Route component={NotFound} />
            </Switch>
          </ErrorBoundary>
        </Layout>
        </EngineProvider>
      </QueryClientProvider>
    <Toaster richColors position="top-right" theme="dark" />
  </ThemeProvider>
);
};

export default App;
