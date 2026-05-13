import React from 'react';
import { Switch, Route } from 'wouter';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Telemetry from './components/Telemetry';
import Stream from './components/Stream';
import Trades from './components/Trades';
import VaultWithdrawalView from './components/VaultWithdrawalView';
import Copilot from './components/Copilot';
import AiOptimizer from './components/AiOptimizer';
import SystemSettings from './components/SystemSettings';
import SetupWizard from './components/SetupWizard';
import NotFound from './components/NotFound';

/**
 * Allbright Primary Router
 * Enforces a consistent commercial layout for all institutional mission segments.
 */
export default function App() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/telemetry" component={Telemetry} />
        <Route path="/trades" component={Trades} />
        <Route path="/vault" component={VaultWithdrawalView} />
        <Route path="/copilot" component={Copilot} />
        <Route path="/settings" component={SystemSettings} />
        
        {/* Default 404 handler */}
        <Route>
          <NotFound />
        </Route>
      </Switch>
    </Layout>
  );
}
// SPA fallback safeguard
<Route path="*" element={<Dashboard />} />
