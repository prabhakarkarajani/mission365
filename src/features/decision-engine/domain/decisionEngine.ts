import type { Goal } from '@/features/goals/domain/types';
import type { Mission, MissionPriority } from '@/features/missions/types/mission.types';

import type { DecisionReason, DecisionResult } from './types';

const CATEGORY_PRIORITY_WEIGHT: Record<MissionPriority, number> = {
  CRITICAL: 40,
  HIGH: 30,
  MEDIUM: 20,
  LOW: 10,
  OPTIONAL: 5,
};

const STREAK_WEIGHT_PER_DAY = 2;
const STREAK_WEIGHT_CAP = 20;
const REMINDER_OVERDUE_WEIGHT = 15;
const REMINDER_DUE_SOON_WEIGHT = 8;
const REMINDER_DUE_SOON_WINDOW_MINUTES = 120;
const SUPPORTS_ACTIVE_GOAL_WEIGHT = 10;

// Urgency (Sprint 7) is one composite reason, not a raw "deadline approaching"
// signal - it only fires within a bounded window (like REMINDER_DUE_SOON) and
// its weight is shaped by importance and pace, never by time-to-deadline alone.
const GOAL_URGENCY_OVERDUE_BASE_WEIGHT = 24;
const GOAL_URGENCY_DUE_SOON_BASE_WEIGHT = 14;
const GOAL_URGENCY_DUE_SOON_WINDOW_DAYS = 7;
const GOAL_URGENCY_APPROACHING_BASE_WEIGHT = 6;
const GOAL_URGENCY_APPROACHING_WINDOW_DAYS = 30;
const GOAL_URGENCY_BEHIND_PACE_BONUS = 8;
/** Goal.importance's schema default (1-5 range) - the neutral point importance scales around. */
const NEUTRAL_IMPORTANCE = 3;

