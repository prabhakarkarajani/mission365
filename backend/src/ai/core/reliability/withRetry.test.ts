import { withRetry } from './withRetry';

function networkError(): TypeError {
  return new TypeError('fetch failed');
}

function httpError(status: number): Error & { status: number } {
  const error = new Error(`HTTP ${status}`) as Error & { status: number };
  error.status = status;
  return error;
}

describe('withRetry', () => {
  it('returns the result on first success, with no retries', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    const result = await withRetry(fn, { provider: 'test', operation: 'chat', timeoutMs: 1000 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries a retryable failure (5xx) and eventually succeeds', async () => {
    const fn = jest.fn().mockRejectedValueOnce(httpError(503)).mockResolvedValueOnce('recovered');
    const result = await withRetry(fn, { provider: 'test', operation: 'chat', timeoutMs: 1000 });
    expect(result).toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('retries a network error up to maxRetries, then throws', async () => {
    const fn = jest.fn().mockRejectedValue(networkError());
    await expect(withRetry(fn, { provider: 'test', operation: 'chat', timeoutMs: 1000, maxRetries: 2 })).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  });

  it('does not retry a non-retryable 400-class error - fails fast', async () => {
    const fn = jest.fn().mockRejectedValue(httpError(400));
    await expect(withRetry(fn, { provider: 'test', operation: 'chat', timeoutMs: 1000 })).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries a 429 (rate limit) as a transient failure', async () => {
    const fn = jest.fn().mockRejectedValueOnce(httpError(429)).mockResolvedValueOnce('ok-after-rate-limit');
    const result = await withRetry(fn, { provider: 'test', operation: 'chat', timeoutMs: 1000 });
    expect(result).toBe('ok-after-rate-limit');
  });

  it('respects a custom isRetryable predicate', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('custom-domain-error'));
    await expect(
      withRetry(fn, { provider: 'test', operation: 'chat', timeoutMs: 1000, isRetryable: () => false })
    ).rejects.toThrow('custom-domain-error');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('passes an AbortSignal through to the wrapped function', async () => {
    const fn = jest.fn(async (signal: AbortSignal) => {
      expect(signal).toBeInstanceOf(AbortSignal);
      return 'ok';
    });
    await withRetry(fn, { provider: 'test', operation: 'chat', timeoutMs: 1000 });
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
