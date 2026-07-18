import { TrackerLog, type TrackerKind } from '../models/TrackerLog';
import { ApiError } from '../utils/ApiError';
import { computeStreakFromDates, todayKey } from '../utils/date';
import { awardXp, checkAndUnlockAchievements, recordActivity } from './gamification.service';

const XP_PER_LOG = 10;

export interface CreateTrackerLogInput {
  kind: TrackerKind;
  value: number;
  unit?: string;
  date?: string;
  meta?: { workoutType?: string; sleepQuality?: string };
}

export async function createLog(userId: string, input: CreateTrackerLogInput) {
  const log = await TrackerLog.create({
    userId,
    kind: input.kind,
    value: input.value,
    unit: input.unit,
    date: input.date ?? todayKey(),
    meta: input.meta,
  });

  await recordActivity(userId);
  await awardXp(userId, XP_PER_LOG);
  const unlockedAchievements = await checkAndUnlockAchievements(userId);

  return { log, unlockedAchievements };
}

export async function listLogs(userId: string, kind?: TrackerKind, start?: string, end?: string) {
  const range = start && end ? { date: { $gte: start, $lte: end } } : {};
  return TrackerLog.find({ userId, ...(kind ? { kind } : {}), ...range }).sort({ date: -1, createdAt: -1 });
}

export async function deleteLog(userId: string, logId: string) {
  const log = await TrackerLog.findOne({ _id: logId, userId });
  if (!log) {
    throw ApiError.notFound('Tracker log not found');
  }
  await log.deleteOne();
}

export async function getDailySummary(userId: string, date: string = todayKey()) {
  const logs = await TrackerLog.find({ userId, date }).lean();

  const water = logs.filter((l) => l.kind === 'water').reduce((sum, l) => sum + l.value, 0);
  const workoutMinutes = logs.filter((l) => l.kind === 'workout').reduce((sum, l) => sum + l.value, 0);
  const sleepLog = logs.filter((l) => l.kind === 'sleep').at(-1);

  return {
    date,
    water,
    workoutMinutes,
    sleepHours: sleepLog?.value ?? null,
  };
}

export async function getWorkoutLogCount(userId: string): Promise<number> {
  return TrackerLog.countDocuments({ userId, kind: 'workout' });
}

export async function getWaterLogStreak(userId: string): Promise<number> {
  const logs = await TrackerLog.find({ userId, kind: 'water' }).select('date').lean();
  const dates = new Set(logs.map((l) => l.date));
  return computeStreakFromDates(dates, todayKey());
}
