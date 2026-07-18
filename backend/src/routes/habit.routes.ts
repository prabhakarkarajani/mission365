import { Router } from 'express';

import {
  archive,
  create,
  createHabitSchema,
  getToday,
  habitIdParamSchema,
  listAll,
  logsInRange,
  remove,
  toggleCompletion,
  toggleCompletionSchema,
  update,
  updateHabitSchema,
} from '../controllers/habit.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';

export const habitRouter = Router();

habitRouter.use(requireAuth);

habitRouter.get('/', listAll);
habitRouter.get('/today', getToday);
habitRouter.get('/logs', logsInRange);
habitRouter.post('/', validate({ body: createHabitSchema }), create);
habitRouter.patch('/:habitId', validate({ params: habitIdParamSchema, body: updateHabitSchema }), update);
habitRouter.delete('/:habitId', validate({ params: habitIdParamSchema }), remove);
habitRouter.post('/:habitId/archive', validate({ params: habitIdParamSchema }), archive);
habitRouter.post(
  '/:habitId/completion',
  validate({ params: habitIdParamSchema, body: toggleCompletionSchema }),
  toggleCompletion
);
