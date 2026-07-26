import { z } from 'zod';

import { getSuggestionCards, sendChatMessage } from '../services/coach.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';

const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(4000),
});

// No server-side conversation persistence yet (Phase 4) - the client holds
// history locally and sends the recent turns up each call.
export const chatBodySchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(50),
  cardId: z.string().optional(),
  mood: z.enum(['great', 'good', 'neutral', 'bad', 'awful']).optional(),
});

export const suggestions = asyncHandler(async (_req, res) => {
  sendSuccess(res, 200, { cards: getSuggestionCards() });
});

export const chat = asyncHandler(async (req, res) => {
  const body = req.body as z.infer<typeof chatBodySchema>;
  const result = await sendChatMessage(req.userId!, body);
  sendSuccess(res, 200, { reply: { role: 'assistant', content: result.message } });
});
