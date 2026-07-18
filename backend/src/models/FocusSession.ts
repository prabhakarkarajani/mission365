import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

export const FOCUS_SESSION_TYPES = ['focus', 'short_break', 'long_break'] as const;
export type FocusSessionType = (typeof FOCUS_SESSION_TYPES)[number];

const focusSessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: FOCUS_SESSION_TYPES, required: true },
    durationMinutes: { type: Number, required: true, min: 1 },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, default: null },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export type FocusSessionDocument = HydratedDocument<InferSchemaType<typeof focusSessionSchema>>;

export const FocusSession = model('FocusSession', focusSessionSchema);
