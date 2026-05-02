import { Router } from 'express';
import { analyzeReadiness } from '../services/setupAnalyzer';
import { logger } from '../services/logger';
import { validateDotenv } from '../services/dotenvValidator';
import { db, settingsTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import * as fs from 'node:fs';
import * as path from 'path';
import { sharedEngineState } from '../services/engineState';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cloudOrchestrator } from '../services/cloudOrchestrator';
import { alphaCopilot, broadcastCopilotEvent } from '../services/alphaCopilot';

const router = Router();

let activePollingTimeout: ReturnType<typeof setTimeout> | null = null;

const clearActivePolling = () => {
  if (activePollingTimeout) {
    clearTimeout(activePollingTimeout);
    activePollingTimeout = null;
    return true;
  }
  return false;
};

// BSS-56: Rate limiting for AI-assisted auto-fix to prevent excessive API calls
const MAX_AUTO_FIX_ATTEMPTS_PER_HOUR = 3;
const AUTO_FIX_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
let autoFixAttemptsCount = 0;
let autoFixWindowStartTime = 0;

// Render-style env config helper (auto-detects from .env or system)
function configureFromEnv(vars: Map<string, string>) {
  const config: any = { ports: {}, features: {}, security: {}, trading: {} };
  for (const [key, value] of vars) {
    if (key.startsWith('PORT_') || key === 'PORT') config.ports[key] = value;
    if (key.startsWith('FEATURE_')) config.features[key] = value === 'true' || value === '1';
    if (key.startsWith('SECURE_') || key.startsWith('SSL_')) config.security[key] = value;

    // Commercial mapping for UI population
    if (key === 'RPC_URL_BASE' || key === 'RPC_ENDPOINT') config.trading.rpc = value;
    if (key === 'PIMLICO_API_KEY') config.trading.pimlicoKey = value;
    if (key === 'PRIVATE_KEY') config.trading.privateKey = value;
  }
  config.configuredAt = new Date().toISOString();
  config.source = 'auto-env';
  return config;
}

let loginAttempts = 0;
let lockoutUntil = 0;

/**
 * POST /api/setup/register
 * Commercial entry point: First user is ADMIN.
 */
