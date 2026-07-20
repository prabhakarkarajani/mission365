import { z } from 'zod';

import { createDream, deleteDream, listDreams, updateDream } from '../services/dream.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';

export const createDreamSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export const updateDreamSchema = createDreamSchema.partial().extend({
  status: z.enum(['active', 'archived']).optional(),
});

export const dreamIdParamSchema = z.object({ dreamId: z.string().min(1) });

export const listAll = asyncHandler(async (req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const dreams = await listDreams(req.userId!, status);
  sendSuccess(res, 200, { dreams });
});

export const create = asyncHandler(async (req, res) => {
  const dream = await createDream(req.userId!, req.body as z.infer<typeof createDreamSchema>);
  sendSuccess(res, 201, { dream });
});

export const update = asyncHandler(async (req, res) => {
  const { dreamId } = req.params as unknown as z.infer<typeof dreamIdParamSchema>;
  const dream = await updateDream(req.userId!, dreamId, req.body as z.infer<typeof updateDreamSchema>);
  sendSuccess(res, 200, { dream });
});

export const remove = asyncHandler(async (req, res) => {
  const { dreamId } = req.params as unknown as z.infer<typeof dreamIdParamSchema>;
  await deleteDream(req.userId!, dreamId);
  sendSuccess(res, 200, { deleted: true });
});
