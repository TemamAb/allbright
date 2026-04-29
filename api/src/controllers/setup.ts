import { Router } from 'express';
import { analyzeReadiness } from '../services/setupAnalyzer';
import { logger } from '../services/logger';
import { validateDotenv } from '../services/dotenvValidator';
import * as fs from 'fs';
import * as path from 'path';

const router = Router();

// Render-style env config helper (auto-detects from .env or system)
function configureFromEnv(vars: Map<string, string>) {
  const config: any = { ports: {}, features: {}, security: {} };
  for (const [key, value] of vars) {
    if (key.startsWith('PORT_') || key === 'PORT') config.ports[key] = value;
    if (key.startsWith('FEATURE_')) config.features[key] = value === 'true' || value === '1';
    if (key.startsWith('SECURE_') || key.startsWith('SSL_')) config.security[key] = value;
  }
  config.configuredAt = new Date().toISOString();
  config.source = 'auto-env';
  return config;
}

/**
 * GET /api/setup/readiness
 * System readiness analysis for onboarding
 */
router.get('/readiness', async (req, res) => {
  try {
    const report = await analyzeReadiness();
    res.json(report);
  } catch (err: any) {
    logger.error(err, 'Readiness check failed');
    res.status(500).json({ error: 'Readiness check failed' });
  }
});

/**
 * POST /api/setup/upload-env
 * Upload .env file before live sim (single file)
 */
router.post('/upload-env', (req: any, res) => {
  try {
    if (!req.body || !req.body.envContent) return res.status(400).json({ error: 'No env content provided in body' });

    const envContent = req.body.envContent;
    const validation = validateDotenv(envContent);

    if (!validation.valid) {
      return res.status(400).json({ error: 'Invalid .env', details: validation });
    }

    // Auto-configure system (Render-style)
    const config = configureFromEnv(validation.parsedVars);
    
    // Save configured .env and config.json
    const envPath = path.join(process.cwd(), '.env');
    const configPath = path.join(process.cwd(), '.brightsky.config.json');
    fs.writeFileSync(envPath, envContent);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    logger.info('Render-style .env auto-configured with keys: ' + validation.keys.join(', '));
    res.json({ 
      success: true, 
      config,
      message: 'Auto-configured NAME=value → system ready (like Render dashboard)'
    });
   } catch (err: any) {
    logger.error(err, 'Env upload failed');
    res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;

