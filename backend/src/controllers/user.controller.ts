import { z } from 'zod';

import { deleteAccount, updateMe } from '../services/user.service';
import { getUserById } from '../services/auth.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { serializeUser } from '../utils/serializeUser';

export const updateMeSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  timezone: z.string().optional(),
  notificationPreferences: z
    .object({
      dailyReminder: z.boolean().optional(),
      streakAlerts: z.boolean().optional(),
      goalMilestones: z.boolean().optional(),
    })
    .optional(),
  appearance: z
    .object({
      colorScheme: z.enum(['light', 'dark', 'system']).optional(),
    })
    .optional(),
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await getUserById(req.userId!);
  sendSuccess(res, 200, { user: serializeUser(user) });
});

export const patchMe = asyncHandler(async (req, res) => {
  const user = await updateMe(req.userId!, req.body as z.infer<typeof updateMeSchema>);
  sendSuccess(res, 200, { user: serializeUser(user) });
});

export const removeMe = asyncHandler(async (req, res) => {
  await deleteAccount(req.userId!);
  sendSuccess(res, 200, { deleted: true });
});
