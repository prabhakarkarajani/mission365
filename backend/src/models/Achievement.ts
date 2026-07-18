import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

export const ACHIEVEMENT_METRICS = [
  'habit_completions',
  'max_habit_streak',
  'journal_entry_count',
  'workout_log_count',
  'water_log_streak',
  'focus_session_count',
  'goals_completed_count',
  'level',
  'xp',
] as const;

export type AchievementMetric = (typeof ACHIEVEMENT_METRICS)[number];

const achievementSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    metric: { type: String, enum: ACHIEVEMENT_METRICS, required: true },
    threshold: { type: Number, required: true },
    xpReward: { type: Number, default: 50 },
  },
  { timestamps: true }
);

export type AchievementDocument = HydratedDocument<InferSchemaType<typeof achievementSchema>>;

export const Achievement = model('Achievement', achievementSchema);

const userAchievementSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    achievementId: { type: Schema.Types.ObjectId, ref: 'Achievement', required: true },
    unlockedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

userAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });

export type UserAchievementDocument = HydratedDocument<InferSchemaType<typeof userAchievementSchema>>;

export const UserAchievement = model('UserAchievement', userAchievementSchema);
