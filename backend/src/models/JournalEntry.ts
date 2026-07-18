import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

export const MOOD_VALUES = ['great', 'good', 'neutral', 'bad', 'awful'] as const;
export type Mood = (typeof MOOD_VALUES)[number];

const journalEntrySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, required: true, trim: true, maxlength: 10_000 },
    mood: { type: String, enum: MOOD_VALUES, required: true },
    date: { type: String, required: true, index: true }, // 'YYYY-MM-DD'
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

export type JournalEntryDocument = HydratedDocument<InferSchemaType<typeof journalEntrySchema>>;

export const JournalEntry = model('JournalEntry', journalEntrySchema);
