import { eventBus } from '../lib/eventBus';
import { Dream } from '../models/Dream';
import { ApiError } from '../utils/ApiError';

export interface CreateDreamInput {
  title: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface UpdateDreamInput extends Partial<CreateDreamInput> {
  status?: 'active' | 'archived';
}

export async function listDreams(userId: string, status?: string) {
  return Dream.find({ userId, ...(status ? { status } : {}) }).sort({ createdAt: -1 });
}

export async function findOwnedDream(userId: string, dreamId: string) {
  const dream = await Dream.findOne({ _id: dreamId, userId });
  if (!dream) {
    throw ApiError.notFound('Dream not found');
  }
  return dream;
}

export async function createDream(userId: string, input: CreateDreamInput) {
  const dream = await Dream.create({
    userId,
    title: input.title,
    description: input.description,
    icon: input.icon,
    color: input.color,
  });

  eventBus.emit('dream.created', { dreamId: dream.id as string, userId });

  return dream;
}

export async function updateDream(userId: string, dreamId: string, input: UpdateDreamInput) {
  const dream = await findOwnedDream(userId, dreamId);
  Object.assign(dream, input);
  await dream.save();
  return dream;
}

export async function deleteDream(userId: string, dreamId: string) {
  const dream = await findOwnedDream(userId, dreamId);
  await dream.deleteOne();
}
