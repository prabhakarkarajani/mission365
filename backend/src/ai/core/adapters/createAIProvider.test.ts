const ORIGINAL_ENV = process.env;

/**
 * env.ts validates and throws as a side effect of being imported, so each
 * case needs a fresh module registry with process.env set beforehand - same
 * technique as backend/src/config/env.test.ts.
 */
function loadCreateAIProviderWith(overrides: Record<string, string | undefined>) {
  jest.resetModules();
  process.env = { ...ORIGINAL_ENV, ...overrides };
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('./createAIProvider') as typeof import('./createAIProvider');
}

describe('createAIProvider', () => {
  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('defaults to the mock provider when AI_PROVIDER is unset', () => {
    const { createAIProvider } = loadCreateAIProviderWith({ AI_PROVIDER: undefined });
    expect(createAIProvider().name).toBe('mock');
  });

  it('selects the openai provider when AI_PROVIDER=openai and a key is configured', () => {
    const { createAIProvider } = loadCreateAIProviderWith({
      AI_PROVIDER: 'openai',
      OPENAI_API_KEY: 'a-real-looking-test-key-value',
    });
    expect(createAIProvider().name).toBe('openai');
  });
});
