#!/usr/bin/env node

/**
 * allbright Preinstall Hook: Enforce pnpm usage
 * Prevents npm/yarn usage in workspace
 */

const { execSync } = require('child_process');
const path = require('path');

try {
  // Check if pnpm is installed
  execSync('pnpm --version', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ pnpm is required for allbright. Please install: npm install -g pnpm');
  process.exit(1);
}

const packageManager = process.env.npm_execpath || process.env.npm_node_execpath;

if (packageManager && !packageManager.includes('pnpm')) {
  console.error('🚫 allbright requires pnpm. Detected:', path.basename(packageManager));
  console.error('💡 Run: pnpm install');
  process.exit(1);
}

console.log('✅ pnpm enforced - proceeding with install...');

