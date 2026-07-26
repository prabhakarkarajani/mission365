import type { DecisionReason } from '../domain/types';

/**
 * The only place a DecisionReason's `code`/`data` become user-facing copy.
 * The engine itself never returns strings - see Sprint 6's Impact Report.
 */
export function describeReason(reason: DecisionReason): string {
  switch (reason.code) {
    case 'HIGH_CATEGORY_PRIORITY': {
      const priority = String(reason.data?.priority ?? '').toLowerCase();
      return `This is a ${priority}-priority mission.`;
    }
    case 'STREAK_AT_RISK':
      return `You'd protect a ${reason.data?.streak}-day streak.`;
    case 'REMINDER_OVERDUE':
      return `Its reminder time (${reason.data?.reminderTime}) has already passed today.`;
    case 'REMINDER_DUE_SOON':
      return `Its reminder is coming up at ${reason.data?.reminderTime}.`;
    case 'SUPPORTS_ACTIVE_GOAL':
      return `It supports your goal "${reason.data?.goalTitle}".`;
    case 'GOAL_URGENCY': {
      const days = Number(reason.data?.daysRemaining ?? 0);
      const dueText = days <= 0 ? 'due today' : `due in ${days} day${days === 1 ? '' : 's'}`;
      const paceText = reason.data?.behindPace === 1 ? ", and you're behind pace on it" : '';
      return `"${reason.data?.goalTitle}" is ${dueText}${paceText} - this is urgent.`;
    }
    case 'ONLY_PENDING_MISSION':
      return "It's the only mission you have left today.";
    default:
      return '';
  }
}
