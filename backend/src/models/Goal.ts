import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

const milestoneSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    order: { type: Number, default: 0 },
    targetDate: { type: Date, default: null },
  },
  { _id: true }
);

const goalSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    dreamId: { type: Schema.Types.ObjectId, ref: 'Dream', default: null, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    category: { type: String, default: 'general' },
    icon: { type: String, default: 'flag-outline' },
    color: { type: String, default: '#6366F1' },
    // Goal Impact weight — feeds Prioritization Engine's two-layer Impact
    // Score (importance x deadline urgency). 1 (low) - 5 (high).
    importance: { type: Number, required: true, min: 1, max: 5, default: 3 },
    targetValue: { type: Number, required: true, min: 0 },
    currentValue: { type: Number, default: 0, min: 0 },
    unit: { type: String, default: '' },
    deadline: { type: Date, default: null },
    status: { type: String, enum: ['active', 'completed', 'archived'], default: 'active', index: true },
    milestones: { type: [milestoneSchema], default: [] },
  },
  { timestamps: true }
);

export type GoalDocument = HydratedDocument<InferSchemaType<typeof goalSchema>>;

export const Goal = model('Goal', goalSchema);
