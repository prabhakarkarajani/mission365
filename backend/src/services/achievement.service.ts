import { Achievement, UserAchievement } from '../models/Achievement';

export async function listAchievementsForUser(userId: string) {
  const [catalog, unlocked] = await Promise.all([
    Achievement.find().sort({ threshold: 1 }).lean(),
    UserAchievement.find({ userId }).lean(),
  ]);

  const unlockedMap = new Map(unlocked.map((u) => [u.achievementId.toString(), u.unlockedAt]));

  return catalog.map((achievement) => ({
    id: achievement._id,
    key: achievement.key,
    title: achievement.title,
    description: achievement.description,
    icon: achievement.icon,
    xpReward: achievement.xpReward,
    unlocked: unlockedMap.has(achievement._id.toString()),
    unlockedAt: unlockedMap.get(achievement._id.toString()) ?? null,
  }));
}
