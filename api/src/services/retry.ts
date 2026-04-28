/**
 * Retry utility with exponential backoff and jitter
 * Provides resilient retry logic for flaky operations (RPC calls, DB connections)
 *
 * Features:
 *   - Exponential backoff: delay = base * 2^attempt
 *   - Jitter: ±random(0, delay * jitterFactor) to prevent thundering herd
 *   - Configurable max attempts, max delay, timeout
 *   - Predicate-based retry (only retry on specific errors)
 *   - AbortSignal support for cancellation
 *
 * Usage:
 *   const result = await withBackoff(
 *     () => fetchRpc('eth_blockNumber'),
 *     { maxAttempts: 5, baseDelay: 1000, jitter: 0.2 }
 *   );
 */

export interface RetryConfig {
  /** Maximum number of attempts (default: 3) */
  maxAttempts?: number;
  /** Base delay in milliseconds (default: 1000) */
  baseDelay?: number;
  /** Maximum delay cap (default: 30000) */
  maxDelay?: number;
  /** Jitter factor 0-1 (default: 0.1 = ±10%) */
  jitter?: number;
  /** AbortSignal for cancellation */
  signal?: AbortSignal;
  /** Should retry predicate (error => boolean) */
  shouldRetry?: (error: Error | unknown) => boolean;
}

export interface RetryResult<T> {
  value: T;
  attempts: number;
  totalTimeMs: number;
}

/**
 * Calculate delay with exponential backoff + jitter
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  const base = config.baseDelay ?? 1000;
  const max = config.maxDelay ?? 30000;
  const jitter = config.jitter ?? 0.1;

  // Exponential: base * 2^(attempt - 1)
  let delay = base * Math.pow(2, attempt - 1);

  // Cap at maxDelay
  delay = Math.min(delay, max);

  // Add jitter: ±random(0, delay * jitterFactor)
  if (jitter > 0) {
    const jitterAmount = delay * jitter * (2 * Math.random() - 1);
    delay = Math.max(0, delay + jitterAmount);
  }

  return Math.round(delay);
}

/**
 * Retry a function with exponential backoff
 */
export async function withBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<RetryResult<T>> {
  const maxAttempts = config.maxAttempts ?? 3;
  const signal = config.signal;

  let lastError: Error | unknown;
  let attempts = 0;
  const startTime = Date.now();

  while (attempts < maxAttempts) {
    attempts++;

    try {
      // Check for cancellation
      if (signal?.aborted) {
        throw new Error('Retry aborted via signal');
      }

      const result = await fn();

      // Success
      return {
        value: result,
        attempts,
        totalTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      lastError = error;

      // Determine if we should retry
      const isRetryable =
        config.shouldRetry?.(error) ?? shouldRetryByDefault(error);

      if (!isRetryable || attempts >= maxAttempts) {
        break;
      }

      // Calculate delay and wait
      const delay = calculateDelay(attempts, config);

      try {
        await new Promise((resolve) => {
          setTimeout(resolve, delay);
        });
      } catch {
        // Timeout or abort, continue to next retry
      }
    }
  }

  // All attempts exhausted
  throw lastError;
}

/**
 * Default retry predicate: retry on network errors, timeouts, 5xx
 */
function shouldRetryByDefault(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Retry on network failures
    if (
      message.includes('econnreset') ||
      message.includes('etimedout') ||
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('eai_again') // DNS lookup failed
    ) {
      return true;
    }

    // Retry on timeout errors
    if (message.includes('timeout') || message.includes('abort')) {
      return true;
    }

    // Retry on 5xx HTTP errors (if error has status)
    if ((error as any).status >= 500) {
      return true;
    }
  }

  return false;
}

/**
 * Retry with custom predicate (e.g., only retry on specific error codes)
 */
export function withBackoffIf<T>(
  fn: () => Promise<T>,
  predicate: (error: Error | unknown) => boolean,
  config: RetryConfig = {}
): Promise<RetryResult<T>> {
  return withBackoff(fn, {
    ...config,
    shouldRetry: predicate,
  });
}


export interface RetryResult<T> {
  value: T;
  attempts: number;
  totalTimeMs: number;
}

/**
 * Calculate delay with exponential backoff + jitter
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  const base = config.baseDelay ?? 1000;
  const max = config.maxDelay ?? 30000;
  const jitter = config.jitter ?? 0.1;

  // Exponential: base * 2^(attempt - 1)
  let delay = base * Math.pow(2, attempt - 1);

  // Cap at maxDelay
  delay = Math.min(delay, max);

  // Add jitter: ±random(0, delay * jitterFactor)
  if (jitter > 0) {
    const jitterAmount = delay * jitter * (2 * Math.random() - 1);
    delay = Math.max(0, delay + jitterAmount);
  }

  return Math.round(delay);
}

/**
 * Retry a function with exponential backoff
 */
export async function withBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<RetryResult<T>> {
  const maxAttempts = config.maxAttempts ?? 3;
  const signal = config.signal;

  let lastError: Error | unknown;
  let attempts = 0;
  const startTime = Date.now();

  while (attempts < maxAttempts) {
    attempts++;

    try {
      // Check for cancellation
      if (signal?.aborted) {
        throw new Error('Retry aborted via signal');
      }

      const result = await fn();

      // Success
      return {
        value: result,
        attempts,
        totalTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      lastError = error;

      // Determine if we should retry
      const isRetryable =
        config.shouldRetry?.(error) ?? shouldRetryByDefault(error);

      if (!isRetryable || attempts >= maxAttempts) {
        break;
      }

      // Calculate delay and wait
      const delay = calculateDelay(attempts, config);

      try {
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(resolve, delay);
          signal?.addEventListener('abort', () => {
            clearTimeout(timeout);
            reject(new Error('Retry aborted'));
          });
        });
      } catch (abortError) {
        throw new Error('Retry aborted during backoff');
      }
    }
  }

  // All attempts exhausted
  throw lastError;
}

/**
 * Default retry predicate: retry on network errors, timeouts, 5xx
 */
function shouldRetryByDefault(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Retry on network failures
    if (
      message.includes('econnreset') ||
      message.includes('etimedout') ||
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('eai_again') // DNS lookup failed
    ) {
      return true;
    }

    // Retry on timeout errors
    if (message.includes('timeout') || message.includes('abort')) {
      return true;
    }

    // Retry on 5xx HTTP errors (if error has status)
    if ((error as any).status >= 500) {
      return true;
    }
  }

  return false;
}

/**
 * Retry with custom predicate (e.g., only retry on specific error codes)
 */
export function withBackoffIf<T>(
  fn: () => Promise<T>,
  predicate: (error: Error | unknown) => boolean,
  config: RetryConfig = {}
): Promise<RetryResult<T>> {
  return withBackoff(fn, {
    ...config,
    shouldRetry: predicate,
  });
}

/**
 * Simple retry for sync functions
 */
export function retrySync<T>(
  fn: () => T,
  config: RetryConfig = {}
): RetryResult<T> {
  const maxAttempts = config.maxAttempts ?? 3;
  let attempts = 0;
  const startTime = Date.now();

  while (attempts < maxAttempts) {
    attempts++;
    try {
      return {
        value: fn(),
        attempts,
        totalTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      if (attempts >= maxAttempts || !(config.shouldRetry?.(error) ?? shouldRetryByDefault(error))) {
        throw error;
      }
      const delay = calculateDelay(attempts, config);
      // Synchronous delay (blocking, use only for quick retries)
      const start = Date.now();
      while (Date.now() - start < delay) {} // eslint-disable-line no-empty
    }
  }

  throw new Error('Unreachable');
}
