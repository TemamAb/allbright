// Run the deployment readiness report
import { generateDeploymentReadinessReport } from './api/src/services/deploy_gatekeeper.js';

const report = await generateDeploymentReadinessReport();
console.log(JSON.stringify(report, null, 2));
