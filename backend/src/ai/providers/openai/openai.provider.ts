import OpenAI from 'openai';

import { env } from '../../../config/env';
import type { AIProvider, CoachChatInput, CoachChatResult } from '../../core/interfaces/AIProvider';
import { buildSystemPrompt } from '../../core/prompt/buildSystemPrompt';
import { withRetry } from '../../core/reliability/withRetry';

const FALLBACK_MESSAGE = "Maya's having trouble connecting right now - try again in a moment.";

// Lazy, not module-top-level: this module is always imported by
// createAIProvider's factory regardless of which provider is active, so
// constructing the client eagerly would require OPENAI_API_KEY even when
// AI_PROVIDER=mock (the default, including in CI). By the time chat() is
// actually called, env.ts's validation has already guaranteed the key is
// set for the currently-selected provider.
let client: OpenAI | null = null;
function getClient(): OpenAI {
  client ??= new OpenAI({ apiKey: env.OPENAI_API_KEY });
  return client;
}

async function chat(input: CoachChatInput): Promise<CoachChatResult> {
  try {
    const completion = await withRetry(
      (signal) =>
        getClient().chat.completions.create(
          {
            model: env.OPENAI_MODEL,
            messages: [
              { role: 'system', content: buildSystemPrompt(input.context) },
              ...input.messages.map((m) => ({ role: m.role, content: m.content })),
            ],
          },
          { signal }
        ),
      { provider: 'openai', operation: 'chat', timeoutMs: env.AI_REQUEST_TIMEOUT_MS }
    );

    const message = completion.choices[0]?.message?.content?.trim();
    if (!message) throw new Error('OpenAI returned an empty response');

    return { message };
  } catch {
    // Graceful degradation, not an error surfaced to the client: after
    // retries are exhausted (withRetry) or on any other vendor failure,
    // Maya "replies" with an honest apology rather than the request
    // failing outright or silently swapping in a canned-sounding answer
    // that pretends to understand. Vendor error details are deliberately
    // not inspected/logged here beyond what withRetry already logged
    // (metadata only) - never leak vendor error text to the client.
    return { message: FALLBACK_MESSAGE };
  }
}

export const openaiProvider: AIProvider = {
  name: 'openai',
  chat,
};
