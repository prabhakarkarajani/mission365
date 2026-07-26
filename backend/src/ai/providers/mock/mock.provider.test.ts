import type { CoachContext } from '../../core/interfaces/AIProvider';
import { mockProvider } from './mock.provider';

const context: CoachContext = { user: { name: 'Jamie Doe', level: 3, xp: 450, currentStreak: 5 } };

describe('mock provider', () => {
  it('has the expected name', () => {
    expect(mockProvider.name).toBe('mock');
  });

  it("acknowledges overwhelm before suggesting anything, for the 'feeling overwhelmed' card", async () => {
    const result = await mockProvider.chat({
      messages: [{ role: 'user', content: "I'm feeling overwhelmed right now." }],
      context,
    });
    expect(result.message).toMatch(/okay/i);
  });

  it("suggests the smallest next step for the 'don't know where to start' card", async () => {
    const result = await mockProvider.chat({
      messages: [{ role: 'user', content: "I don't know where to start today." }],
      context,
    });
    expect(result.message).toMatch(/smallest/i);
  });

  it('references the real streak count, never a fabricated one', async () => {
    const result = await mockProvider.chat({
      messages: [{ role: 'user', content: 'motivate me' }],
      context,
    });
    expect(result.message).toContain('5');
  });

  it('falls back to a generic greeting for unrecognized text, addressing the user by name', async () => {
    const result = await mockProvider.chat({
      messages: [{ role: 'user', content: 'asdkjfhaskdjfh' }],
      context,
    });
    expect(result.message).toContain('Jamie');
  });

  it('only reads the last user message, not earlier turns', async () => {
    const result = await mockProvider.chat({
      messages: [
        { role: 'user', content: 'motivate me' },
        { role: 'assistant', content: 'You got this!' },
        { role: 'user', content: "I don't know where to start today." },
      ],
      context,
    });
    expect(result.message).toMatch(/smallest/i);
  });
});
