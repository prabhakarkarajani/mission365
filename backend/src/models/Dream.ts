import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

const dreamSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, default: '', trim: true, maxlength: 2000 },
    icon: { type: String, default: 'sparkles-outline' },
    color: { type: String, default: '#8B5CF6' },
    status: { type: String, enum: ['active', 'archived'], default: 'active', index: true },
  },
  { timestamps: true }
);

export type DreamDocument = HydratedDocument<InferSchemaType<typeof dreamSchema>>;

export const Dream = model('Dream', dreamSchema);
