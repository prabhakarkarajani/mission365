import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

const habitSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    category: {
      type: String,
      enum: ['morning', 'health', 'mind', 'learn', 'other'],
      default: 'other',
    },
    icon: { type: String, default: 'checkmark-circle-outline' },
    color: { type: String, default: '#6366F1' },
    frequency: {
      type: { type: String, enum: ['daily', 'weekly', 'custom'], default: 'daily' },
      daysOfWeek: { type: [Number], default: [] },
    },
    reminderTime: { type: String, default: null },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    isArchived: { type: Boolean, default: false, index: true },
    goalId: { type: Schema.Types.ObjectId, ref: 'Goal', default: null, index: true },
    // Addresses a subdocument inside Goal.milestones (ADR-001) - not a
    // top-level ref. Data-model-only until the Path experience ships;
    // no UI sets this yet (see ADR-003).
    milestoneId: { type: Schema.Types.ObjectId, default: null },
  },
  { timestamps: true }
);

export type HabitDocument = HydratedDocument<InferSchemaType<typeof habitSchema>>;

export const Habit = model('Habit', habitSchema);

const habitLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    habitId: { type: Schema.Types.ObjectId, ref: 'Habit', required: true, index: true },
    date: { type: String, required: true }, // 'YYYY-MM-DD'
    completed: { type: Boolean, default: true },
    completedAt: { type: Date, default: null },
    skipped: { type: Boolean, default: false },
  },
  { timestamps: true }
);

habitLogSchema.index({ habitId: 1, date: 1 }, { unique: true });

export type HabitLogDocument = HydratedDocument<InferSchemaType<typeof habitLogSchema>>;

export const HabitLog = model('HabitLog', habitLogSchema);
