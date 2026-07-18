import { z } from 'zod';

import {
  createGoal,
  deleteGoal,
  listGoals,
  toggleMilestone,
  updateGoal,
  updateGoalProgress,
} from '../services/goal.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';

export const createGoalSchema = z.object({
  title: z.string().trim().min(1).max(160),
  category: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  targetValue: z.number().positive(),
  unit: z.string().optional(),
  deadline: z.string().nullable().optional(),
  milestones: z.array(z.object({ title: z.string().trim().min(1) })).optional(),
});

export const updateGoalSchema = createGoalSchema.partial();

export const goalIdParamSchema = z.object({ goalId: z.string().min(1) });
export const milestoneParamSchema = z.object({ goalId: z.string().min(1), milestoneId: z.string().min(1) });

export const progressSchema = z.object({ currentValue: z.number().min(0) });
export const milestoneBodySchema = z.object({ completed: z.boolean() });

export const listAll = asyncHandler(async (req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const goals = await listGoals(req.userId!, status);
  sendSuccess(res, 200, { goals });
});

export const create = asyncHandler(async (req, res) => {
  const goal = await createGoal(req.userId!, req.body as z.infer<typeof createGoalSchema>);
  sendSuccess(res, 201, { goal });
});

export const update = asyncHandler(async (req, res) => {
  const { goalId } = req.params as unknown as z.infer<typeof goalIdParamSchema>;
  const goal = await updateGoal(req.userId!, goalId, req.body as z.infer<typeof updateGoalSchema>);
  sendSuccess(res, 200, { goal });
});

export const remove = asyncHandler(async (req, res) => {
  const { goalId } = req.params as unknown as z.infer<typeof goalIdParamSchema>;
  await deleteGoal(req.userId!, goalId);
  sendSuccess(res, 200, { deleted: true });
});

export const updateProgress = asyncHandler(async (req, res) => {
  const { goalId } = req.params as unknown as z.infer<typeof goalIdParamSchema>;
  const { currentValue } = req.body as z.infer<typeof progressSchema>;
  const result = await updateGoalProgress(req.userId!, goalId, currentValue);
  sendSuccess(res, 200, result);
});

export const setMilestone = asyncHandler(async (req, res) => {
  const { goalId, milestoneId } = req.params as unknown as z.infer<typeof milestoneParamSchema>;
  const { completed } = req.body as z.infer<typeof milestoneBodySchema>;
  const goal = await toggleMilestone(req.userId!, goalId, milestoneId, completed);
  sendSuccess(res, 200, { goal });
});
