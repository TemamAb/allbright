import { debuggingSystem } from './api/src/services/debuggingSystem';

async function main() {
  console.log('[DEBUG] Starting internal debugging system...\n');
  
  try {
    const report = await debuggingSystem.runFullDiagnostic();
    
    console.log('='.repeat(60));
    console.log('DEBUGGING SYSTEM REPORT');
    console.log('='.repeat(60));
    console.log(`\nOverall Score: ${report.overallScore}/100`);
    console.log(`Timestamp: ${new Date(report.timestamp).toISOString()}`);
    console.log(`Root Cause: ${report.rootCauseSummary}\n`);
    
    console.log('-'.repeat(60));
    console.log('DIAGNOSTIC RESULTS');
    console.log('-'.repeat(60));
    
    for (const result of report.results) {
      const emoji = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`${emoji} ${result.itemId}: ${result.name} [${result.category}]`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Message: ${result.message}`);
      if (result.suggestedFix) {
        console.log(`   Fix: ${result.suggestedFix}`);
      }
      console.log('');
    }
    
    const passCount = report.results.filter(r => r.status === 'PASS').length;
    const failCount = report.results.filter(r => r.status === 'FAIL').length;
    const inconclusiveCount = report.results.filter(r => r.status === 'INCONCLUSIVE').length;
    
    console.log('='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Checks: ${report.results.length}`);
    console.log(`Passed: ${passCount}`);
    console.log(`Failed: ${failCount}`);
    console.log(`Inconclusive: ${inconclusiveCount}`);
    console.log('');
    
    if (failCount > 0) {
      console.log('⚠️  Some diagnostic checks failed. Review the details above for suggested fixes.');
    } else {
