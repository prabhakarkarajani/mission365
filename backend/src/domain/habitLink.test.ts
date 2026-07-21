import { LinkState, getLinkState } from './habitLink';

describe('getLinkState', () => {
  it('is UNLINKED when there is no goalId', () => {
    expect(getLinkState({ goalId: null, milestoneId: null })).toBe(LinkState.UNLINKED);
  });

  it('is UNLINKED when there is no goalId, even if milestoneId is set', () => {
    // Not a valid persisted state (see ADR-003 - write-time validation
    // rejects this), but the derivation itself must still be total.
    expect(getLinkState({ goalId: null, milestoneId: 'm1' })).toBe(LinkState.UNLINKED);
  });

  it('is GOAL when goalId is set without a milestoneId', () => {
    expect(getLinkState({ goalId: 'g1', milestoneId: null })).toBe(LinkState.GOAL);
  });

  it('is MILESTONE when both goalId and milestoneId are set', () => {
    expect(getLinkState({ goalId: 'g1', milestoneId: 'm1' })).toBe(LinkState.MILESTONE);
  });
});
