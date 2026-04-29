import * as fs from 'fs';
import * as path from 'path';

const RUST_FILES_TO_CHECK = [
  'solver/src/reinforcement_meta_learner.rs',
  'solver/src/module/bss_43_simulator.rs',
  'solver/src/graph/bss_04_graph.rs',
  'solver/src/timing/mod.rs',
  'solver/src/timing/sub_block_timing.rs',
];

const TYPESCRIPT_FILES_TO_CHECK = [
  'api/src/services/bribeEngine.ts',
  'api/src/services/useLiveTelemetry.ts',
  'api/src/services/AnomalyTicker.tsx',
  'api/src/services/MarketSentiment.tsx',
  'api/src/services/mockRustBridge.ts',
  'api/src/services/websocketStream.ts',
  'api/src/lib/specialists.ts',
  'api/src/lib/alphaCopilot.ts',
  'api/src/routes/telemetry.ts',
  'api/src/routes/engine.ts',
];

console.log('🔍 Checking critical source file integrity...\n');

const workspaceRoot = path.resolve(process.cwd(), '..', '..');
const allFiles = [...RUST_FILES_TO_CHECK, ...TYPESCRIPT_FILES_TO_CHECK];
let passed = 0;
let failed = 0;

for (const relPath of allFiles) {
  const fullPath = path.join(workspaceRoot, relPath);
  try {
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      if (stats.size === 0) {
        console.log(`❌ EMPTY: ${relPath}`);
        failed++;
      } else {
        console.log(`✅ OK:    ${relPath} (${stats.size} bytes)`);
        passed++;
      }
    } else {
      console.log(`❌ MISSING: ${relPath}`);
      failed++;
    }
  } catch (err) {
    console.log(`❌ ERROR:  ${relPath} - ${err.message}`);
    failed++;
  }
}

console.log(`\n📊 Summary: ${passed} passed, ${failed} failed`);
console.log(`   Workspace root: ${workspaceRoot}`);

if (failed > 0) {
  console.log('\n⚠️  Gatekeeper will BLOCK deployment - fix missing files');
  process.exit(1);
} else {
  console.log('\n✅ All source files verified - ready for next gate checks');
  process.exit(0);
}
