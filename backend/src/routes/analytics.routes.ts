import { Router } from 'express';

import { focusMinutes, habitCompletion, moodTrend, summary } from '../controllers/analytics.controller';
import { requireAuth } from '../middleware/auth';

export const analyticsRouter = Router();

analyticsRouter.use(requireAuth);

analyticsRouter.get('/summary', summary);
analyticsRouter.get('/habits', habitCompletion);
analyticsRouter.get('/mood', moodTrend);
analyticsRouter.get('/focus', focusMinutes);
