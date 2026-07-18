import { Router } from 'express';

import { listAll } from '../controllers/achievement.controller';
import { requireAuth } from '../middleware/auth';

export const achievementRouter = Router();

achievementRouter.use(requireAuth);
achievementRouter.get('/', listAll);
