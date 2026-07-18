import { Router } from 'express';

import { getMe, patchMe, removeMe, updateMeSchema } from '../controllers/user.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';

export const userRouter = Router();

userRouter.use(requireAuth);

userRouter.get('/me', getMe);
userRouter.patch('/me', validate({ body: updateMeSchema }), patchMe);
userRouter.delete('/me', removeMe);