router.post('/register', async (req, res) => {
  const { email, password, name, tel, country } = req.body;
  try {
    // Check if any users exist (Simple persistence check in settingsTable for this example)
    // In production, you would use a dedicated 'users' table
    const existingUser = await db.select().from(settingsTable).where(sql`key = 'OWNER_EMAIL'`);
    
    if (existingUser.length > 0) {
      return res.status(403).json({ success: false, error: "System already has a registered owner." });
    }

    // Generate a verification token
    const verifyToken = crypto.randomBytes(32).toString('hex');
    
    // Securely hash the password (cost factor 10 is standard for performance/security balance)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Store user data securely in the DB
    await db.insert(settingsTable).values([
      { key: 'OWNER_EMAIL', value: email, updatedAt: new Date() },
      { key: 'OWNER_NAME', value: name || 'Operator', updatedAt: new Date() },
      { key: 'OWNER_TEL', value: tel || '', updatedAt: new Date() },
      { key: 'OWNER_COUNTRY', value: country || '', updatedAt: new Date() },
      { key: 'OWNER_PASS_HASH', value: hashedPassword, updatedAt: new Date() },
      { key: 'VERIFICATION_TOKEN', value: verifyToken, updatedAt: new Date() },
      { key: 'IS_VERIFIED', value: 'false', updatedAt: new Date() }
    ]);

    logger.info({ email }, "[AUTH] New commercial account created. Pending verification.");
    res.json({ success: true, message: "Account created. Please verify your token.", token: verifyToken });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/setup/verify
 * Account verification gate
 */
router.post('/verify', async (req, res) => {
  const { token } = req.body;
  const savedToken = await db.select().from(settingsTable).where(sql`key = 'VERIFICATION_TOKEN'`);
  
  if (savedToken.length > 0 && savedToken[0].value === token) {
    await db.update(settingsTable).set({ value: 'true' }).where(sql`key = 'IS_VERIFIED'`);
    res.json({ success: true, message: "Identity verified. Elite access granted." });
  } else {
    res.status(401).json({ success: false, error: "Invalid verification token." });
  }
});

/**
 * POST /api/setup/login
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (Date.now() < lockoutUntil) {
    return res.status(429).json({ success: false, error: 'Too many attempts. System locked.' });
  }
  
  // Check DB for commercial credentials
  const savedEmail = await db.select().from(settingsTable).where(sql`key = 'OWNER_EMAIL'`);
  const savedPass = await db.select().from(settingsTable).where(sql`key = 'OWNER_PASS_HASH'`);

  const dashboardUser = savedEmail[0]?.value || process.env.DASHBOARD_USER || 'iamtemam@gmail.com';
  const dashboardPass = savedPass[0]?.value || process.env.DASHBOARD_PASS || '123abc';

  // Handle comparison: Support both hashed (DB) and plaintext (initial ENV fallback)
  const isPasswordValid = dashboardPass.startsWith('$2') 
    ? await bcrypt.compare(password, dashboardPass)
    : password === dashboardPass;

  if (email === dashboardUser && isPasswordValid) {
    // Check verification status for registered commercial users
    if (savedEmail.length > 0) {
      const isVerified = await db.select().from(settingsTable).where(sql`key = 'IS_VERIFIED'`);
      if (isVerified[0]?.value !== 'true') {
        logger.warn(`[AUTH] Login blocked: ${email} is not verified`);
        return res.status(403).json({ success: false, error: 'Account not verified. Please complete verification.' });
      }
    }

    loginAttempts = 0;
    
    // Populate profile into shared state
    const profileData = await db.select().from(settingsTable).where(sql`key LIKE 'OWNER_%'`);
    const getVal = (k: string) => profileData.find(r => r.key === k)?.value;
    
    sharedEngineState.clientProfile = {
      email: getVal('OWNER_EMAIL') || email,
      name: getVal('OWNER_NAME') || 'Operator',
      tel: getVal('OWNER_TEL') || '',
      country: getVal('OWNER_COUNTRY') || '',
      launchedAt: new Date()
    };

    // Assign Admin role to the primary commercial owner
    sharedEngineState.currentUserRole = email === 'iamtemam@gmail.com' ? 'ADMIN' : 'USER';
    
    // Generate JWT for session management
    const token = jwt.sign(
      { email, role: sharedEngineState.currentUserRole },
      process.env.JWT_SECRET || 'brightsky-elite-secret',
      { expiresIn: '24h' }
    );

    logger.info(`[AUTH] Dashboard access granted to: ${email}`);
    res.json({ success: true, message: 'Access authorized', token });
  } else {
    loginAttempts++;
    if (loginAttempts >= 5) {
      lockoutUntil = Date.now() + 15 * 60 * 1000; // 15m lockout
    }
    logger.warn(`[AUTH] Unauthorized access attempt for: ${email}`);
    res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
});

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
 * POST /api/setup/branding
 * Allows commercial users to white-label the application.
 */
router.post('/branding', async (req, res) => {
  const { appName, logoUrl } = req.body;
  
  // Update persistent shared state
  sharedEngineState.appName = appName || 'BrightSky Elite';
  sharedEngineState.logoUrl = logoUrl || null;

  logger.info({ appName }, "[COMMERCIAL] Application branding updated by operator.");
  res.json({ 
    success: true, 
    message: `Application renamed to ${sharedEngineState.appName}` 
  });
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
      return res.status(400).json({ error: 'Invalid .env format', missing: validation.missing });
    }

    // Auto-configure system (Render-style)
    const config = configureFromEnv(new Map(Object.entries(validation.parsedVars)));
    
    // Save configured .env and config.json
    const envPath = path.join(process.cwd(), '.env');
    const configPath = path.join(process.cwd(), '.brightsky.config.json');
    fs.writeFileSync(envPath, envContent);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    // BSS-56: If RENDER_API_KEY is detected, trigger background sync to Cloud Provider
    const varsMap = new Map(Object.entries(validation.parsedVars));
    const serviceId = varsMap.get('RENDER_SERVICE_ID') || process.env.RENDER_SERVICE_ID;

    if (varsMap.has('RENDER_API_KEY') || serviceId) {
      cloudOrchestrator.syncEnvToRender(varsMap).then(async (result) => {
        if (result.success) {
          logger.info('[SETUP] Cloud environment auto-synchronized via Render API.');
          // BSS-56: AI persona feedback on successful orchestration
          broadcastCopilotEvent('cloud-sync-success', { message: 'Cloud environment synchronized. Render is now auto-configuring your deployment.' });

          // Clear any existing polling before starting new one
          clearActivePolling();

          // BSS-56: Begin polling Render deployment status
          const apiKey = varsMap.get('RENDER_API_KEY') || process.env.RENDER_API_KEY;

          if (serviceId && apiKey && typeof serviceId === 'string') {
            let pollCount = 0;
            const maxPolls = 100;
            const startTime = Date.now();
            const TIMEOUT_MS = 15 * 60 * 1000;
            
            const runPollingCycle = async () => {
              pollCount++;
              const status = await cloudOrchestrator.getDeploymentStatus(serviceId, apiKey);
              broadcastCopilotEvent('cloud-deploy-progress', status);

              if (status.percentage === 100 || status.status === 'error') {
                if (status.percentage === 100) {
                  // BSS-56: Self-Learning Hardening Sequence
                  logger.info("[SETUP] Deployment Successful. Initializing Alpha-Copilot Hardening Audit...");
                  alphaCopilot.analyzeAndHardenConfiguration();
                }
                activePollingTimeout = null;
                return;
              }

              if (Date.now() - startTime >= TIMEOUT_MS || pollCount >= maxPolls) {
                broadcastCopilotEvent('onboarding-timeout', { 
                  message: 'Cloud deployment timed out after 15 minutes. Please check your Render dashboard manually.' 
                });
                activePollingTimeout = null;
                return;
              }

              // BSS-56: Increase interval as deployment nears completion to respect API rate limits
              const nextInterval = status.percentage >= 85 ? 25000 : (status.percentage >= 45 ? 15000 : 10000);
              activePollingTimeout = setTimeout(runPollingCycle, nextInterval);
            };

            activePollingTimeout = setTimeout(runPollingCycle, 10000);
          }
        }
      });
    }

    logger.info('Render-style .env auto-configured with keys: ' + validation.keys.join(', '));
    res.json({ 
      success: true, 
      config,
      serviceId,
      message: 'System auto-configured. If running on Render, your dashboard is being updated automatically.'
    });
   } catch (err: any) {
    logger.error(err, 'Env upload failed');
    res.status(500).json({ error: 'Upload failed' });
  }
});

/**
 * POST /api/setup/cancel-sync
 * BSS-56: Cancels the active cloud deployment synchronization polling.
 */
router.post('/cancel-sync', (req, res) => {
  const cancelled = clearActivePolling();
  logger.info('[SETUP] Manual sync cancellation requested.');
  res.json({ success: true, message: cancelled ? 'Cloud synchronization polling cancelled.' : 'No active synchronization detected.' });
});

/**
 * POST /api/setup/auto-fix
 * BSS-56: Autonomous Recovery Gate
 * Fetches logs, consults Alpha-Copilot, and attempts to fix/redeploy.
 */
router.post('/auto-fix', async (req, res) => {
  const { serviceId, force } = req.body;
  try {
    // BSS-56: Rate limit check
    if (!force) {
      const now = Date.now();
      if (autoFixWindowStartTime === 0 || now - autoFixWindowStartTime > AUTO_FIX_RATE_LIMIT_WINDOW_MS) {
        autoFixAttemptsCount = 0;
        autoFixWindowStartTime = now;
      }

      if (autoFixAttemptsCount >= MAX_AUTO_FIX_ATTEMPTS_PER_HOUR) {
        return res.status(429).json({ success: false, error: `Rate limit exceeded. Max ${MAX_AUTO_FIX_ATTEMPTS_PER_HOUR} attempts per hour. Use 'force: true' to override.` });
      }
      autoFixAttemptsCount++;
    }

    logger.info({ serviceId }, "[SETUP] Initializing AI-assisted autonomous fix...");
    
    // 1. Get logs
    const logs = await cloudOrchestrator.getLatestDeploymentLogs(serviceId);
    
    // 2. AI Analysis
    const rawAdvice = await alphaCopilot.analyzeRenderLogs(logs);
    const advice = `[${new Date().toLocaleTimeString()}] ${rawAdvice}`;
    
    // 3. Inform the user via Socket
    broadcastCopilotEvent('cloud-deploy-progress', { percentage: 15, status: 'syncing', message: advice });

    // 4. Trigger Redeploy (Forced)
    await cloudOrchestrator.deployCurrentStack('render');
    
    res.json({ success: true, advice });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/setup/generate-secret
 * BSS-52: Dashboard-native secret generation to avoid terminal use.
 */
router.get('/generate-secret', (req, res) => {
  const secret = crypto.randomBytes(64).toString('hex');
  res.json({ success: true, secret });
});

/**
 * POST /api/setup/copilot-guidance
 * BSS-52: Leverages Alpha-Copilot intelligence to provide configuration advice.
 */
router.post('/copilot-guidance', async (req, res) => {
  const { field, value } = req.body;
  try {
    if (!value && field !== 'env-upload') {
      return res.json({ success: true, advice: null });
    }

    let advice: string;
    if (field === 'branding') {
      advice = await alphaCopilot.validateAndSuggestBranding(value);
    } else if (field === 'env-upload') {
      advice = await alphaCopilot.adviseZeroConfigSetup();
    } else {
    let prompt = "";
    if (field === 'rpc') {
      prompt = `A user is configuring their RPC endpoint as: ${value}. Provide a concise, elite-grade assessment of this RPC for high-frequency arbitrage. Focus on latency and privacy.`;
    } else if (field === 'pimlico') {
      prompt = `A user is configuring their Pimlico API key. Provide a concise, professional explanation of why this is critical for gasless UserOperations in BrightSky.`;
    }

      if (!prompt) {
      return res.json({ success: true, advice: null });
    }
      advice = await alphaCopilot.askLLM(prompt);
    }
    
    res.json({ 
      success: true, 
      advice: advice.replace(/^"|"$/g, '') // Clean up LLM quotes
    });
  } catch (err: any) {
    logger.error(err, 'Copilot guidance consultation failed');
    res.status(500).json({ error: "Copilot consultation failed" });
  }
});

/**
 * POST /api/setup/handshake
 * Verifies the user's private AI key before committing the configuration.
 */
router.post('/handshake', async (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey) {
    return res.status(400).json({ success: false, error: 'AI API Key is required for handshake' });
  }

  try {
    const result = await alphaCopilot.testAIKey(apiKey);
    if (result.success) {
      sharedEngineState.intelligenceSource = 'USER_PRIVATE';
      
      // Notify Copilot to warmly announce success
      alphaCopilot.confirmConfiguration(sharedEngineState.appName);
      
      res.json({ success: true, message: 'Cognitive Handshake Successful' });
    } else {
      res.status(401).json({ success: false, error: result.error });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Handshake execution failed' });
  }
});

export default router;
