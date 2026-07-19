import { FocusSession } from '../models/FocusSession';
import { Habit, HabitLog } from '../models/Habit';
import { JournalEntry, type Mood } from '../models/JournalEntry';
import { User } from '../models/User';
import { subtractDays, todayKey } from '../utils/date';

const MOOD_SCORE: Record<Mood, number> = {
  awful: 1,
  bad: 2,
  neutral: 3,
  good: 4,
  great: 5,
};

function lastNDays(days: number): string[] {
  const today = todayKey();
  return Array.from({ length: days }, (_, i) => subtractDays(today, days - 1 - i));
}

export async function getHabitCompletionSeries(userId: string, days = 7) {
  const dates = lastNDays(days);
  const totalHabits = await Habit.countDocuments({ userId, isArchived: false });

  const logs = await HabitLog.find({
    userId,
    date: { $gte: dates[0], $lte: dates[dates.length - 1] },
    completed: true,
  })
    .select('date')
    .lean();

  const countByDate = new Map<string, number>();
  for (const log of logs) {
    countByDate.set(log.date, (countByDate.get(log.date) ?? 0) + 1);
  }

  return dates.map((date) => {
    const completed = countByDate.get(date) ?? 0;
    return {
      date,
      completed,
      total: totalHabits,
      percent: totalHabits > 0 ? Math.round((completed / totalHabits) * 100) : 0,
    };
  });
}

export async function getMoodTrend(userId: string, days = 7) {
  const dates = lastNDays(days);
  const entries = await JournalEntry.find({
    userId,
    date: { $gte: dates[0], $lte: dates[dates.length - 1] },
  })
    .select('date mood')
    .lean();

  const scoresByDate = new Map<string, number[]>();
  for (const entry of entries) {
    const list = scoresByDate.get(entry.date) ?? [];
    list.push(MOOD_SCORE[entry.mood as Mood]);
    scoresByDate.set(entry.date, list);
  }

  return dates.map((date) => {
    const scores = scoresByDate.get(date);
    const avg = scores && scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
    return { date, moodScore: avg === null ? null : Math.round(avg * 10) / 10 };
  });
}

export async function getFocusMinutesSeries(userId: string, days = 7) {
  const dates = lastNDays(days);
  const sessions = await FocusSession.find({
    userId,
    type: 'focus',
    completed: true,
    startedAt: { $gte: new Date(`${dates[0]}T00:00:00.000Z`) },
  })
    .select('startedAt durationMinutes')
    .lean();

  const minutesByDate = new Map<string, number>();
  for (const session of sessions) {
    const key = session.startedAt.toISOString().slice(0, 10);
    minutesByDate.set(key, (minutesByDate.get(key) ?? 0) + session.durationMinutes);
  }

  return dates.map((date) => ({ date, minutes: minutesByDate.get(date) ?? 0 }));
}

export async function getSummary(userId: string, days = 7) {
  const user = await User.findById(userId);
  const [habitSeries, moodSeries, focusSeries] = await Promise.all([
    getHabitCompletionSeries(userId, days),
    getMoodTrend(userId, days),
    getFocusMinutesSeries(userId, days),
  ]);

  const weeklyHabitPercent =
    habitSeries.reduce((sum, d) => sum + d.percent, 0) / Math.max(habitSeries.length, 1);
  const totalFocusMinutes = focusSeries.reduce((sum, d) => sum + d.minutes, 0);

  return {
    level: user?.level ?? 1,
    xp: user?.xp ?? 0,
    currentStreak: user?.currentStreak ?? 0,
    longestStreak: user?.longestStreak ?? 0,
    weeklyHabitCompletionPercent: Math.round(weeklyHabitPercent),
    totalFocusMinutesThisWeek: totalFocusMinutes,
    habitCompletionSeries: habitSeries,
    moodTrendSeries: moodSeries,
    focusMinutesSeries: focusSeries,
  };
}
