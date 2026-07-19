/**
 * Web has no SQLite offline-sync support (see habit.hooks.ts, which calls
 * the API directly on web instead). This stub exists only so modules that
 * statically import `getDb`/`initDb` (habit.local.ts, habit.sync.ts,
 * auth.store.ts) still bundle for web without pulling in expo-sqlite's
 * WASM worker, which Metro can't resolve for the web target.
 */
export function getDb(): never {
  throw new Error('SQLite is not available on web');
}

export async function initDb(): Promise<void> {}

export async function clearLocalDataIfSynced(): Promise<void> {}
