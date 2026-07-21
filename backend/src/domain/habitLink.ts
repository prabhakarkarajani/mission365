/**
 * Pure, dependency-free. Derived, never persisted (see ADR-003) - not
 * exposed via any API response yet; prepared for the Prioritization
 * Engine to switch on once it exists.
 */
export enum LinkState {
  UNLINKED = 'UNLINKED',
  GOAL = 'GOAL',
  MILESTONE = 'MILESTONE',
}

export interface HabitLinkFields {
  goalId: string | null;
  milestoneId: string | null;
}

export function getLinkState({ goalId, milestoneId }: HabitLinkFields): LinkState {
  if (!goalId) return LinkState.UNLINKED;
  return milestoneId ? LinkState.MILESTONE : LinkState.GOAL;
}
