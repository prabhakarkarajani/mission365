import { Router } from 'express';

import {
  login,
  loginSchema,
  logout,
  me,
  refresh,
  refreshSchema,
  register,
  registerSchema,
} from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';

export const authRouter = Router();

authRouter.post('/register', validate({ body: registerSchema }), register);
authRouter.post('/login', validate({ body: loginSchema }), login);
authRouter.post('/refresh', validate({ body: refreshSchema }), refresh);
authRouter.post('/logout', requireAuth, logout);
authRouter.get('/me', requireAuth, me);
