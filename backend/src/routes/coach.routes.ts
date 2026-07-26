import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';

import { chat, chatBodySchema, suggestions } from '../controllers/coach.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';

export const coachRouter = Router();

coachRouter.use(requireAuth);

// First per-route limiter in this codebase - justified because AI calls are
// the only endpoints that are both slow (multi-second vendor round-trips)
// and directly cost money per call. Stacks on top of app.ts's global
// 300/15min limiter, which still also applies.
coachRouter.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

coachRouter.get('/suggestions', suggestions);
coachRouter.post('/chat', validate({ body: chatBodySchema }), chat);
