import { z } from 'zod';

import { MOOD_VALUES } from '../models/JournalEntry';
import { createEntry, deleteEntry, listEntries, updateEntry } from '../services/journal.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { isValidDateKey } from '../utils/date';

export const createEntrySchema = z.object({
  content: z.string().trim().min(1).max(10_000),
  mood: z.enum(MOOD_VALUES),
  date: z.string().refine(isValidDateKey, 'date must be YYYY-MM-DD').optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
});

export const updateEntrySchema = createEntrySchema.partial();
export const entryIdParamSchema = z.object({ entryId: z.string().min(1) });

export const listAll = asyncHandler(async (req, res) => {
  const start = typeof req.query.start === 'string' ? req.query.start : undefined;
  const end = typeof req.query.end === 'string' ? req.query.end : undefined;
  const entries = await listEntries(req.userId!, start, end);
  sendSuccess(res, 200, { entries });
});

export const create = asyncHandler(async (req, res) => {
  const result = await createEntry(req.userId!, req.body as z.infer<typeof createEntrySchema>);
  sendSuccess(res, 201, result);
});

export const update = asyncHandler(async (req, res) => {
  const { entryId } = req.params as unknown as z.infer<typeof entryIdParamSchema>;
  const entry = await updateEntry(req.userId!, entryId, req.body as z.infer<typeof updateEntrySchema>);
  sendSuccess(res, 200, { entry });
});

export const remove = asyncHandler(async (req, res) => {
  const { entryId } = req.params as unknown as z.infer<typeof entryIdParamSchema>;
  await deleteEntry(req.userId!, entryId);
  sendSuccess(res, 200, { deleted: true });
});
