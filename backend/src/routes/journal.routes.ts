import { Router } from 'express';

import {
  create,
  createEntrySchema,
  entryIdParamSchema,
  listAll,
  remove,
  update,
  updateEntrySchema,
} from '../controllers/journal.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';

export const journalRouter = Router();

journalRouter.use(requireAuth);

journalRouter.get('/', listAll);
journalRouter.post('/', validate({ body: createEntrySchema }), create);
journalRouter.patch('/:entryId', validate({ params: entryIdParamSchema, body: updateEntrySchema }), update);
journalRouter.delete('/:entryId', validate({ params: entryIdParamSchema }), remove);
