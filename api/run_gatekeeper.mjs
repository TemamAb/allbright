import { comprehensiveDeploymentCheck } from './src/services/deploy_gatekeeper.ts';

async function runGatekeeper() {
  console.log('🚀 Running Deployment Gatekeeper Check...\n');
  
  try {
    const result = await comprehensiveDeploymentCheck();
    
    console.log('═'.repeat(60));
    console.log('GATEKEEPER DEPLOYMENT CHECK RESULTS');
    console.log('═'.repeat(60));
    console.log(`\n📊 Overall Status: ${result.ready ? '✅ READY' : '❌ NOT READY'}\n`);
    
    console.log('🔍 Orchestrator Status:');
    console.log(`  Alpha Copilot:  ${result.orchestratorsStatus.alphaCopilot ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Gate Keeper:    ${result.orchestratorsStatus.gateKeeper ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Specialists:    ${result.orchestratorsStatus.specialists ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Source Files:   ${result.orchestratorsStatus.sourceFiles ? '✅ PASS' : '❌ FAIL'}`);
    
    if (result.fileVerification) {
      console.log(`\n📁 File Integrity Check:`);
      console.log(`  All files present: ${result.fileVerification.allFilesPresent ? '✅ YES' : '❌ NO'}`);
      if (result.fileVerification.missingFiles.length > 0) {
        console.log(`  Missing files:`);
        result.fileVerification.missingFiles.forEach(f => console.log(`    ❌ ${f}`));
      }
      if (result.fileVerification.fileErrors.length > 0) {
        console.log(`  Errors:`);
        result.fileVerification.fileErrors.forEach(e => console.log(`    ⚠️  ${e}`));
      }
    }
    
    if (result.issues.length > 0) {
      console.log(`\n⚠️  Issues (${result.issues.length}):`);
      result.issues.forEach((issue, i) => console.log(`  ${i + 1}. ${issue}`));
    }
    
    console.log(`\n📋 Recommendations:`);
    result.recommendations.forEach((rec, i) => console.log(`  ${i + 1}. ${rec}`));
    
    console.log('\n' + '═'.repeat(60));
    process.exit(result.ready ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Gatekeeper execution failed:', error);
    process.exit(1);
  }
}

runGatekeeper();
