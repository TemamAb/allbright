#!/usr/bin/env node
// Bootstrap: Load root .env then run the spec
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env');

try {
  const content = readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const eqIdx = line.indexOf('=');
    if (eqIdx > 0) {
      const key = line.slice(0, eqIdx).trim();
      const value = line.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = value;
    }
  }
  console.log(`[BOOTSTRAP] Loaded .env from ${envPath}`);
} catch (e) {
  console.warn('[BOOTSTRAP] .env not found, using existing process.env');
}

// Now import and run the spec
import('./specs/checkReadiness.ts');
