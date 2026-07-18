import { getDb } from '@/shared/lib/db';
import { subtractDays, todayKey } from '@/shared/lib/date';

import type { Habit, HabitCategory, HabitFrequencyType, HabitLogEntry, TodayMission } from '../domain/types';
import type { CreateHabitInput, UpdateHabitInput } from './habit.api';

interface HabitRow {
  id: string;
  name: string;
  category: string;
  icon: string;
  color: string;
  frequency_type: string;
  days_of_week: string;
  reminder_time: string | null;
  current_streak: number;
  longest_streak: number;
  is_archived: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  dirty: number;
}

export function generateLocalId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function isLocalId(id: string): boolean {
  return id.startsWith('local-');
}

function rowToHabit(row: HabitRow): Habit {
  return {
    _id: row.id,
    userId: '',
    name: row.name,
    category: row.category as HabitCategory,
    icon: row.icon,
    color: row.color,
    frequency: {
      type: row.frequency_type as HabitFrequencyType,
      daysOfWeek: JSON.parse(row.days_of_week) as number[],
    },
    reminderTime: row.reminder_time,
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    isArchived: row.is_archived === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getLocalHabits(includeArchived = false): Promise<Habit[]> {
  const db = getDb();
  const rows = await db.getAllAsync<HabitRow>(
    `SELECT * FROM habits WHERE deleted_at IS NULL ${includeArchived ? '' : 'AND is_archived = 0'} ORDER BY created_at ASC`
  );
  return rows.map(rowToHabit);
}

export async function getLocalTodayMissions(date: string = todayKey()): Promise<TodayMission[]> {
  const db = getDb();
  const habits = await getLocalHabits(false);
  const completedRows = await db.getAllAsync<{ habit_id: string }>(
    `SELECT habit_id FROM habit_logs WHERE date = ? AND completed = 1`,
    [date]
  );
  const completedIds = new Set(completedRows.map((r) => r.habit_id));
  return habits.map((habit) => ({ habit, completed: completedIds.has(habit._id) }));
}

async function recomputeStreak(habitId: string): Promise<number> {
  const db = getDb();
  const rows = await db.getAllAsync<{ date: string }>(
    `SELECT date FROM habit_logs WHERE habit_id = ? AND completed = 1`,
    [habitId]
  );
  const dates = new Set(rows.map((r) => r.date));
  let streak = 0;
  let cursor = todayKey();
  while (dates.has(cursor)) {
    streak += 1;
    cursor = subtractDays(cursor, 1);
  }
  return streak;
}

async function enqueueSync(entityType: 'habit' | 'habit_log', op: string, localId: string, payload: unknown) {
  const db = getDb();
  await db.runAsync(
    `INSERT INTO sync_queue (entity_type, op, local_id, payload, created_at) VALUES (?, ?, ?, ?, ?)`,
    [entityType, op, localId, JSON.stringify(payload), new Date().toISOString()]
  );
}

export async function createHabitLocal(input: CreateHabitInput): Promise<Habit> {
  const db = getDb();
  const id = generateLocalId();
  const now = new Date().toISOString();
  const category = input.category ?? 'other';
  const icon = input.icon ?? 'checkmark-circle-outline';
  const color = input.color ?? '#6366F1';
  const frequencyType = input.frequency?.type ?? 'daily';
  const daysOfWeek = input.frequency?.daysOfWeek ?? [];

  await db.runAsync(
    `INSERT INTO habits (id, name, category, icon, color, frequency_type, days_of_week, reminder_time, current_streak, longest_streak, is_archived, created_at, updated_at, deleted_at, dirty)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?, ?, NULL, 1)`,
    [id, input.name, category, icon, color, frequencyType, JSON.stringify(daysOfWeek), input.reminderTime ?? null, now, now]
  );

  await enqueueSync('habit', 'create', id, { ...input, localId: id });

  return rowToHabit({
    id,
    name: input.name,
    category,
    icon,
    color,
    frequency_type: frequencyType,
    days_of_week: JSON.stringify(daysOfWeek),
    reminder_time: input.reminderTime ?? null,
    current_streak: 0,
    longest_streak: 0,
    is_archived: 0,
    created_at: now,
    updated_at: now,
    deleted_at: null,
    dirty: 1,
  });
}

export async function updateHabitLocal(habitId: string, input: UpdateHabitInput): Promise<void> {
  const db = getDb();
  const now = new Date().toISOString();
  const fields: string[] = [];
  const values: unknown[] = [];

  if (input.name !== undefined) {
    fields.push('name = ?');
    values.push(input.name);
  }
  if (input.category !== undefined) {
    fields.push('category = ?');
    values.push(input.category);
  }
  if (input.icon !== undefined) {
    fields.push('icon = ?');
    values.push(input.icon);
  }
  if (input.color !== undefined) {
    fields.push('color = ?');
    values.push(input.color);
  }
  if (input.reminderTime !== undefined) {
    fields.push('reminder_time = ?');
    values.push(input.reminderTime);
  }
  if (input.frequency?.type !== undefined) {
    fields.push('frequency_type = ?');
    values.push(input.frequency.type);
  }
  if (input.frequency?.daysOfWeek !== undefined) {
    fields.push('days_of_week = ?');
    values.push(JSON.stringify(input.frequency.daysOfWeek));
  }

  fields.push('updated_at = ?', 'dirty = 1');
  values.push(now, habitId);

  await db.runAsync(`UPDATE habits SET ${fields.join(', ')} WHERE id = ?`, values as (string | number | null)[]);
  await enqueueSync('habit', 'update', habitId, input);
}

export async function archiveHabitLocal(habitId: string): Promise<void> {
  const db = getDb();
  await db.runAsync(`UPDATE habits SET is_archived = 1, dirty = 1, updated_at = ? WHERE id = ?`, [
    new Date().toISOString(),
    habitId,
  ]);
  await enqueueSync('habit', 'archive', habitId, {});
}

export async function deleteHabitLocal(habitId: string): Promise<void> {
  const db = getDb();
  await db.runAsync(`UPDATE habits SET deleted_at = ?, dirty = 1 WHERE id = ?`, [new Date().toISOString(), habitId]);
  await enqueueSync('habit', 'delete', habitId, {});
}

export async function setCompletionLocal(
  habitId: string,
  date: string,
  completed: boolean
): Promise<{ habit: Habit | null }> {
  const db = getDb();
  if (completed) {
    await db.runAsync(
      `INSERT INTO habit_logs (habit_id, date, completed, completed_at, dirty) VALUES (?, ?, 1, ?, 1)
       ON CONFLICT(habit_id, date) DO UPDATE SET completed = 1, completed_at = excluded.completed_at, dirty = 1`,
      [habitId, date, new Date().toISOString()]
    );
  } else {
    await db.runAsync(
      `INSERT INTO habit_logs (habit_id, date, completed, completed_at, dirty) VALUES (?, ?, 0, NULL, 1)
       ON CONFLICT(habit_id, date) DO UPDATE SET completed = 0, completed_at = NULL, dirty = 1`,
      [habitId, date]
    );
  }

  const streak = await recomputeStreak(habitId);
  await db.runAsync(
    `UPDATE habits SET current_streak = ?, longest_streak = MAX(longest_streak, ?), updated_at = ? WHERE id = ?`,
    [streak, streak, new Date().toISOString(), habitId]
  );

  await enqueueSync('habit_log', 'complete', habitId, { habitId, date, completed });

  const row = await db.getFirstAsync<HabitRow>(`SELECT * FROM habits WHERE id = ?`, [habitId]);
  return { habit: row ? rowToHabit(row) : null };
}

export async function getLocalHabitLogsForHabit(habitId: string): Promise<HabitLogEntry[]> {
  const db = getDb();
  const rows = await db.getAllAsync<{ habit_id: string; date: string; completed_at: string | null }>(
    `SELECT habit_id, date, completed_at FROM habit_logs WHERE habit_id = ? AND completed = 1`,
    [habitId]
  );
  return rows.map((r) => ({ habitId: r.habit_id, date: r.date, completedAt: r.completed_at }));
}