function minutesSinceMidnight(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function daysRemaining(deadline: string, now: Date): number {
  const diffMs = new Date(deadline).getTime() - now.getTime();
  return Math.ceil(diffMs / 86_400_000);
}

/**
 * Progress behind where elapsed time (createdAt -> deadline) implies it
 * should be. Reimplemented here (not reused from goalPacing.ts) because that
 * module reads `new Date()` internally - this engine needs `now` injectable
 * for deterministic tests, same reasoning as every other reason below.
 */
function isBehindPace(goal: Goal, now: Date): boolean {
  if (!goal.deadline) return false;
  const start = new Date(goal.createdAt).getTime();
  const end = new Date(goal.deadline).getTime();
  if (end <= start) return false;

  const elapsedPercent = Math.max(0, Math.min(100, ((now.getTime() - start) / (end - start)) * 100));
  const progressPercent = goal.targetValue > 0 ? Math.min(100, (goal.currentValue / goal.targetValue) * 100) : 0;
  return progressPercent < elapsedPercent;
}

/**
 * Urgency base weight for how close a deadline is, using the same discrete-
 * window idiom as REMINDER_OVERDUE/REMINDER_DUE_SOON - `null` means the
 * deadline isn't close enough to be a reason at all.
 */
function urgencyBaseWeight(remainingDays: number): number | null {
  if (remainingDays <= 0) return GOAL_URGENCY_OVERDUE_BASE_WEIGHT;
  if (remainingDays <= GOAL_URGENCY_DUE_SOON_WINDOW_DAYS) return GOAL_URGENCY_DUE_SOON_BASE_WEIGHT;
  if (remainingDays <= GOAL_URGENCY_APPROACHING_WINDOW_DAYS) return GOAL_URGENCY_APPROACHING_BASE_WEIGHT;
  return null;
}

function deriveReasons(
  mission: Mission,
  activeGoals: Goal[],
  now: Date,
  isOnlyCandidate: boolean
): DecisionReason[] {
  const reasons: DecisionReason[] = [
    {
      code: 'HIGH_CATEGORY_PRIORITY',
      weight: CATEGORY_PRIORITY_WEIGHT[mission.priority],
      data: { priority: mission.priority },
    },
  ];

  if (mission.currentStreak > 0) {
    reasons.push({
      code: 'STREAK_AT_RISK',
      weight: Math.min(mission.currentStreak * STREAK_WEIGHT_PER_DAY, STREAK_WEIGHT_CAP),
      data: { streak: mission.currentStreak },
    });
  }

  if (mission.reminderTime) {
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const minutesUntilReminder = minutesSinceMidnight(mission.reminderTime) - nowMinutes;

    if (minutesUntilReminder <= 0) {
      reasons.push({
        code: 'REMINDER_OVERDUE',
        weight: REMINDER_OVERDUE_WEIGHT,
        data: { reminderTime: mission.reminderTime },
      });
    } else if (minutesUntilReminder <= REMINDER_DUE_SOON_WINDOW_MINUTES) {
      reasons.push({
        code: 'REMINDER_DUE_SOON',
        weight: REMINDER_DUE_SOON_WEIGHT,
        data: { reminderTime: mission.reminderTime },
      });
    }
  }

  if (mission.goalId) {
    const linkedGoal = activeGoals.find((goal) => goal._id === mission.goalId);
    if (linkedGoal) {
      reasons.push({
        code: 'SUPPORTS_ACTIVE_GOAL',
        weight: SUPPORTS_ACTIVE_GOAL_WEIGHT,
        data: { goalTitle: linkedGoal.title },
      });

      if (linkedGoal.deadline) {
        const remaining = daysRemaining(linkedGoal.deadline, now);
        const baseWeight = urgencyBaseWeight(remaining);

        if (baseWeight !== null) {
          const behindPace = isBehindPace(linkedGoal, now);
          const importanceFactor = linkedGoal.importance / NEUTRAL_IMPORTANCE;
          const weight =
            Math.round(baseWeight * importanceFactor) + (behindPace ? GOAL_URGENCY_BEHIND_PACE_BONUS : 0);

          reasons.push({
            code: 'GOAL_URGENCY',
            weight,
            data: {
              goalTitle: linkedGoal.title,
              daysRemaining: Math.max(0, remaining),
              importance: linkedGoal.importance,
              behindPace: behindPace ? 1 : 0,
            },
          });
        }
      }
    }
  }

  if (isOnlyCandidate) {
    reasons.push({ code: 'ONLY_PENDING_MISSION', weight: 0 });
  }

  return reasons;
}

/**
 * Deterministic, explainable "what should I do first" pick over today's
 * pending missions. Pure - inject `now` for reproducible tests.
 *
 * Depends only on inputs real user actions populate today: Mission.priority
 * (from the habit's chosen category), reminderTime, currentStreak, and a
 * real Habit->Goal link resolved against currently-active goals. Since
 * Sprint 7, Goal.importance and Goal.deadline are real, user-set values
 * (both goal-creation flows collect them) and feed GOAL_URGENCY - never
 * scored from deadline proximity alone, always shaped by importance and
 * whether progress is behind the pace the deadline implies (see
 * urgencyBaseWeight/isBehindPace above). Milestone linkage stays excluded -
 * no milestone picker UI exists yet, so it would still be false precision.
 */
export function pickFirstMission(
  missions: Mission[],
  activeGoals: Goal[],
  now: Date = new Date()
): DecisionResult {
  const candidates = missions.filter((mission) => !mission.completedToday && !mission.skippedToday);

  if (candidates.length === 0) {
    return { mission: null, score: 0, reasons: [] };
  }

  const scored = candidates.map((mission) => {
    const reasons = deriveReasons(mission, activeGoals, now, candidates.length === 1);
    const score = reasons.reduce((sum, reason) => sum + reason.weight, 0);
    return { mission, reasons, score };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const aTime = a.mission.reminderTime ?? '99:99';
    const bTime = b.mission.reminderTime ?? '99:99';
    if (aTime !== bTime) return aTime < bTime ? -1 : 1;
    return a.mission.id < b.mission.id ? -1 : a.mission.id > b.mission.id ? 1 : 0;
  });

  const winner = scored[0];
  return { mission: winner.mission, score: winner.score, reasons: winner.reasons };
}
