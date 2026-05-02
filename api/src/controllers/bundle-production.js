/**
 * BrightSky Production Bundler
 * Packages the built UI and API into a distribution-ready ZIP.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const archiver = require('archiver'); // Requires 'npm install archiver'

const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist_package');
const ZIP_NAME = 'BrightSky_Production_Bundle.zip';

async function pack() {
  console.log('--- Initializing Production Pack ---');
  
  // 1. Build sequences
  console.log('Building UI...');
  execSync('cd ui && pnpm build', { stdio: 'inherit' });
  
  // 2. Prepare workspace
  if (fs.existsSync(DIST_DIR)) fs.rmSync(DIST_DIR, { recursive: true });
  fs.mkdirSync(DIST_DIR);

  // 3. Move production files
  console.log('Sorting production assets...');
  fs.cpSync(path.join(ROOT_DIR, 'ui/dist'), path.join(DIST_DIR, 'public'), { recursive: true });
  fs.cpSync(path.join(ROOT_DIR, 'api'), path.join(DIST_DIR, 'server'), { 
    recursive: true,
    filter: (src) => !src.includes('node_modules') && !src.includes('.env')
  });
  
  // 3.1 Create Setup Icon / Shortcut file
  console.log('Generating setup entry point...');
  const setupInstructions = `
BRIGHTSKY DEFI SOFTWARE DEVELOPER LTD.
======================================
To start the setup wizard, run the 'server' application and open your browser to the local port.
  `;
  fs.writeFileSync(path.join(DIST_DIR, 'CLICK_TO_SETUP.txt'), setupInstructions);

  // 4. Create ZIP archive
  const output = fs.createWriteStream(path.join(ROOT_DIR, ZIP_NAME));
  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(output);
  archive.directory(DIST_DIR, false);
  await archive.finalize();

  console.log(`Successfully packed all production files into ${ZIP_NAME}`);
}

pack().catch(console.error);