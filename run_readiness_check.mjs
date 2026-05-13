import('./api/dist/index.mjs')
  .then(m => m.generateDeploymentReadinessReport(true)) // skipRuntimeStage=true
  .then(r => {
    console.log('=== Deployment Readiness Report ===');
    console.log('Status:', r.overallStatus);
    console.log('Score:', r.deploymentScore);
    console.log('Stages:', JSON.stringify(r.executionStages, null, 2));
  })
  .catch(e => console.error('Error:', e.message));
