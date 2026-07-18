import type { UserDocument } from '../models/User';

export function serializeUser(user: UserDocument) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    timezone: user.timezone,
    level: user.level,
    xp: user.xp,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    lastActiveDate: user.lastActiveDate,
    notificationPreferences: user.notificationPreferences,
    appearance: user.appearance,
    createdAt: user.createdAt,
  };
}
