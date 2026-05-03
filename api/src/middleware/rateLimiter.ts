/**
 * Simple in-memory rate limiter (free tier, no external deps)
 * Limits: 10 req/min per IP for sensitive endpoints
 */
import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 10;

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) rateLimitStore.delete(key);
  }
}, 5 * 60 * 1000);

export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const sensitivePaths = ['/api/engine/', '/api/admin/', '/api/settings'];
  const isSensitive = sensitivePaths.some(path => req.path.startsWith(path));
  if (!isSensitive) return next();

  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  let entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetTime) {
    entry = { count: 1, resetTime: now + WINDOW_MS };
    rateLimitStore.set(ip, entry);
    return next();
  }

  if (entry.count >= MAX_REQUESTS) {
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.ceil((entry.resetTime - now) / 1000)
    });
    return;
  }

  entry.count++;
  next();
}
