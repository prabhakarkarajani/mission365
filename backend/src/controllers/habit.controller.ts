import { z } from 'zod';

import {
  archiveHabit,
  createHabit,
  deleteHabit,
  getHabitLogsInRange,
  getTodayOverview,
  listHabits,
  setHabitCompletion,
  setHabitSkip,
  updateHabit,
} from '../services/habit.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { isValidDateKey, todayKey } from '../utils/date';

const frequencySchema = z.object({
  type: z.enum(['daily', 'weekly', 'custom']).optional(),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
});

export const createHabitSchema = z.object({
  name: z.string().trim().min(1).max(120),
  category: z.enum(['morning', 'health', 'mind', 'learn', 'other']).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  frequency: frequencySchema.optional(),
  reminderTime: z.string().nullable().optional(),
  goalId: z.string().min(1).nullable().optional(),
  milestoneId: z.string().min(1).nullable().optional(),
});

export const updateHabitSchema = createHabitSchema.partial();

export const toggleCompletionSchema = z.object({
  date: z.string().refine(isValidDateKey, 'date must be in YYYY-MM-DD format'),
  completed: z.boolean(),
});

export const toggleSkipSchema = z.object({
  date: z.string().refine(isValidDateKey, 'date must be in YYYY-MM-DD format'),
  skipped: z.boolean(),
});

export const habitIdParamSchema = z.object({ habitId: z.string().min(1) });

export const listAll = asyncHandler(async (req, res) => {
  const habits = await listHabits(req.userId!, req.query.includeArchived === 'true');
  sendSuccess(res, 200, { habits });
});

export const getToday = asyncHandler(async (req, res) => {
  const date = typeof req.query.date === 'string' && isValidDateKey(req.query.date) ? req.query.date : todayKey();
  const overview = await getTodayOverview(req.userId!, date);
  sendSuccess(res, 200, { date, missions: overview });
});

export const create = asyncHandler(async (req, res) => {
  const habit = await createHabit(req.userId!, req.body as z.infer<typeof createHabitSchema>);
  sendSuccess(res, 201, { habit });
});

export const update = asyncHandler(async (req, res) => {
  const { habitId } = req.params as unknown as z.infer<typeof habitIdParamSchema>;
  const habit = await updateHabit(req.userId!, habitId, req.body as z.infer<typeof updateHabitSchema>);
  sendSuccess(res, 200, { habit });
});

export const remove = asyncHandler(async (req, res) => {
  const { habitId } = req.params as unknown as z.infer<typeof habitIdParamSchema>;
  await deleteHabit(req.userId!, habitId);
  sendSuccess(res, 200, { deleted: true });
});

export const archive = asyncHandler(async (req, res) => {
  const { habitId } = req.params as unknown as z.infer<typeof habitIdParamSchema>;
  const habit = await archiveHabit(req.userId!, habitId);
  sendSuccess(res, 200, { habit });
});

export const toggleCompletion = asyncHandler(async (req, res) => {
  const { habitId } = req.params as unknown as z.infer<typeof habitIdParamSchema>;
  const { date, completed } = req.body as z.infer<typeof toggleCompletionSchema>;
  const result = await setHabitCompletion(req.userId!, habitId, date, completed);
  sendSuccess(res, 200, result);
});

export const toggleSkip = asyncHandler(async (req, res) => {
  const { habitId } = req.params as unknown as z.infer<typeof habitIdParamSchema>;
  const { date, skipped } = req.body as z.infer<typeof toggleSkipSchema>;
  const habit = await setHabitSkip(req.userId!, habitId, date, skipped);
  sendSuccess(res, 200, { habit });
});

export const logsInRange = asyncHandler(async (req, res) => {
  const start = req.query.start;
  const end = req.query.end;
  if (typeof start !== 'string' || typeof end !== 'string' || !isValidDateKey(start) || !isValidDateKey(end)) {
    throw ApiError.badRequest('start and end query params must be YYYY-MM-DD');
  }
  const logs = await getHabitLogsInRange(req.userId!, start, end);
  sendSuccess(res, 200, { logs });
});
