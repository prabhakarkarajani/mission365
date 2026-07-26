import { logAICall } from './aiLogger';

export interface RetryOptions {
  provider: string;
  operation: string;
  timeoutMs: number;
  /** Number of retries after the first attempt. Default 2 (3 attempts total). */
  maxRetries?: number;
  isRetryable?: (error: unknown) => boolean;
}

/**
 * Retryable only for transient failures - network errors, timeouts, and
 * HTTP 429/5xx. 400-class errors (bad request, invalid key) fail fast:
 * retrying a request the vendor has already rejected as malformed wastes
 * time and does not change the outcome.
 */
function defaultIsRetryable(error: unknown): boolean {
  if (error instanceof Error && error.name === 'AbortError') return true;
  if (error instanceof TypeError) return true; // fetch-level network failure
  const status = (error as { status?: number } | null)?.status;
  return typeof status === 'number' && (status === 429 || status >= 500);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const BACKOFF_SCHEDULE_MS = [500, 1500];

/**
 * Wraps a single vendor call with a timeout (via AbortSignal, passed through
 * to `fn` so SDKs that support cancellation actually stop the in-flight
 * request) and bounded retry-with-backoff. Every attempt is logged via
 * aiLogger (metadata only, never prompt/response content).
 */
export async function withRetry<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const { provider, operation, timeoutMs, maxRetries = 2, isRetryable = defaultIsRetryable } = options;

  for (let attempt = 1; ; attempt++) {
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);
    const start = Date.now();

    try {
      const result = await fn(controller.signal);
      logAICall({ provider, operation, attempt, latencyMs: Date.now() - start, outcome: 'success' });
      return result;
    } catch (error) {
      logAICall({
        provider,
        operation,
        attempt,
        latencyMs: Date.now() - start,
        outcome: 'failure',
        errorClass: error instanceof Error ? error.name : typeof error,
      });

      const canRetry = attempt <= maxRetries && isRetryable(error);
      if (!canRetry) throw error;

      await sleep(BACKOFF_SCHEDULE_MS[attempt - 1] ?? BACKOFF_SCHEDULE_MS[BACKOFF_SCHEDULE_MS.length - 1]);
    } finally {
      clearTimeout(timeoutHandle);
    }
  }
}
