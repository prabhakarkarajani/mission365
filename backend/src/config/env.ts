import 'dotenv/config';
import { z } from 'zod';

// Values copied verbatim from a placeholder/example file are a real,
// recurring way production configs end up unsafe by accident - reject them
// outright in production rather than trusting that whoever deployed
// remembered to replace every line of `.env.example`.
const PLACEHOLDER_SECRET_MARKERS = ['replace-with', 'change-me', 'your-secret', 'example'];

function looksLikePlaceholder(secret: string): boolean {
  const lower = secret.toLowerCase();
  return PLACEHOLDER_SECRET_MARKERS.some((marker) => lower.includes(marker));
}

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().default(4000),
    MONGODB_URI: z
      .string()
      .min(1, 'MONGODB_URI is required')
      .regex(/^mongodb(\+srv)?:\/\//, 'MONGODB_URI must start with mongodb:// or mongodb+srv://'),
    JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 characters'),
    JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
    // No hard default removed here on purpose - '*' is still the right
    // default for local development ergonomics. The .superRefine below is
    // what stops it from ever reaching production silently.
    CORS_ORIGIN: z.string().min(1, 'CORS_ORIGIN must not be empty').default('*'),

    // Which AI vendor the Coach feature (Maya) calls. Defaults to "mock" -
    // the server works out of the box with no AI vendor configured, using a
    // deterministic canned-response provider (see backend/src/ai/providers/
    // mock) - this is also what CI always uses (see test/setupEnv.ts),
    // never a real vendor. Widened as more providers are implemented.
    AI_PROVIDER: z.enum(['mock', 'openai']).default('mock'),
    // Required only when AI_PROVIDER=openai (checked below).
    OPENAI_API_KEY: z.string().optional(),
    OPENAI_MODEL: z.string().default('gpt-4o-mini'),
    // Per-request timeout for any AI vendor call, in milliseconds.
    AI_REQUEST_TIMEOUT_MS: z.coerce.number().default(20_000),
  })
  .superRefine((data, ctx) => {
    // Secrets that must never collide, in every environment - not a
    // production-only rule, since dev/test accidentally sharing a secret
    // is still a real bug (e.g. a leaked access token would also be a
    // valid refresh token).
    if (data.JWT_ACCESS_SECRET === data.JWT_REFRESH_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_REFRESH_SECRET'],
        message: 'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must not be identical.',
      });
    }

    if (data.NODE_ENV !== 'production') return;

    if (data.CORS_ORIGIN === '*') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['CORS_ORIGIN'],
        message: 'CORS_ORIGIN must be explicitly set to a real origin in production - "*" is not allowed.',
      });
    }

    if (looksLikePlaceholder(data.JWT_ACCESS_SECRET)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_ACCESS_SECRET'],
        message: 'JWT_ACCESS_SECRET looks like a placeholder value - set a real generated secret in production.',
      });
    }

    if (looksLikePlaceholder(data.JWT_REFRESH_SECRET)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_REFRESH_SECRET'],
        message: 'JWT_REFRESH_SECRET looks like a placeholder value - set a real generated secret in production.',
      });
    }
  })
  .superRefine((data, ctx) => {
    // A missing key for the *currently selected* AI provider is a real
    // misconfiguration in every environment, not just production - the
    // server would fail on the very first Coach request otherwise. Checked
    // separately from the production-only block above since this applies
    // everywhere.
    if (data.AI_PROVIDER === 'openai' && !data.OPENAI_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['OPENAI_API_KEY'],
        message: 'OPENAI_API_KEY is required when AI_PROVIDER=openai.',
      });
    }

    if (data.NODE_ENV !== 'production') return;

    if (data.OPENAI_API_KEY && looksLikePlaceholder(data.OPENAI_API_KEY)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['OPENAI_API_KEY'],
        message: 'OPENAI_API_KEY looks like a placeholder value - set a real key in production.',
      });
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Thrown synchronously at import time - server.ts imports `env` (via
  // app.ts) before connecting to Mongo or calling app.listen(), so invalid
  // config crashes the process immediately and never opens a port,
  // rather than running with an unsafe fallback.
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration');
}

export const env = parsed.data;
