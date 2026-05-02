import { logger } from './logger';
import { sharedEngineState } from './engineState';
import { generateDeploymentReadinessReport } from './deploy_gatekeeper';

export type CloudProvider = 'render' | 'aws' | 'gcp' | 'digitalocean' | 'azure';

export interface CloudProviderInfo {
  id: CloudProvider;
  name: string;
  description: string;
  isSupported: boolean;
}

export class CloudOrchestrator {
  private baseUrl = 'https://api.render.com/v1';

  public readonly popularClouds: CloudProviderInfo[] = [
    { id: 'render', name: 'Render', description: 'Zero-config cloud for Node.js & Rust', isSupported: true },
    { id: 'aws', name: 'AWS', description: 'Enterprise grade scaling (Lambda/ECS)', isSupported: false },
    { id: 'gcp', name: 'Google Cloud', description: 'High performance compute engine', isSupported: false },
    { id: 'digitalocean', name: 'DigitalOcean', description: 'Developer friendly droplets', isSupported: false },
    { id: 'azure', name: 'Azure', description: 'Microsoft cloud ecosystem', isSupported: false },
  ];

  /**
   * Initiates the transition from Desktop to Render Cloud.
   * This is only possible if the local DRR (Deployment Readiness Report) returns 'READY'.
   */
  async deployCurrentStack(provider: CloudProvider = 'render') {
    logger.info(`[CLOUD-ORCHESTRATOR] Initiating Elite Cloud Deployment for provider: ${provider}`);

    // 1. Run final local readiness check
    const report = await generateDeploymentReadinessReport();
    
    if (report.overallStatus !== 'READY_FOR_DEPLOYMENT') {
      throw new Error(`Deployment Blocked: ${report.issues.join(', ')}`);
    }

    if (provider !== 'render') {
      throw new Error(`Provider '${provider}' integration is coming soon. Use 'render' for the current Elite release.`);
    }

    // 2. Prepare Render.yaml payload
    const envVars = [
      { key: 'RPC_ENDPOINT', value: sharedEngineState.rpcEndpoint },
      { key: 'PIMLICO_API_KEY', value: sharedEngineState.pimlicoApiKey || '' },
      { key: 'PRIVATE_KEY', value: process.env.PRIVATE_KEY },
      { key: 'BSS_ELITE_SCORE', value: sharedEngineState.totalWeightedScore.toString() },
      { key: 'ONBOARDING_COMPLETE', value: 'true' },
      { key: 'APP_NAME', value: sharedEngineState.appName },
      { key: 'LOGO_URL', value: sharedEngineState.logoUrl || '' },
      { key: 'GHOST_MODE', value: sharedEngineState.ghostMode.toString() },
      { key: 'INTEGRITY_THRESHOLD', value: sharedEngineState.integrityThreshold.toString() },
      { key: 'INTELLIGENCE_SOURCE', value: sharedEngineState.intelligenceSource },
      { key: 'JWT_SECRET', value: process.env.JWT_SECRET || '' },
      { key: 'OWNER_NAME', value: sharedEngineState.clientProfile?.name || '' },
      { key: 'OWNER_EMAIL', value: sharedEngineState.clientProfile?.email || '' },
      { key: 'OWNER_TEL', value: sharedEngineState.clientProfile?.tel || '' },
      { key: 'OWNER_COUNTRY', value: sharedEngineState.clientProfile?.country || '' }
    ];

    // 3. Trigger Render Webhook or API Call
    const renderToken = process.env.RENDER_API_KEY;
    if (!renderToken) {
      logger.warn('[CLOUD-ORCHESTRATOR] Missing RENDER_API_KEY. Simulation mode only.');
      return { success: true, mode: 'SIMULATED_CLOUD_DEPLOY', report };
    }

    try {
      const serviceId = process.env.RENDER_SERVICE_ID || sharedEngineState.cloudDeploymentId;
      
      // BSS-56: Sync Environment Variables to Render before Deploy
      logger.info('[CLOUD-ORCHESTRATOR] Syncing Environment Variables to Render');
      await fetch(`https://api.render.com/v1/services/${serviceId}/env-vars`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${renderToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(envVars)
      });

      // Trigger the actual deployment
      const response = await fetch(`https://api.render.com/v1/services/${serviceId}/deploys`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${renderToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ clearCache: 'do_not_clear' })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Render API responded with ${response.status}: ${errorBody}`);
      }

      const data = await response.json() as { id: string };
      
      sharedEngineState.lastCloudSync = new Date();
      sharedEngineState.cloudDeploymentId = data.id;

      // BSS-52: Notify Alpha-Copilot of successful cloud synchronization
      const { alphaCopilot } = await import('./alphaCopilot');
      alphaCopilot.confirmConfiguration(sharedEngineState.appName);

      // BSS-56: Register the deployment in the history ledger
      sharedEngineState.deploymentHistory.unshift({
        id: sharedEngineState.deploymentHistory.length + 1,
        commitHash: process.env.RENDER_GIT_COMMIT?.slice(0, 7) || 'local-dev',
        commitMessage: 'Cloud Production Sync',
        cloudProvider: provider.toUpperCase(),
        timestamp: new Date(),
        smartAccount: sharedEngineState.walletAddress || '0x...',
        contractAddress: sharedEngineState.flashloanContractAddress || '0x...',
        isActive: true,
        triggeredBy: 'USER'
      });
      
      return { 
        success: true, 
        deploymentId: data.id,
        status: 'SYNCING_TO_CLOUD'
      };
    } catch (err: any) {
      logger.error({ err }, '[CLOUD-ORCHESTRATOR] Render API deployment failed');
      throw err;
    }
  }

  async getSupportedClouds() {
    return this.popularClouds;
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
        signal: AbortSignal.timeout(10000), // Prevent polling hang on slow API
      });

      if (!response.ok) throw new Error('Render API request failed');
      
      const deploys = await response.json() as any[];
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
   * BSS-56: Service Log Retriever
   * Fetches the logs from the latest failed deployment for AI analysis.
   */
  async getLatestDeploymentLogs(serviceId: string, apiKey?: string): Promise<string> {
    const token = apiKey || process.env.RENDER_API_KEY;
    if (!token) return "Unauthorized: No API Key.";

    try {
      // Fetch the latest deploy ID
      const deploysRes = await fetch(`${this.baseUrl}/services/${serviceId}/deploys?limit=1`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      const deploys = await deploysRes.json() as any[];
      const latestDeploy = deploys[0]?.deploy;

      if (!latestDeploy || latestDeploy.status !== 'build_failed') {
        return "No failed deployments found to analyze.";
      }

      // In a production environment, Render logs are typically streamed or accessed via 
      // specific log endpoints. Here we retrieve the deployment summary/errors.
      return `Deploy ID: ${latestDeploy.id}\nStatus: ${latestDeploy.status}\nTrigger: ${latestDeploy.trigger}`;
    } catch (err) {
      return `Failed to retrieve logs: ${String(err)}`;
    }
  }

  /**
   * BSS-56: Autonomous Remediation
   * Applies environment fixes identified by Alpha-Copilot and triggers a fresh deploy.
   */
  async applyFixAndRedeploy(serviceId: string, envUpdates: { key: string, value: string }[]) {
    const renderToken = process.env.RENDER_API_KEY;
    if (!renderToken) throw new Error("Cloud connection not established.");

    logger.info({ envUpdates }, '[CLOUD-ORCHESTRATOR] Applying AI-suggested environment fixes');

    // 1. Update the environment variables
    await fetch(`${this.baseUrl}/services/${serviceId}/env-vars`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${renderToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(envUpdates)
    });

    // 2. Trigger new deployment
    return this.deployCurrentStack('render');
  }

  /**
   * BSS-56: Configuration Sentinel
   * Compares the live Render environment against the hardened Gold Standard.
   * Automatically re-syncs if drift is detected.
   */
  async auditAndRemediateDrift(serviceId: string) {
    if (!sharedEngineState.isConfigurationHardened || !sharedEngineState.goldStandardConfig) return;

    logger.info("[CLOUD-ORCHESTRATOR] Configuration Sentinel Audit in progress...");
    
    // If local state doesn't match Gold Standard, force a re-sync
    const currentVars = new Map(Object.entries(sharedEngineState.goldStandardConfig));
    
    // We assume any discrepancy in critical keys requires immediate remediation
    if (process.env.RPC_ENDPOINT !== sharedEngineState.goldStandardConfig.RPC_ENDPOINT) {
        logger.warn("[SENTINEL] Drift detected in RPC_ENDPOINT. Restoring Hardened Baseline.");
        await this.syncEnvToRender(currentVars);
        return { remediated: true, reason: 'RPC Drift' };
    }

    return { remediated: false };
  }

  async getCloudStatus() {
    return {
      cloudActive: !!sharedEngineState.cloudDeploymentId,
      lastSync: sharedEngineState.lastCloudSync,
      remoteGes: sharedEngineState.totalWeightedScore // Shared via state sync
    };
  }

  /**
   * BSS-56: Remote Performance Sync
   * Pushes specific tuning parameters to the Cloud instance to match local "Elite" optimizations.
   */
  async syncTuningToCloud(params: { bribeRatioBps: number; minMarginRatioBps: number }) {
    const renderToken = process.env.RENDER_API_KEY;
    const serviceId = process.env.RENDER_SERVICE_ID || sharedEngineState.cloudDeploymentId;

    if (!renderToken || !serviceId) {
      throw new Error("Cloud connection not established (Missing API Key or Service ID)");
    }

    logger.info({ params }, '[CLOUD-ORCHESTRATOR] Pushing Autonomous Tuning to Cloud');

    try {
      // Update env vars on Render - this triggers a configuration reload in the cloud engine
      const response = await fetch(`https://api.render.com/v1/services/${serviceId}/env-vars`, {
        method: 'PATCH', // Partial update
        headers: {
          'Authorization': `Bearer ${renderToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([
          { key: 'BRIBE_RATIO_BPS', value: params.bribeRatioBps.toString() },
          { key: 'MIN_MARGIN_RATIO_BPS', value: params.minMarginRatioBps.toString() }
        ])
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.statusText}`);
      }

      sharedEngineState.lastCloudSync = new Date();
      
      return { 
        success: true, 
        timestamp: sharedEngineState.lastCloudSync 
      };
    } catch (err: any) {
      logger.error({ err }, '[CLOUD-ORCHESTRATOR] Remote sync failed');
      throw err;
    }
  }
}

export const cloudOrchestrator = new CloudOrchestrator();