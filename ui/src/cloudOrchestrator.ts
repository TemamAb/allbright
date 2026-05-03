import { logger } from './logger';
import { sharedEngineState } from './engineState';

interface RenderEnvVar {
  key: string;
  value: string;
}

/**
 * BSS-56 Cloud Orchestrator
 * Interacts with Render API to synchronize environment variables 
 * and trigger deployments programmatically.
 */
export class CloudOrchestrator {
  private baseUrl = 'https://api.render.com/v1';

  /**
   * Synchronizes a map of environment variables to the Render Service.
   * This allows the setup wizard to auto-populate the cloud dashboard.
   */
  async syncEnvToRender(vars: Map<string, string>): Promise<{ success: boolean; error?: string }> {
    const apiKey = vars.get('RENDER_API_KEY') || process.env.RENDER_API_KEY;
    const serviceId = vars.get('RENDER_SERVICE_ID') || process.env.RENDER_SERVICE_ID;

    if (!apiKey || !serviceId) {
      logger.warn('[CloudOrchestrator] Missing RENDER_API_KEY or RENDER_SERVICE_ID. Skipping cloud sync.');
      return { success: false, error: 'Cloud identifiers missing' };
    }

    try {
      const envVars: RenderEnvVar[] = Array.from(vars.entries()).map(([key, value]) => ({
        key,
        value: String(value),
      }));

      logger.info({ serviceId }, '[CloudOrchestrator] Synchronizing environment to Render...');

      const response = await fetch(`${this.baseUrl}/services/${serviceId}/env-vars`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(envVars),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Render API Error: ${response.status} - ${errorText}`);
      }

      logger.info('[CloudOrchestrator] Cloud synchronization successful. Render will trigger a re-deploy.');
      sharedEngineState.lastCloudSync = new Date();
      
      return { success: true };
    } catch (err: any) {
      logger.error({ error: err.message }, '[CloudOrchestrator] Failed to sync to Render');
      return { success: false, error: err.message };
    }
  }

  /**
   * BSS-56: Deployment Monitor
   * Fetches the latest deploy status from Render to track rolling update progress.
   */
  async getDeploymentStatus(serviceId: string, apiKey?: string): Promise<{ percentage: number; status: string }> {
    const token = apiKey || process.env.RENDER_API_KEY;
    if (!token) return { percentage: 0, status: 'unauthorized' };

    try {
      const response = await fetch(`${this.baseUrl}/services/${serviceId}/deploys?limit=1`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Render API request failed');
      
      const deploys = await response.json();
      const latest = deploys[0];

      if (!latest) return { percentage: 0, status: 'idle' };

      const state = latest.deploy.status;
      // Map Render statuses to discrete progress steps for the UI
      const percentage = state === 'live' ? 100 : state === 'build_in_progress' ? 45 : state === 'pre_deploy_in_progress' ? 85 : 15;
      
      return { percentage, status: state };
    } catch (err) {
      return { percentage: 0, status: 'error' };
    }
  }

  /**
   * Used by Alpha-Copilot for autonomous tuning sync
   */
  async syncTuningToCloud(tuning: { bribeRatioBps: number; minMarginRatioBps: number }) {
    const vars = new Map<string, string>();
    vars.set('BRIBE_RATIO_BPS', tuning.bribeRatioBps.toString());
    vars.set('MIN_MARGIN_RATIO_BPS', tuning.minMarginRatioBps.toString());
    
    // Only sync if we have the credentials in the current process env
    if (process.env.RENDER_API_KEY && process.env.RENDER_SERVICE_ID) {
        return this.syncEnvToRender(vars);
    }
  }
}

export const cloudOrchestrator = new CloudOrchestrator();
