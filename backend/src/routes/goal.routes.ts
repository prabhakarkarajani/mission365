import { Router } from 'express';

import {
  create,
  createGoalSchema,
  goalIdParamSchema,
  listAll,
  milestoneBodySchema,
  milestoneParamSchema,
  progressSchema,
  remove,
  setMilestone,
  update,
  updateGoalSchema,
  updateProgress,
} from '../controllers/goal.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';

export const goalRouter = Router();

goalRouter.use(requireAuth);

goalRouter.get('/', listAll);
goalRouter.post('/', validate({ body: createGoalSchema }), create);
goalRouter.patch('/:goalId', validate({ params: goalIdParamSchema, body: updateGoalSchema }), update);
goalRouter.delete('/:goalId', validate({ params: goalIdParamSchema }), remove);
goalRouter.post(
  '/:goalId/progress',
  validate({ params: goalIdParamSchema, body: progressSchema }),
  updateProgress
);
goalRouter.post(
  '/:goalId/milestones/:milestoneId',
  validate({ params: milestoneParamSchema, body: milestoneBodySchema }),
  setMilestone
);
