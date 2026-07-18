import { Router } from 'express';

import {
  create,
  createLogSchema,
  listAll,
  logIdParamSchema,
  remove,
  summary,
} from '../controllers/tracker.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';

export const trackerRouter = Router();

trackerRouter.use(requireAuth);

trackerRouter.get('/', listAll);
trackerRouter.get('/summary', summary);
trackerRouter.post('/', validate({ body: createLogSchema }), create);
trackerRouter.delete('/:logId', validate({ params: logIdParamSchema }), remove);
