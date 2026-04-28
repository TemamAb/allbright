import { Router } from 'express';
import { analyzeReadiness } from '../services/setupAnalyzer';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../services/logger';
import { validateDotenv } from '../services/dotenvValidator'; // Will create later

const router = Router();
const upload = multer({ dest: 'uploads/' });

/**
 * GET /api/setup/readiness
 * System readiness analysis for onboarding
 */
router.get('/readiness', async (req, res) => {
  try {
    const report = await analyzeReadiness();
    res.json(report);
  } catch (err) {
    logger.error(err, 'Readiness check failed');
    res.status(500).json({ error: 'Readiness check failed' });
  }
});

/**
 * POST /api/setup/upload-env
 * Upload .env file before live sim (single file)
 */
router.post('/upload-env', upload.single('envFile'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No .env file uploaded' });

    const envContent = await fs.readFile(req.file.path, 'utf8');
    const validation = validateDotenv(envContent);

    if (!validation.valid) {
      await fs.unlink(req.file.path);
      return res.status(400).json({ error: 'Invalid .env', details: validation });
    }

    // Auto-configure system (Render-style)
    const config = configureFromEnv(validation.parsedVars);
    
    // Save configured .env and config.json
    const envPath = path.join(process.cwd(), '.env');
    const configPath = path.join(process.cwd(), '.brightsky.config.json');
    await fs.writeFile(envPath, envContent);
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    await fs.unlink(req.file.path);

    logger.info('Render-style .env auto-configured', { keys: validation.keys });
    res.json({ 
      success: true, 
      config,
      message: 'Auto-configured NAME=value → system ready (like Render dashboard)'
    });
  } catch (err) {
    logger.error(err, 'Env upload failed');
    res.status(500).json({ error: 'Upload failed' });
  }
});

/**
 * POST /api/setup/install-deps
 * Trigger deps install
 */
router.post('/install-deps', async (req, res) => {
  try {
    await import('../services/setupAnalyzer').then(m => m.installDeps());
    res.json({ success: true, message: 'Deps installed' });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;

