const mockCreate = jest.fn();

jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    chat: { completions: { create: mockCreate } },
  })),
}));

jest.mock('../../../config/env', () => ({
  env: { OPENAI_API_KEY: 'test-key', OPENAI_MODEL: 'gpt-4o-mini', AI_REQUEST_TIMEOUT_MS: 1000 },
}));

import type { CoachContext } from '../../core/interfaces/AIProvider';
import { openaiProvider } from './openai.provider';

const context: CoachContext = { user: { name: 'Jamie Doe', level: 3, xp: 450, currentStreak: 5 } };

describe('openai provider', () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it('has the expected name', () => {
    expect(openaiProvider.name).toBe('openai');
  });

  it('returns the vendor reply on success', async () => {
    mockCreate.mockResolvedValue({ choices: [{ message: { content: 'A real, grounded reply.' } }] });

    const result = await openaiProvider.chat({ messages: [{ role: 'user', content: 'hi' }], context });

    expect(result.message).toBe('A real, grounded reply.');
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it('includes the system prompt and full message history in the request', async () => {
    mockCreate.mockResolvedValue({ choices: [{ message: { content: 'ok' } }] });

    await openaiProvider.chat({
      messages: [
        { role: 'user', content: 'first' },
        { role: 'assistant', content: 'reply' },
        { role: 'user', content: 'second' },
      ],
      context,
    });

    const [requestBody] = mockCreate.mock.calls[0];
    expect(requestBody.messages[0]).toMatchObject({ role: 'system' });
    expect(requestBody.messages[0].content).toContain('Jamie Doe');
    expect(requestBody.messages).toHaveLength(4); // system + 3 turns
  });

  it('falls back to a graceful apology instead of throwing when the vendor call fails', async () => {
    mockCreate.mockRejectedValue(Object.assign(new Error('vendor down'), { status: 500 }));

    const result = await openaiProvider.chat({ messages: [{ role: 'user', content: 'hi' }], context });

    expect(result.message).toMatch(/trouble connecting/i);
  });

  it('falls back gracefully on an empty vendor response instead of throwing', async () => {
    mockCreate.mockResolvedValue({ choices: [{ message: { content: '' } }] });

    const result = await openaiProvider.chat({ messages: [{ role: 'user', content: 'hi' }], context });

    expect(result.message).toMatch(/trouble connecting/i);
  });
});
