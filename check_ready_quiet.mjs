import('./api/src/services/deploy_gatekeeper.ts')
  .then(m => m.generateDeploymentReadinessReport(true))
  .then(r => {
    console.log('RESULT:', JSON.stringify({
      overallStatus: r.overallStatus,
      deploymentScore: r.deploymentScore,
      executionStages: r.executionStages
    }, null, 2));
    process.exit(0);
  })
  .catch(e => {
    console.error('ERROR:', e.message);
    process.exit(1);
  });
