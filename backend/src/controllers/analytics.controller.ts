import { z } from 'zod';

import {
  getFocusMinutesSeries,
  getHabitCompletionSeries,
  getMoodTrend,
  getSummary,
} from '../services/analytics.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';

const daysQuerySchema = z.object({ days: z.coerce.number().int().min(1).max(90).default(7) });

function parseDays(query: unknown): number {
  return daysQuerySchema.parse(query).days;
}

export const summary = asyncHandler(async (req, res) => {
  const data = await getSummary(req.userId!);
  sendSuccess(res, 200, data);
});

export const habitCompletion = asyncHandler(async (req, res) => {
  const days = parseDays(req.query);
  const series = await getHabitCompletionSeries(req.userId!, days);
  sendSuccess(res, 200, { series });
});

export const moodTrend = asyncHandler(async (req, res) => {
  const days = parseDays(req.query);
  const series = await getMoodTrend(req.userId!, days);
  sendSuccess(res, 200, { series });
});

export const focusMinutes = asyncHandler(async (req, res) => {
  const days = parseDays(req.query);
  const series = await getFocusMinutesSeries(req.userId!, days);
  sendSuccess(res, 200, { series });
});
