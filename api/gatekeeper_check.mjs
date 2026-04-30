import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const workspaceRoot = path.resolve(__dirname, '../../');
const FILES_TO_CHECK = [
  'api/src/services/bribeEngine.ts',
  'api/src/services/useLiveTelemetry.ts',
  'api/src/services/MarketSentiment.tsx',
  'api/src/services/mockRustBridge.ts',
  'api/src/services/websocketStream.ts',
  'api/src/services/specialists.ts',
  'api/src/services/alphaCopilot.ts',
  'api/src/controllers/telemetry.ts',
  'api/src/controllers/engine.ts',
];



console.log('🔍 Deployment Gatekeeper: File Integrity Check\n');
console.log('Script dir:', __dirname);
console.log('Workspace:', workspaceRoot);
console.log('─'.repeat(60));


let passed = 0;
let failed = 0;

for (const relPath of FILES_TO_CHECK) {
  const fullPath = path.resolve(process.cwd(), '..', relPath);
  try {
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      if (stats.size === 0) {
        console.log(`❌ EMPTY:   ${relPath}`);
        failed++;
      } else {
        console.log(`✅ EXISTS:  ${relPath} (${(stats.size/1024).toFixed(1)} KB)`);
        passed++;
      }
    } else {
      console.log(`❌ MISSING: ${relPath}`);
      failed++;
    }
  } catch (err) {
    console.log(`❌ ERROR:   ${relPath} - ${err.message}`);
    failed++;
  }
}

console.log('─'.repeat(60));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
console.log(`   Gate status: ${failed === 0 ? '✅ PASS' : '❌ FAIL'}`);

if (failed > 0) {
  console.log('\n⚠️  Deployment BLOCKED - missing or invalid source files');
  process.exit(1);
} else {
  console.log('\n✅ File integrity check passed - proceed to next gates');
  process.exit(0);
}
