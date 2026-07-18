import { getDb } from '@/shared/lib/db';
import { todayKey } from '@/shared/lib/date';
import { ApiClientError } from '@/shared/lib/api-client';
import { queryClient } from '@/shared/lib/query-client';
import { useAchievementToastStore } from '@/features/gamification/application/achievement-toast.store';

import * as habitApi from './habit.api';
import type { CreateHabitInput, UpdateHabitInput } from './habit.api';

interface SyncQueueRow {
  queue_id: number;
  entity_type: 'habit' | 'habit_log';
  op: string;
  local_id: string;
  payload: string;
  created_at: string;
}

let syncInFlight = false;

async function remapHabitId(oldId: string, newId: string): Promise<void> {
  const db = getDb();
  await db.runAsync(`UPDATE habits SET id = ?, dirty = 0 WHERE id = ?`, [newId, oldId]);
  await db.runAsync(`UPDATE habit_logs SET habit_id = ? WHERE habit_id = ?`, [newId, oldId]);
  await db.runAsync(`UPDATE sync_queue SET local_id = ? WHERE local_id = ?`, [newId, oldId]);
}

async function processQueueItem(item: SyncQueueRow): Promise<void> {
  const db = getDb();
  const payload = JSON.parse(item.payload) as Record<string, unknown>;

  try {
    if (item.entity_type === 'habit' && item.op === 'create') {
      const { localId: _localId, ...input } = payload as unknown as CreateHabitInput & { localId: string };
      const { habit } = await habitApi.createHabit(input);
      await remapHabitId(item.local_id, habit._id);
      return;
    }

    if (item.entity_type === 'habit' && item.op === 'update') {
      await habitApi.updateHabit(item.local_id, payload as UpdateHabitInput);
      await db.runAsync(`UPDATE habits SET dirty = 0 WHERE id = ?`, [item.local_id]);
      return;
    }

    if (item.entity_type === 'habit' && item.op === 'archive') {
      await habitApi.archiveHabit(item.local_id);
      await db.runAsync(`UPDATE habits SET dirty = 0 WHERE id = ?`, [item.local_id]);
      return;
    }

    if (item.entity_type === 'habit' && item.op === 'delete') {
      await habitApi.deleteHabit(item.local_id);
      await db.runAsync(`DELETE FROM habits WHERE id = ?`, [item.local_id]);
      await db.runAsync(`DELETE FROM habit_logs WHERE habit_id = ?`, [item.local_id]);
      return;
    }

    if (item.entity_type === 'habit_log' && item.op === 'complete') {
      const { date, completed } = payload as { date: string; completed: boolean };
      const result = await habitApi.setHabitCompletion(item.local_id, date, completed);
      await db.runAsync(`UPDATE habit_logs SET dirty = 0 WHERE habit_id = ? AND date = ?`, [item.local_id, date]);
      if (result.unlockedAchievements.length > 0) {
        useAchievementToastStore.getState().push(result.unlockedAchievements);
        queryClient.invalidateQueries({ queryKey: ['achievements'] });
      }
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      return;
    }
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) {
      // Habit no longer exists server-side (deleted elsewhere) — drop the stale op.
      return;
    }
    throw error;
  }
}

async function pushQueue(): Promise<boolean> {
  const db = getDb();

  while (true) {
    const items = await db.getAllAsync<SyncQueueRow>(`SELECT * FROM sync_queue ORDER BY queue_id ASC LIMIT 1`);
    const item = items[0];
    if (!item) return true;

    try {
      await processQueueItem(item);
      await db.runAsync(`DELETE FROM sync_queue WHERE queue_id = ?`, [item.queue_id]);
    } catch {
      // Network or server error — stop here, preserve order, retry on next sync trigger.
      return false;
    }
  }
}

async function pullFromServer(): Promise<void> {
  const db = getDb();
  const { habits } = await habitApi.listHabits();

  for (const habit of habits) {
    await db.runAsync(
      `INSERT INTO habits (id, name, category, icon, color, frequency_type, days_of_week, reminder_time, current_streak, longest_streak, is_archived, created_at, updated_at, deleted_at, dirty)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 0)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name, category = excluded.category, icon = excluded.icon, color = excluded.color,
         frequency_type = excluded.frequency_type, days_of_week = excluded.days_of_week,
         reminder_time = excluded.reminder_time, current_streak = excluded.current_streak,
         longest_streak = excluded.longest_streak, is_archived = excluded.is_archived,
         updated_at = excluded.updated_at, deleted_at = NULL, dirty = 0`,
      [
        habit._id,
        habit.name,
        habit.category,
        habit.icon,
        habit.color,
        habit.frequency.type,
        JSON.stringify(habit.frequency.daysOfWeek),
        habit.reminderTime,
        habit.currentStreak,
        habit.longestStreak,
        habit.isArchived ? 1 : 0,
        habit.createdAt,
        habit.updatedAt,
      ]
    );
  }

  const serverIds = new Set(habits.map((h) => h._id));
  const localRows = await db.getAllAsync<{ id: string }>(`SELECT id FROM habits`);
  for (const row of localRows) {
    if (!row.id.startsWith('local-') && !serverIds.has(row.id)) {
      await db.runAsync(`DELETE FROM habits WHERE id = ?`, [row.id]);
      await db.runAsync(`DELETE FROM habit_logs WHERE habit_id = ?`, [row.id]);
    }
  }

  const today = todayKey();
  const { missions } = await habitApi.getTodayMissions();
  for (const mission of missions) {
    if (!mission.completed) continue;
    await db.runAsync(
      `INSERT INTO habit_logs (habit_id, date, completed, completed_at, dirty) VALUES (?, ?, 1, ?, 0)
       ON CONFLICT(habit_id, date) DO UPDATE SET completed = 1, dirty = 0`,
      [mission.habit._id, today, new Date().toISOString()]
    );
  }
}

export async function runSync(): Promise<void> {
  if (syncInFlight) return;
  syncInFlight = true;
  try {
    const drained = await pushQueue();
    if (drained) {
      await pullFromServer();
    }
  } catch {
    // Best-effort background sync — will retry on the next connectivity/foreground trigger.
  } finally {
    syncInFlight = false;
  }
}
