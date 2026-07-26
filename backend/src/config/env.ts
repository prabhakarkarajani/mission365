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
