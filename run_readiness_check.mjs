import('./api/src/services/deploy_gatekeeper.ts')
  .then(m => m.generateDeploymentReadinessReport())
  .then(r => {
    console.log('=== Deployment Readiness Report ===');
    console.log('Status:', r.overallStatus);
    console.log('Score:', r.deploymentScore);
    console.log('Stages:', JSON.stringify(r.executionStages, null, 2));
  })
  .catch(e => console.error('Error:', e.message));
