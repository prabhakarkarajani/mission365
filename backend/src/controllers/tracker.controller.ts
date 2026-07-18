import { z } from 'zod';

import { TRACKER_KINDS } from '../models/TrackerLog';
import {
  createLog,
  deleteLog,
  getDailySummary,
  getWaterLogStreak,
  listLogs,
} from '../services/tracker.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { isValidDateKey, todayKey } from '../utils/date';

export const createLogSchema = z.object({
  kind: z.enum(TRACKER_KINDS),
  value: z.number().positive(),
  unit: z.string().optional(),
  date: z.string().refine(isValidDateKey, 'date must be YYYY-MM-DD').optional(),
  meta: z
    .object({
      workoutType: z.string().optional(),
      sleepQuality: z.enum(['poor', 'fair', 'good', 'excellent']).optional(),
    })
    .optional(),
});

export const logIdParamSchema = z.object({ logId: z.string().min(1) });

export const listAll = asyncHandler(async (req, res) => {
  const kind = TRACKER_KINDS.includes(req.query.kind as (typeof TRACKER_KINDS)[number])
    ? (req.query.kind as (typeof TRACKER_KINDS)[number])
    : undefined;
  const start = typeof req.query.start === 'string' ? req.query.start : undefined;
  const end = typeof req.query.end === 'string' ? req.query.end : undefined;
  const logs = await listLogs(req.userId!, kind, start, end);
  sendSuccess(res, 200, { logs });
});

export const create = asyncHandler(async (req, res) => {
  const result = await createLog(req.userId!, req.body as z.infer<typeof createLogSchema>);
  sendSuccess(res, 201, result);
});

export const remove = asyncHandler(async (req, res) => {
  const { logId } = req.params as unknown as z.infer<typeof logIdParamSchema>;
  await deleteLog(req.userId!, logId);
  sendSuccess(res, 200, { deleted: true });
});

export const summary = asyncHandler(async (req, res) => {
  const date = typeof req.query.date === 'string' && isValidDateKey(req.query.date) ? req.query.date : todayKey();
  const [daily, waterStreak] = await Promise.all([
    getDailySummary(req.userId!, date),
    getWaterLogStreak(req.userId!),
  ]);
  sendSuccess(res, 200, { ...daily, waterStreak });
});
