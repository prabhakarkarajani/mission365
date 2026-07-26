const BASE_ENV = {
  NODE_ENV: 'test',
  MONGODB_URI: 'mongodb://127.0.0.1:27017/mission365-env-test',
  JWT_ACCESS_SECRET: 'a-real-generated-access-secret-value',
  JWT_REFRESH_SECRET: 'a-real-generated-refresh-secret-value',
};

/**
 * env.ts validates and throws as a side effect of being imported, so each
 * case needs a fresh module registry with process.env set beforehand -
 * `jest.isolateModules` gives that without leaking env/module state
 * between cases (unlike mutating the one shared `process.env` and
 * `require`-ing the already-cached module).
 */
function loadEnvWith(overrides: Record<string, string | undefined>): () => void {
  const previousEnv = { ...process.env };
  Object.keys(process.env).forEach((key) => {
    if (key in BASE_ENV || key in overrides) delete process.env[key];
  });
  Object.assign(process.env, BASE_ENV, overrides);

  let thrown: unknown;
  jest.isolateModules(() => {
    try {
      // require(), not import - jest.isolateModules only re-runs a fresh
      // copy of the module (including env.ts's top-level validate-or-throw)
      // for a synchronous CJS require from within its callback.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('./env');
    } catch (err) {
      thrown = err;
    }
  });

  process.env = previousEnv;

  if (thrown) throw thrown;
  return () => undefined;
}

describe('env validation', () => {
  // env.ts intentionally console.errors on invalid config (useful in real
  // startup logs) - silenced here so expected-failure cases don't spam
  // the test run's output.
  let errorSpy: jest.SpyInstance;
  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('accepts a valid non-production configuration', () => {
    expect(() => loadEnvWith({})).not.toThrow();
  });

  it('accepts a valid production configuration with a real CORS origin', () => {
    expect(() =>
      loadEnvWith({ NODE_ENV: 'production', CORS_ORIGIN: 'https://mission365.app' })
    ).not.toThrow();
  });

  it('rejects a missing MONGODB_URI in any environment', () => {
    expect(() => loadEnvWith({ MONGODB_URI: '' })).toThrow();
  });

  it('rejects a MONGODB_URI that is not a mongodb connection string', () => {
    expect(() => loadEnvWith({ MONGODB_URI: 'postgres://localhost/db' })).toThrow();
  });

  it('rejects a JWT_ACCESS_SECRET shorter than 16 characters', () => {
    expect(() => loadEnvWith({ JWT_ACCESS_SECRET: 'too-short' })).toThrow();
  });

  it('rejects identical access and refresh secrets, even outside production', () => {
    expect(() =>
      loadEnvWith({ JWT_ACCESS_SECRET: 'the-exact-same-secret-value', JWT_REFRESH_SECRET: 'the-exact-same-secret-value' })
    ).toThrow();
  });

  it('allows CORS_ORIGIN to default to "*" outside production', () => {
    expect(() => loadEnvWith({ NODE_ENV: 'development', CORS_ORIGIN: undefined })).not.toThrow();
  });

  it('rejects CORS_ORIGIN defaulting to "*" in production', () => {
    expect(() => loadEnvWith({ NODE_ENV: 'production', CORS_ORIGIN: undefined })).toThrow();
  });

  it('rejects CORS_ORIGIN explicitly set to "*" in production', () => {
    expect(() => loadEnvWith({ NODE_ENV: 'production', CORS_ORIGIN: '*' })).toThrow();
  });

  it('rejects an empty CORS_ORIGIN in any environment', () => {
    expect(() => loadEnvWith({ CORS_ORIGIN: '' })).toThrow();
  });

  it.each(['replace-with-a-long-random-secret', 'CHANGE-ME-please', 'your-secret-here', 'example-secret-value'])(
    'rejects a placeholder-looking JWT secret in production: "%s"',
    (placeholder) => {
      expect(() =>
        loadEnvWith({
          NODE_ENV: 'production',
          CORS_ORIGIN: 'https://mission365.app',
          JWT_ACCESS_SECRET: placeholder,
          JWT_REFRESH_SECRET: 'a-completely-different-real-secret-value',
        })
      ).toThrow();
    }
  );

  it('allows the same placeholder-looking string outside production (dev/test ergonomics preserved)', () => {
    expect(() =>
      loadEnvWith({ NODE_ENV: 'development', JWT_ACCESS_SECRET: 'replace-with-a-long-random-secret-000000' })
    ).not.toThrow();
  });

  it('allows AI_PROVIDER to default to mock with no vendor key set', () => {
    expect(() => loadEnvWith({ AI_PROVIDER: undefined, OPENAI_API_KEY: undefined })).not.toThrow();
  });

  it('rejects AI_PROVIDER=openai with no OPENAI_API_KEY, in any environment', () => {
    expect(() => loadEnvWith({ AI_PROVIDER: 'openai', OPENAI_API_KEY: undefined })).toThrow();
  });

  it('accepts AI_PROVIDER=openai when OPENAI_API_KEY is set', () => {
    expect(() =>
      loadEnvWith({ AI_PROVIDER: 'openai', OPENAI_API_KEY: 'a-real-generated-openai-key' })
    ).not.toThrow();
  });

  it('rejects a placeholder-looking OPENAI_API_KEY in production when AI_PROVIDER=openai', () => {
    expect(() =>
      loadEnvWith({
        NODE_ENV: 'production',
        CORS_ORIGIN: 'https://mission365.app',
        AI_PROVIDER: 'openai',
        OPENAI_API_KEY: 'replace-with-your-openai-key',
      })
    ).toThrow();
  });

  it('allows a placeholder-looking OPENAI_API_KEY outside production', () => {
    expect(() =>
      loadEnvWith({ NODE_ENV: 'development', AI_PROVIDER: 'openai', OPENAI_API_KEY: 'replace-with-your-openai-key' })
    ).not.toThrow();
  });
});
