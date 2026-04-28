/**
 * API Key Authentication Middleware
 * Protects sensitive endpoints: /api/engine/*, /api/admin/*, /api/settings/*
 *
 * Configuration:
 *   API_KEY - Single shared API key for all authorized clients
 *   API_KEYS - Comma-separated list for multiple clients (optional)
 *
 * Usage:
 *   app.use('/api/engine', authenticate, engineRouter);
 *
 * Security:
 *   - Key sent via Authorization: Bearer <token> header
 *   - Alternative: X-API-Key header for browser clients
 *   - Key validated against env vars (never hardcoded)
 *   - Failed attempts logged with IP for rate limiting correlation
 */

import { Request, Response, NextFunction } from 'express';

interface AuthRequest extends Request {
  apiKey?: string;
  clientId?: string;
}

// Parse API keys from environment
function getValidKeys(): string[] {
  const keysEnv = process.env.API_KEYS || process.env.API_KEY;
  if (!keysEnv) {
    return [];
  }
  return keysEnv
    .split(',')
    .map(k => k.trim())
    .filter(k => k.length > 0);
}

// Extract API key from request
function extractApiKey(req: AuthRequest): string | undefined {
  // 1. Authorization header: Bearer <token>
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  // 2. X-API-Key header (for browsers/CORS)
  const apiKeyHeader = req.headers['x-api-key'];
  if (typeof apiKeyHeader === 'string') {
    return apiKeyHeader.trim();
  }

  // 3. Query parameter (for WebSocket handshake compatibility)
  const apiKeyQuery = req.query['api_key'];
  if (typeof apiKeyQuery === 'string') {
    return apiKeyQuery.trim();
  }

  return undefined;
}

// Middleware factory
export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const validKeys = getValidKeys();

  // If no API keys configured, deny all (fail closed)
  if (validKeys.length === 0) {
    console.error('[auth] No API keys configured in environment');
    res.status(500).json({
      error: 'server_misconfigured',
      message: 'API authentication not configured',
    });
    return;
  }

  const providedKey = extractApiKey(req);

  if (!providedKey) {
    res.status(401).json({
      error: 'unauthorized',
      message: 'Missing API key. Provide via Authorization: Bearer <token> or X-API-Key header',
    });
    return;
  }

  const isValid = validKeys.some(validKey =>
    // Constant-time comparison to prevent timing attacks
    crypto.timingSafeEqual(
      Buffer.from(providedKey, 'utf8'),
      Buffer.from(validKey, 'utf8')
    )
  );

  if (!isValid) {
    // Log attempt for security monitoring (don't reveal key)
    console.warn('[auth] Invalid API key attempt', {
      ip: req.ip || req.socket.remoteAddress,
      path: req.path,
      method: req.method,
      hasKey: !!providedKey,
    });

    res.status(401).json({
      error: 'unauthorized',
      message: 'Invalid API key',
    });
    return;
  }

  // Attach metadata to request for audit logging
  req.apiKey = providedKey;
  req.clientId = Buffer.from(providedKey, 'utf8').toString('hex').slice(0, 8); // first 8 chars as ID

  next();
}

// Optional: Per-route authentication with custom error messages
export function optionalAuthenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const validKeys = getValidKeys();
  const providedKey = extractApiKey(req);

  if (providedKey && validKeys.length > 0) {
    const isValid = validKeys.some(validKey =>
      crypto.timingSafeEqual(
        Buffer.from(providedKey, 'utf8'),
        Buffer.from(validKey, 'utf8')
      )
    );
    if (isValid) {
      req.apiKey = providedKey;
      req.clientId = Buffer.from(providedKey, 'utf8').toString('hex').slice(0, 8);
    }
  }

  next();
}

// Import crypto for timing-safe comparison
import crypto from 'crypto';
