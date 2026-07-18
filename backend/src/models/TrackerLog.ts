import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

export const TRACKER_KINDS = ['water', 'workout', 'sleep'] as const;
export type TrackerKind = (typeof TRACKER_KINDS)[number];

const trackerLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    kind: { type: String, enum: TRACKER_KINDS, required: true, index: true },
    date: { type: String, required: true, index: true }, // 'YYYY-MM-DD'
    value: { type: Number, required: true, min: 0 }, // ml for water, minutes for workout, hours for sleep
    unit: { type: String, default: '' },
    meta: {
      workoutType: { type: String, default: null },
      sleepQuality: { type: String, enum: ['poor', 'fair', 'good', 'excellent', null], default: null },
    },
  },
  { timestamps: true }
);

export type TrackerLogDocument = HydratedDocument<InferSchemaType<typeof trackerLogSchema>>;

export const TrackerLog = model('TrackerLog', trackerLogSchema);
