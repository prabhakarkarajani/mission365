import { JournalEntry } from '../models/JournalEntry';
import type { Mood } from '../models/JournalEntry';
import { ApiError } from '../utils/ApiError';
import { todayKey } from '../utils/date';
import { awardXp, checkAndUnlockAchievements, recordActivity } from './gamification.service';

const XP_PER_ENTRY = 15;

export interface CreateJournalInput {
  content: string;
  mood: Mood;
  date?: string;
  tags?: string[];
}

export async function listEntries(userId: string, start?: string, end?: string) {
  const range = start && end ? { date: { $gte: start, $lte: end } } : {};
  return JournalEntry.find({ userId, ...range }).sort({ date: -1, createdAt: -1 });
}

async function findOwnedEntry(userId: string, entryId: string) {
  const entry = await JournalEntry.findOne({ _id: entryId, userId });
  if (!entry) {
    throw ApiError.notFound('Journal entry not found');
  }
  return entry;
}

export async function createEntry(userId: string, input: CreateJournalInput) {
  const entry = await JournalEntry.create({
    userId,
    content: input.content,
    mood: input.mood,
    date: input.date ?? todayKey(),
    tags: input.tags ?? [],
  });

  await recordActivity(userId);
  await awardXp(userId, XP_PER_ENTRY);
  const unlockedAchievements = await checkAndUnlockAchievements(userId);

  return { entry, unlockedAchievements };
}

export async function updateEntry(userId: string, entryId: string, input: Partial<CreateJournalInput>) {
  const entry = await findOwnedEntry(userId, entryId);
  Object.assign(entry, input);
  await entry.save();
  return entry;
}

export async function deleteEntry(userId: string, entryId: string) {
  const entry = await findOwnedEntry(userId, entryId);
  await entry.deleteOne();
}
