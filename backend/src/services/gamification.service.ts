import { Habit } from '../models/Habit';
import { Goal } from '../models/Goal';
import { JournalEntry } from '../models/JournalEntry';
import { TrackerLog } from '../models/TrackerLog';
import { FocusSession } from '../models/FocusSession';
import { Achievement, UserAchievement, type AchievementMetric } from '../models/Achievement';
import { User } from '../models/User';
import { computeStreakFromDates, todayKey } from '../utils/date';

/**
 * Achievement catalog. `computeUserStats` below only populates the metrics
 * it can currently compute — as new modules (journal, trackers, focus,
 * goals) land, their metrics are added there and these achievements start
 * unlocking automatically (the unlock loop is metric-name generic).
 */
const ACHIEVEMENT_CATALOG: Array<{
  key: string;
  title: string;
  description: string;
  icon: string;
  metric: AchievementMetric;
  threshold: number;
  xpReward: number;
}> = [
  {
    key: 'first_step',
    title: 'First Step',
    description: 'Complete your first habit',
    icon: 'footsteps-outline',
    metric: 'habit_completions',
    threshold: 1,
    xpReward: 25,
  },
  {
    key: 'early_bird',
    title: 'Early Bird',
    description: 'Maintain a 7-day streak on a habit',
    icon: 'sunny-outline',
    metric: 'max_habit_streak',
    threshold: 7,
    xpReward: 75,
  },
  {
    key: 'consistency_king',
    title: 'Consistency King',
    description: 'Maintain a 10-day streak on a habit',
    icon: 'flame-outline',
    metric: 'max_habit_streak',
    threshold: 10,
    xpReward: 100,
  },
  {
    key: 'habit_master',
    title: 'Habit Master',
    description: 'Maintain a 30-day streak on a habit',
    icon: 'trophy-outline',
    metric: 'max_habit_streak',
    threshold: 30,
    xpReward: 300,
  },
  {
    key: 'journal_enthusiast',
    title: 'Journal Enthusiast',
    description: 'Write 10 journal entries',
    icon: 'book-outline',
    metric: 'journal_entry_count',
    threshold: 10,
    xpReward: 75,
  },
  {
    key: 'reflective_mind',
    title: 'Reflective Mind',
    description: 'Write 30 journal entries',
    icon: 'library-outline',
    metric: 'journal_entry_count',
    threshold: 30,
    xpReward: 200,
  },
  {
    key: 'fitness_enthusiast',
    title: 'Fitness Enthusiast',
    description: 'Log 20 workouts',
    icon: 'barbell-outline',
    metric: 'workout_log_count',
    threshold: 20,
    xpReward: 150,
  },
  {
    key: 'hydration_hero',
    title: 'Hydration Hero',
    description: 'Log water intake 7 days in a row',
    icon: 'water-outline',
    metric: 'water_log_streak',
    threshold: 7,
    xpReward: 75,
  },
  {
    key: 'focused_mind',
    title: 'Focused Mind',
    description: 'Complete 10 focus sessions',
    icon: 'timer-outline',
    metric: 'focus_session_count',
    threshold: 10,
    xpReward: 100,
  },
  {
    key: 'goal_getter',
    title: 'Goal Getter',
    description: 'Complete your first goal',
    icon: 'flag-outline',
    metric: 'goals_completed_count',
    threshold: 1,
    xpReward: 100,
  },
  {
    key: 'rising_star',
    title: 'Rising Star',
    description: 'Reach level 5',
    icon: 'star-outline',
    metric: 'level',
    threshold: 5,
    xpReward: 0,
  },
  {
    key: 'century_club',
    title: 'Century Club',
    description: 'Earn 1000 total XP',
    icon: 'ribbon-outline',
    metric: 'xp',
    threshold: 1000,
    xpReward: 0,
  },
];

export async function seedAchievements(): Promise<void> {
  for (const achievement of ACHIEVEMENT_CATALOG) {
    await Achievement.updateOne(
      { key: achievement.key },
      { $setOnInsert: achievement },
      { upsert: true }
    );
  }
}

function levelForXp(xp: number): number {
  return Math.floor(xp / 500) + 1;
}

export async function awardXp(userId: string, amount: number): Promise<void> {
  const user = await User.findById(userId);
  if (!user) return;

  user.xp += amount;
  user.level = levelForXp(user.xp);
  await user.save();
}

export async function recordActivity(userId: string): Promise<void> {
  const user = await User.findById(userId);
  if (!user) return;

  const today = todayKey();
  const lastActive = user.lastActiveDate ? user.lastActiveDate.toISOString().slice(0, 10) : null;

  if (lastActive === today) {
    return;
  }

  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);

  user.currentStreak = lastActive === yesterdayKey ? user.currentStreak + 1 : 1;
  user.longestStreak = Math.max(user.longestStreak, user.currentStreak);
  user.lastActiveDate = new Date();
  await user.save();
}

export interface UserStats extends Partial<Record<AchievementMetric, number>> {
  xp: number;
  level: number;
  max_habit_streak: number;
  habit_completions: number;
}

export async function computeUserStats(userId: string): Promise<UserStats> {
  const user = await User.findById(userId);
  const habits = await Habit.find({ userId }).lean();
  const goalsCompletedCount = await Goal.countDocuments({ userId, status: 'completed' });
  const journalEntryCount = await JournalEntry.countDocuments({ userId });
  const workoutLogCount = await TrackerLog.countDocuments({ userId, kind: 'workout' });
  const focusSessionCount = await FocusSession.countDocuments({ userId, type: 'focus', completed: true });
  const waterLogs = await TrackerLog.find({ userId, kind: 'water' }).select('date').lean();
  const waterLogStreak = computeStreakFromDates(
    waterLogs.map((l) => l.date),
    todayKey()
  );

  const maxHabitStreak = habits.reduce((max, h) => Math.max(max, h.longestStreak), 0);
  const habitCompletions = habits.reduce((sum, h) => sum + h.currentStreak, 0);

  return {
    xp: user?.xp ?? 0,
    level: user?.level ?? 1,
    max_habit_streak: maxHabitStreak,
    habit_completions: habitCompletions,
    goals_completed_count: goalsCompletedCount,
    journal_entry_count: journalEntryCount,
    workout_log_count: workoutLogCount,
    water_log_streak: waterLogStreak,
    focus_session_count: focusSessionCount,
  };
}

export interface UnlockedAchievement {
  key: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
}

export async function checkAndUnlockAchievements(userId: string): Promise<UnlockedAchievement[]> {
  const stats = await computeUserStats(userId);
  const catalog = await Achievement.find().lean();
  const unlocked = await UserAchievement.find({ userId }).lean();
  const unlockedIds = new Set(unlocked.map((u) => u.achievementId.toString()));

  const newlyUnlocked: UnlockedAchievement[] = [];

  for (const achievement of catalog) {
    if (unlockedIds.has(achievement._id.toString())) continue;

    const value = stats[achievement.metric];
    if (value === undefined || value < achievement.threshold) continue;

    await UserAchievement.create({ userId, achievementId: achievement._id });
    if (achievement.xpReward > 0) {
      await awardXp(userId, achievement.xpReward);
    }
    newlyUnlocked.push({
      key: achievement.key,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      xpReward: achievement.xpReward,
    });
  }

  return newlyUnlocked;
}
