import { Router } from 'express';

import {
  create,
  createDreamSchema,
  dreamIdParamSchema,
  listAll,
  remove,
  update,
  updateDreamSchema,
} from '../controllers/dream.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';

export const dreamRouter = Router();

dreamRouter.use(requireAuth);

dreamRouter.get('/', listAll);
dreamRouter.post('/', validate({ body: createDreamSchema }), create);
dreamRouter.patch('/:dreamId', validate({ params: dreamIdParamSchema, body: updateDreamSchema }), update);
dreamRouter.delete('/:dreamId', validate({ params: dreamIdParamSchema }), remove);
