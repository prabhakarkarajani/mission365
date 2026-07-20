import { Router } from 'express';

import { achievementRouter } from './achievement.routes';
import { analyticsRouter } from './analytics.routes';
import { authRouter } from './auth.routes';
import { dreamRouter } from './dream.routes';
import { focusRouter } from './focus.routes';
import { goalRouter } from './goal.routes';
import { habitRouter } from './habit.routes';
import { journalRouter } from './journal.routes';
import { trackerRouter } from './tracker.routes';
import { userRouter } from './user.routes';

export const router = Router();

router.use('/auth', authRouter);
router.use('/habits', habitRouter);
router.use('/goals', goalRouter);
router.use('/dreams', dreamRouter);
router.use('/journal', journalRouter);
router.use('/trackers', trackerRouter);
router.use('/focus', focusRouter);
router.use('/achievements', achievementRouter);
router.use('/analytics', analyticsRouter);
router.use('/users', userRouter);
