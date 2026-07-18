import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync('mission365.db');
  }
  return dbInstance;
}

export async function initDb(): Promise<void> {
  const db = getDb();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      frequency_type TEXT NOT NULL,
      days_of_week TEXT NOT NULL,
      reminder_time TEXT,
      current_streak INTEGER NOT NULL DEFAULT 0,
      longest_streak INTEGER NOT NULL DEFAULT 0,
      is_archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      dirty INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS habit_logs (
      habit_id TEXT NOT NULL,
      date TEXT NOT NULL,
      completed INTEGER NOT NULL,
      completed_at TEXT,
      dirty INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (habit_id, date)
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      queue_id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      op TEXT NOT NULL,
      local_id TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}

/**
 * Wipes the local cache so a different account logging in on this device
 * doesn't see the previous user's habits. Skipped if there are unsynced
 * offline changes queued, to avoid silently losing data that hasn't made
 * it to the server yet — those will just linger in cache until synced.
 */
export async function clearLocalDataIfSynced(): Promise<void> {
  const db = getDb();
  const pending = await db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM sync_queue`);
  if (pending && pending.count > 0) return;

  await db.execAsync(`
    DELETE FROM habits;
    DELETE FROM habit_logs;
  `);
}
