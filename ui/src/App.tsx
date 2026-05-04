import React from 'react';
import { Route, Switch, useLocation } from 'wouter';
import { ThemeProvider } from 'next-themes';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Telemetry from './components/Telemetry';
import LiveEvents from './components/LiveEvents';
import Stream from './components/Stream';           // System Logs
import WalletPage from './components/WalletPage';
import Copilot from './components/Copilot';
import AiOptimizer from './components/AiOptimizer';
import SystemSettings from './components/SystemSettings';
import SetupWizard from './components/SetupWizard';
import Trades from './components/Trades';
import StrategiesPage from './components/StrategiesPage';
import NotFound from './components/NotFound';

/**
 * Allbright Elite Dashboard - Unified Architecture
 * 
 * Per DASHBOARD-GUIDE.MD:
 * - Single unified Layout component
 * - Consistent ash.black theme
 * - No duplicate components
 * - 39-KPI telemetry matrix
 */
const App: React.FC = () => {
  const [location] = useLocation();

  return (
    <ThemeProvider
      attribute="class" 
      defaultTheme="dark" 
      themes={["light", "dark", "black"]}
      enableSystem={false}
    >
      <Layout>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/telemetry" component={Telemetry} />
          <Route path="/events" component={LiveEvents} />
          <Route path="/logs" component={Stream} />
          <Route path="/wallet" component={WalletPage} />
          <Route path="/copilot" component={Copilot} />
          <Route path="/optimizer" component={AiOptimizer} />
          <Route path="/strategies" component={StrategiesPage} />
          <Route path="/trades" component={Trades} />
          <Route path="/settings" component={SystemSettings} />
          <Route path="/setup" component={SetupWizard} />
          <Route component={NotFound} />
        </Switch>
      </Layout>
    </ThemeProvider>
  );
};

export default App;
