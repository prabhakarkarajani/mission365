import type { Mission } from '@/features/missions/types/mission.types';

/**
 * One real, checkable signal the engine found for a candidate Mission.
 * No UI strings here - the UI layer translates `code` (+ `data`) into copy.
 */
export type DecisionReasonCode =
  | 'HIGH_CATEGORY_PRIORITY'
  | 'STREAK_AT_RISK'
  | 'REMINDER_OVERDUE'
  | 'REMINDER_DUE_SOON'
  | 'SUPPORTS_ACTIVE_GOAL'
  | 'GOAL_URGENCY'
  | 'ONLY_PENDING_MISSION';

export interface DecisionReason {
  code: DecisionReasonCode;
  /** Points this reason contributes to the mission's score. */
  weight: number;
  data?: Record<string, string | number>;
}

export interface DecisionResult {
  /** Null when there is nothing pending today. */
  mission: Mission | null;
  /** Always the sum of `reasons[].weight` - reasons are the source of truth, not a separate calculation. */
  score: number;
  reasons: DecisionReason[];
}
