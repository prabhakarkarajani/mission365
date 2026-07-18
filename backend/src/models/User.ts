import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    avatarUrl: { type: String, default: null },
    timezone: { type: String, default: 'UTC' },
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: null },
    tokenVersion: { type: Number, default: 0, select: false },
    notificationPreferences: {
      dailyReminder: { type: Boolean, default: true },
      streakAlerts: { type: Boolean, default: true },
      goalMilestones: { type: Boolean, default: true },
    },
    appearance: {
      colorScheme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    },
  },
  { timestamps: true }
);

export type UserDocument = HydratedDocument<InferSchemaType<typeof userSchema>>;

export const User = model('User', userSchema);
