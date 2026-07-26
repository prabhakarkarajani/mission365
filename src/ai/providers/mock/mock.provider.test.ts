import type { ChatInput, CoachContext } from '../../core/interfaces/AIProvider';

import { mockProvider } from './mock.provider';

const FALLBACK_SNIPPET = "I'm your AI coach";

function makeContext(overrides: Partial<CoachContext> = {}): CoachContext {
  return {
    userName: 'Test',
    goals: [],
    missions: [],
    ...overrides,
  };
}

function makeInput(userText: string, context: CoachContext): ChatInput {
  return { messages: [{ role: 'user', content: userText }], context };
}

describe('mockProvider.chat', () => {
  // Regression test for the Sprint 6 "Generate Roadmap" bug: this exact
  // string is what app/(tabs)/coach.tsx's SUGGESTED_PROMPTS sends, and it
  // used to fall through every keyword branch straight to the generic
  // greeting instead of a real answer.
  it('does not fall back to the generic greeting for "Generate a roadmap for my current goal."', async () => {
    const result = await mockProvider.chat(
      makeInput('Generate a roadmap for my current goal.', makeContext())
    );
    expect(result.message).not.toContain(FALLBACK_SNIPPET);
  });

  it('tells the user to create a goal first when asking for a roadmap with no active goals', async () => {
    const result = await mockProvider.chat(
      makeInput('Generate a roadmap for my current goal.', makeContext({ goals: [] }))
    );
    expect(result.message).toMatch(/don't have an active goal/i);
  });

  it('describes the real current goal when asking for a roadmap with an active goal', async () => {
    const context = makeContext({
      goals: [
        {
          title: 'Run a 5k',
          currentValue: 3,
          targetValue: 5,
          unit: 'km',
          deadline: null,
          percentComplete: 60,
        },
      ],
    });
    const result = await mockProvider.chat(makeInput('Generate a roadmap for my current goal.', context));
    expect(result.message).toContain('Run a 5k');
    expect(result.message).toContain('60%');
  });

  // One test per app/(tabs)/coach.tsx SUGGESTED_PROMPTS entry that actually
  // sends chat text (not the two that just router.push elsewhere) - proves
  // every quick-action button has a real keyword match, not just "roadmap".
  it.each([
    ['Plan My Day', 'Plan My Day'],
    ['Review Goals', 'Review Goals'],
    ['Generate Roadmap', 'Generate a roadmap for my current goal.'],
    ['Motivate Me', 'Motivate Me'],
  ])('quick action "%s" never falls back to the generic greeting', async (_label, promptText) => {
    const result = await mockProvider.chat(makeInput(promptText, makeContext()));
    expect(result.message).not.toContain(FALLBACK_SNIPPET);
  });

  it('still falls back to the generic greeting for genuinely unrecognized text', async () => {
    const result = await mockProvider.chat(makeInput('asdfghjkl', makeContext()));
    expect(result.message).toContain(FALLBACK_SNIPPET);
  });
});
