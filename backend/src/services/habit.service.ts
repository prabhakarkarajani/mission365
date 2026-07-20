import { Habit, HabitLog } from '../models/Habit';
import { ApiError } from '../utils/ApiError';
import { computeStreakFromDates, todayKey } from '../utils/date';
import { awardXp, checkAndUnlockAchievements, recordActivity } from './gamification.service';

const XP_PER_COMPLETION = 10;

export interface CreateHabitInput {
  name: string;
  category?: string;
  icon?: string;
  color?: string;
  frequency?: { type?: string; daysOfWeek?: number[] };
  reminderTime?: string | null;
}

export async function listHabits(userId: string, includeArchived = false) {
  return Habit.find({ userId, ...(includeArchived ? {} : { isArchived: false }) }).sort({
    createdAt: 1,
  });
}

async function findOwnedHabit(userId: string, habitId: string) {
  const habit = await Habit.findOne({ _id: habitId, userId });
  if (!habit) {
    throw ApiError.notFound('Habit not found');
  }
  return habit;
}

export async function createHabit(userId: string, input: CreateHabitInput) {
  return Habit.create({
    userId,
    name: input.name,
    category: input.category,
    icon: input.icon,
    color: input.color,
    frequency: input.frequency,
    reminderTime: input.reminderTime ?? null,
  });
}

export async function updateHabit(userId: string, habitId: string, input: Partial<CreateHabitInput>) {
  const habit = await findOwnedHabit(userId, habitId);
  Object.assign(habit, input);
  await habit.save();
  return habit;
}

export async function archiveHabit(userId: string, habitId: string) {
  const habit = await findOwnedHabit(userId, habitId);
  habit.isArchived = true;
  await habit.save();
  return habit;
}

export async function deleteHabit(userId: string, habitId: string) {
  const habit = await findOwnedHabit(userId, habitId);
  await HabitLog.deleteMany({ habitId: habit.id });
  await habit.deleteOne();
}

export async function setHabitCompletion(
  userId: string,
  habitId: string,
  date: string,
  completed: boolean
) {
  const habit = await findOwnedHabit(userId, habitId);

  if (completed) {
    await HabitLog.updateOne(
      { habitId: habit.id, date },
      { $set: { completed: true, completedAt: new Date(), skipped: false, userId } },
      { upsert: true }
    );
  } else {
    await HabitLog.deleteOne({ habitId: habit.id, date });
  }

  const logs = await HabitLog.find({ habitId: habit.id, completed: true }).select('date').lean();
  const streak = computeStreakFromDates(
    logs.map((l) => l.date),
    todayKey()
  );

  habit.currentStreak = streak;
  habit.longestStreak = Math.max(habit.longestStreak, streak);
  await habit.save();

  let unlockedAchievements: Awaited<ReturnType<typeof checkAndUnlockAchievements>> = [];

  if (completed) {
    await recordActivity(userId);
    await awardXp(userId, XP_PER_COMPLETION);
    unlockedAchievements = await checkAndUnlockAchievements(userId);
  }

  return { habit, unlockedAchievements };
}

export async function setHabitSkip(userId: string, habitId: string, date: string, skipped: boolean) {
  const habit = await findOwnedHabit(userId, habitId);

  if (skipped) {
    await HabitLog.updateOne(
      { habitId: habit.id, date },
      { $set: { completed: false, completedAt: null, skipped: true, userId } },
      { upsert: true }
    );
  } else {
    await HabitLog.deleteOne({ habitId: habit.id, date, skipped: true });
  }

  return habit;
}

export async function getTodayOverview(userId: string, date: string = todayKey()) {
  const habits = await Habit.find({ userId, isArchived: false }).sort({ createdAt: 1 });
  const logs = await HabitLog.find({ userId, date }).select('habitId completed skipped').lean();
  const logByHabit = new Map(logs.map((l) => [l.habitId.toString(), l]));

  return habits.map((habit) => {
    const log = logByHabit.get(habit.id);
    return {
      habit,
      completed: log?.completed ?? false,
      skipped: log?.skipped ?? false,
    };
  });
}

export async function getHabitLogsInRange(userId: string, startDate: string, endDate: string) {
  return HabitLog.find({
    userId,
    date: { $gte: startDate, $lte: endDate },
    completed: true,
  })
    .select('habitId date completedAt')
    .lean();
}
