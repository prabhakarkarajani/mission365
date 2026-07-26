import type { Goal } from './types';

export type GoalPhase = 'Foundation' | 'Momentum' | 'Final Stretch';

export interface GoalPacing {
  progressPercent: number;
  elapsedPercent: number | null;
  /** Deterministic pacing indicator (progress vs. time elapsed), not an AI prediction. */
  confidencePercent: number;
  phase: GoalPhase;
  /**
   * False when there's no real pacing signal yet (no deadline to measure
   * elapsed time against, and no progress logged) - confidencePercent is 0
   * in that case only because there's nothing to compute from, not because
   * the goal is behind. Callers should render a neutral state instead of
   * treating it as "behind".
   */
  hasSignal: boolean;
}

function phaseForProgress(progressPercent: number): GoalPhase {
  if (progressPercent < 33) return 'Foundation';
  if (progressPercent < 66) return 'Momentum';
  return 'Final Stretch';
}

export function getGoalPacing(goal: Goal): GoalPacing {
  const progressPercent = goal.targetValue > 0 ? Math.min(100, (goal.currentValue / goal.targetValue) * 100) : 0;

  let elapsedPercent: number | null = null;
  if (goal.deadline) {
    const start = new Date(goal.createdAt).getTime();
    const end = new Date(goal.deadline).getTime();
    const now = new Date().getTime();
    if (end > start) {
      elapsedPercent = Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100));
    }
  }

  const confidencePercent =
    elapsedPercent === null
      ? Math.round(progressPercent)
      : Math.round(Math.max(0, Math.min(100, progressPercent - elapsedPercent + 70)));

  return {
    progressPercent,
    elapsedPercent,
    confidencePercent,
    phase: phaseForProgress(progressPercent),
    hasSignal: !(elapsedPercent === null && progressPercent === 0),
  };
}
