import { FocusSession, type FocusSessionType } from '../models/FocusSession';
import { ApiError } from '../utils/ApiError';
import { awardXp, checkAndUnlockAchievements, recordActivity } from './gamification.service';

const XP_PER_FOCUS_SESSION = 20;

export async function startSession(userId: string, type: FocusSessionType, durationMinutes: number) {
  return FocusSession.create({
    userId,
    type,
    durationMinutes,
    startedAt: new Date(),
  });
}

export async function completeSession(userId: string, sessionId: string, completed: boolean) {
  const session = await FocusSession.findOne({ _id: sessionId, userId });
  if (!session) {
    throw ApiError.notFound('Focus session not found');
  }

  session.endedAt = new Date();
  session.completed = completed;
  await session.save();

  let unlockedAchievements: Awaited<ReturnType<typeof checkAndUnlockAchievements>> = [];

  if (completed && session.type === 'focus') {
    await recordActivity(userId);
    await awardXp(userId, XP_PER_FOCUS_SESSION);
    unlockedAchievements = await checkAndUnlockAchievements(userId);
  }

  return { session, unlockedAchievements };
}

export async function listSessions(userId: string, start?: string, end?: string) {
  const range =
    start && end
      ? { startedAt: { $gte: new Date(`${start}T00:00:00.000Z`), $lte: new Date(`${end}T23:59:59.999Z`) } }
      : {};
  return FocusSession.find({ userId, ...range }).sort({ startedAt: -1 });
}

export async function getFocusSessionCount(userId: string): Promise<number> {
  return FocusSession.countDocuments({ userId, type: 'focus', completed: true });
}
