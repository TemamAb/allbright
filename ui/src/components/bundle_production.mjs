import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

/**
 * BSS-PACK: Elite Production Bundler
 * Packages BrightSky artifacts for commercial installation.
 */
async function bundle() {
  console.log('--- INITIALIZING BRIGHTSKY PRODUCTION BUNDLE ---');
  
  // 1. Build React UI
  console.log('[1/3] Building Optimized Frontend...');
  execSync('cd ui && pnpm install && pnpm build', { stdio: 'inherit' });

  // 2. Build Rust Solver
  console.log('[2/3] Compiling Release Solver Engine...');
  execSync('cd solver && cargo build --release', { stdio: 'inherit' });

  // 3. Create Package
  console.log('[3/3] Archiving Production Artifacts...');
  const output = fs.createWriteStream(path.join(process.cwd(), 'brightsky-v2.6-production.zip'));
  const archive = archiver('zip', { zlib: { level: 9 } });

  archive.pipe(output);

  // Add built UI
  archive.directory('ui/dist/', 'ui/dist');
  // Add Rust binary
  archive.file('solver/target/release/brightsky', { name: 'bin/brightsky' });
  // Add API logic
  archive.directory('api/dist/', 'api/dist');
  archive.file('package.json', { name: 'package.json' });
  archive.file('render.yaml', { name: 'render.yaml' });

  await archive.finalize();
  console.log('--- BUNDLE COMPLETE: brightsky-v2.6-production.zip ---');
}

bundle();