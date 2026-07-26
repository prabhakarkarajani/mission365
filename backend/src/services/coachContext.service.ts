import type { CoachContext } from '../ai/core/interfaces/AIProvider';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';

/**
 * The seam every provider call goes through to ground Maya's replies in
 * real user data - deliberately thin in Phase 1 (just enough for a real,
 * working chat). Phase 2 expands this to dreams/goals/todayMissions/the
 * Decision Engine recommendation/recent activity without changing this
 * function's signature or CoachContext's meaning, only its richness.
 */
export async function buildCoachContext(userId: string): Promise<CoachContext> {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  return {
    user: {
      name: user.name,
      level: user.level,
      xp: user.xp,
      currentStreak: user.currentStreak,
    },
  };
}
