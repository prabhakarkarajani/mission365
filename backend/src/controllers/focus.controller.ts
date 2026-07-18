import { z } from 'zod';

import { FOCUS_SESSION_TYPES } from '../models/FocusSession';
import { completeSession, listSessions, startSession } from '../services/focus.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';

export const startSessionSchema = z.object({
  type: z.enum(FOCUS_SESSION_TYPES),
  durationMinutes: z.number().positive(),
});

export const completeSessionSchema = z.object({ completed: z.boolean() });
export const sessionIdParamSchema = z.object({ sessionId: z.string().min(1) });

export const start = asyncHandler(async (req, res) => {
  const { type, durationMinutes } = req.body as z.infer<typeof startSessionSchema>;
  const session = await startSession(req.userId!, type, durationMinutes);
  sendSuccess(res, 201, { session });
});

export const complete = asyncHandler(async (req, res) => {
  const { sessionId } = req.params as unknown as z.infer<typeof sessionIdParamSchema>;
  const { completed } = req.body as z.infer<typeof completeSessionSchema>;
  const result = await completeSession(req.userId!, sessionId, completed);
  sendSuccess(res, 200, result);
});

export const listAll = asyncHandler(async (req, res) => {
  const start_ = typeof req.query.start === 'string' ? req.query.start : undefined;
  const end_ = typeof req.query.end === 'string' ? req.query.end : undefined;
  const sessions = await listSessions(req.userId!, start_, end_);
  sendSuccess(res, 200, { sessions });
});
