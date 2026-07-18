import { Router } from 'express';

import {
  complete,
  completeSessionSchema,
  listAll,
  sessionIdParamSchema,
  start,
  startSessionSchema,
} from '../controllers/focus.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';

export const focusRouter = Router();

focusRouter.use(requireAuth);

focusRouter.get('/', listAll);
focusRouter.post('/', validate({ body: startSessionSchema }), start);
focusRouter.post(
  '/:sessionId/complete',
  validate({ params: sessionIdParamSchema, body: completeSessionSchema }),
  complete
);
