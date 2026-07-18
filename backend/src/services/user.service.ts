import { UserAchievement } from '../models/Achievement';
import { FocusSession } from '../models/FocusSession';
import { Goal } from '../models/Goal';
import { Habit, HabitLog } from '../models/Habit';
import { JournalEntry } from '../models/JournalEntry';
import { TrackerLog } from '../models/TrackerLog';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';

export interface UpdateMeInput {
  name?: string;
  avatarUrl?: string | null;
  timezone?: string;
  notificationPreferences?: Partial<{
    dailyReminder: boolean;
    streakAlerts: boolean;
    goalMilestones: boolean;
  }>;
  appearance?: Partial<{ colorScheme: 'light' | 'dark' | 'system' }>;
}

export async function updateMe(userId: string, input: UpdateMeInput) {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (input.name !== undefined) user.name = input.name;
  if (input.avatarUrl !== undefined) user.avatarUrl = input.avatarUrl;
  if (input.timezone !== undefined) user.timezone = input.timezone;
  if (input.notificationPreferences) {
    user.notificationPreferences = {
      ...user.notificationPreferences,
      ...input.notificationPreferences,
    } as typeof user.notificationPreferences;
  }
  if (input.appearance) {
    user.appearance = { ...user.appearance, ...input.appearance } as typeof user.appearance;
  }

  await user.save();
  return user;
}

export async function deleteAccount(userId: string) {
  await Promise.all([
    Habit.deleteMany({ userId }),
    HabitLog.deleteMany({ userId }),
    Goal.deleteMany({ userId }),
    JournalEntry.deleteMany({ userId }),
    TrackerLog.deleteMany({ userId }),
    FocusSession.deleteMany({ userId }),
    UserAchievement.deleteMany({ userId }),
  ]);
  await User.findByIdAndDelete(userId);
}
