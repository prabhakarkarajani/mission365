export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function subtractDays(dateKey: string, days: number): string {
  const d = new Date(`${dateKey}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return toDateKey(d);
}

export function isValidDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/**
 * Given a set of dates something happened on, count the consecutive-day
 * streak ending at `asOf` (inclusive), walking backward day by day.
 */
export function computeStreakFromDates(dateKeys: Iterable<string>, asOf: string): number {
  const set = new Set(dateKeys);
  let streak = 0;
  let cursor = asOf;

  while (set.has(cursor)) {
    streak += 1;
    cursor = subtractDays(cursor, 1);
  }

  return streak;
}
