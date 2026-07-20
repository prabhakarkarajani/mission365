// Runs before the test framework loads. Provides just enough env for
// `config/env.ts`'s zod validation to pass at import time. The real
// Mongo connection used in tests comes from mongodb-memory-server
// (see test/mongoMemory.ts), not this placeholder URI.
process.env.NODE_ENV ??= 'test';
process.env.MONGODB_URI ??= 'mongodb://placeholder-replaced-by-memory-server';
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret-do-not-use-in-prod';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-do-not-use-in-prod';
