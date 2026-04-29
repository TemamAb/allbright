/**
 * Retry utility with exponential backoff
 * Provides resilient retry logic for flaky operations
 */

import { logger } from "./logger";

export async function withBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    factor?: number;
  } = {}
): Promise<T> {
  const { maxRetries = 3, initialDelay = 1000, maxDelay = 30000, factor = 2 } = options;
  let lastError: any;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      logger.debug(`[RETRY] Attempt ${attempt + 1}/${maxRetries + 1}`);
      return await fn();
    } catch (err: any) {
      lastError = err;
      if (attempt === maxRetries) break;
      logger.warn(`[RETRY] Attempt ${attempt + 1} failed: ${err.message}, retrying in ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * factor, maxDelay);
    }
  }
  throw lastError;
}

export function withBackoffIf<T>(
  condition: boolean,
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    factor?: number;
  } = {}
): Promise<T> {
  if (condition) {
    return withBackoff(fn, options);
  }
  return fn();
}
