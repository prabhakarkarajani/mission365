import type { Goal } from '@/features/goals/domain/types';
import type { Mission } from '@/features/missions/types/mission.types';

import { pickFirstMission } from './decisionEngine';

const NOW = new Date(2026, 6, 21, 9, 0); // 09:00

function makeMission(overrides: Partial<Mission> = {}): Mission {
  return {
    id: 'mission-1',
    title: 'Test mission',
    missionType: 'HABIT',
    source: 'mission-1',
    completedToday: false,
    skippedToday: false,
    goalId: null,
    milestoneId: null,
    priority: 'MEDIUM',
    reminderTime: null,
    currentStreak: 0,
    ...overrides,
  };
}

function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    _id: 'goal-1',
    userId: 'user-1',
    dreamId: null,
    title: 'Test goal',
    category: 'health',
    icon: 'flag-outline',
    color: '#000000',
    importance: 3,
    targetValue: 10,
    currentValue: 0,
    unit: '',
    deadline: null,
    status: 'active',
    milestones: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('pickFirstMission', () => {
  it('returns null with no reasons when there are no pending missions', () => {
    const result = pickFirstMission([makeMission({ completedToday: true })], [], NOW);
    expect(result).toEqual({ mission: null, score: 0, reasons: [] });
  });

  it('excludes completed and skipped missions from candidates', () => {
    const completed = makeMission({ id: 'a', completedToday: true });
    const skipped = makeMission({ id: 'b', skippedToday: true });
    const pending = makeMission({ id: 'c' });
    const result = pickFirstMission([completed, skipped, pending], [], NOW);
    expect(result.mission?.id).toBe('c');
  });

  it('picks the higher category-priority mission when nothing else differs', () => {
    const low = makeMission({ id: 'low', priority: 'LOW' });
    const critical = makeMission({ id: 'critical', priority: 'CRITICAL' });
    const result = pickFirstMission([low, critical], [], NOW);
    expect(result.mission?.id).toBe('critical');
    expect(result.reasons).toContainEqual({
      code: 'HIGH_CATEGORY_PRIORITY',
      weight: 40,
      data: { priority: 'CRITICAL' },
    });
  });

  it('adds a capped streak-protection bonus proportional to currentStreak', () => {
    const noStreak = makeMission({ id: 'none', currentStreak: 0 });
    const shortStreak = makeMission({ id: 'short', currentStreak: 3 });
    const longStreak = makeMission({ id: 'long', currentStreak: 30 });

    expect(pickFirstMission([noStreak], [], NOW).reasons).not.toContainEqual(
      expect.objectContaining({ code: 'STREAK_AT_RISK' })
    );
    expect(pickFirstMission([shortStreak], [], NOW).reasons).toContainEqual({
      code: 'STREAK_AT_RISK',
      weight: 6,
      data: { streak: 3 },
    });
    // capped at 20 even though 30 * 2 = 60
    expect(pickFirstMission([longStreak], [], NOW).reasons).toContainEqual({
      code: 'STREAK_AT_RISK',
      weight: 20,
      data: { streak: 30 },
    });
  });

  it('flags an overdue reminder', () => {
    const mission = makeMission({ reminderTime: '08:00' }); // before 09:00 "now"
    const result = pickFirstMission([mission], [], NOW);
    expect(result.reasons).toContainEqual({
      code: 'REMINDER_OVERDUE',
      weight: 15,
      data: { reminderTime: '08:00' },
    });
  });

  it('flags a reminder due within the next two hours as due-soon, not overdue', () => {
    const mission = makeMission({ reminderTime: '10:30' }); // 90 min after 09:00 "now"
    const result = pickFirstMission([mission], [], NOW);
    expect(result.reasons).toContainEqual({
      code: 'REMINDER_DUE_SOON',
      weight: 8,
      data: { reminderTime: '10:30' },
    });
  });

  it('does not flag a reminder more than two hours away', () => {
    const mission = makeMission({ reminderTime: '18:00' });
    const result = pickFirstMission([mission], [], NOW);
    expect(result.reasons).not.toContainEqual(expect.objectContaining({ code: 'REMINDER_DUE_SOON' }));
    expect(result.reasons).not.toContainEqual(expect.objectContaining({ code: 'REMINDER_OVERDUE' }));
  });

  it('adds a goal-alignment reason only when goalId resolves to a currently-active goal', () => {
    const goal = makeGoal({ _id: 'goal-1', title: 'Run a 5k' });
    const linked = makeMission({ id: 'linked', goalId: 'goal-1' });
    const result = pickFirstMission([linked], [goal], NOW);
    expect(result.reasons).toContainEqual({
      code: 'SUPPORTS_ACTIVE_GOAL',
      weight: 10,
      data: { goalTitle: 'Run a 5k' },
    });
  });

  it('does not fabricate a goal-alignment reason for a goalId with no matching active goal', () => {
    // e.g. the linked goal was completed/archived and so isn't in the active-goals list
    const linked = makeMission({ id: 'linked', goalId: 'goal-completed' });
    const result = pickFirstMission([linked], [], NOW);
    expect(result.reasons).not.toContainEqual(expect.objectContaining({ code: 'SUPPORTS_ACTIVE_GOAL' }));
  });

  it('adds a GOAL_URGENCY reason for an overdue linked goal, scaled by default importance', () => {
    const goal = makeGoal({
      _id: 'goal-1',
      title: 'Run a 5k',
      importance: 3,
      deadline: new Date(2026, 6, 20, 0, 0).toISOString(), // yesterday relative to NOW
      currentValue: 10,
      targetValue: 10, // 100% progress -> never behind pace, isolates the base weight
    });
    const linked = makeMission({ id: 'linked', goalId: 'goal-1' });
    const result = pickFirstMission([linked], [goal], NOW);
    expect(result.reasons).toContainEqual({
      code: 'GOAL_URGENCY',
      weight: 24,
      data: { goalTitle: 'Run a 5k', daysRemaining: 0, importance: 3, behindPace: 0 },
    });
  });

  it('amplifies GOAL_URGENCY weight for a high-importance goal', () => {
    const goal = makeGoal({
      _id: 'goal-1',
      importance: 5,
      deadline: new Date(2026, 6, 20, 0, 0).toISOString(),
      currentValue: 10,
      targetValue: 10,
    });
    const linked = makeMission({ id: 'linked', goalId: 'goal-1' });
    const result = pickFirstMission([linked], [goal], NOW);
    expect(result.reasons).toContainEqual(expect.objectContaining({ code: 'GOAL_URGENCY', weight: 40 }));
  });

  it('dampens GOAL_URGENCY weight for a low-importance goal', () => {
    const goal = makeGoal({
      _id: 'goal-1',
      importance: 1,
      deadline: new Date(2026, 6, 20, 0, 0).toISOString(),
      currentValue: 10,
      targetValue: 10,
    });
    const linked = makeMission({ id: 'linked', goalId: 'goal-1' });
    const result = pickFirstMission([linked], [goal], NOW);
    expect(result.reasons).toContainEqual(expect.objectContaining({ code: 'GOAL_URGENCY', weight: 8 }));
  });

  it('adds a behind-pace bonus when progress trails the time elapsed toward the deadline', () => {
    const goal = makeGoal({
      _id: 'goal-1',
      importance: 3,
      createdAt: new Date(2026, 6, 1, 0, 0).toISOString(),
      deadline: new Date(2026, 6, 26, 0, 0).toISOString(), // due-soon window (5 days out)
      currentValue: 3,
      targetValue: 10, // 30% progress, well behind the ~81% of elapsed time
    });
    const linked = makeMission({ id: 'linked', goalId: 'goal-1' });
    const result = pickFirstMission([linked], [goal], NOW);
    expect(result.reasons).toContainEqual(
      expect.objectContaining({ code: 'GOAL_URGENCY', weight: 22, data: expect.objectContaining({ behindPace: 1 }) })
    );
  });

  it('does not add GOAL_URGENCY when the linked goal has no deadline', () => {
    const goal = makeGoal({ _id: 'goal-1', deadline: null });
    const linked = makeMission({ id: 'linked', goalId: 'goal-1' });
    const result = pickFirstMission([linked], [goal], NOW);
    expect(result.reasons).not.toContainEqual(expect.objectContaining({ code: 'GOAL_URGENCY' }));
  });

  it('does not add GOAL_URGENCY when the deadline is more than 30 days away', () => {
    const goal = makeGoal({ _id: 'goal-1', deadline: new Date(2026, 7, 25, 0, 0).toISOString() });
    const linked = makeMission({ id: 'linked', goalId: 'goal-1' });
    const result = pickFirstMission([linked], [goal], NOW);
    expect(result.reasons).not.toContainEqual(expect.objectContaining({ code: 'GOAL_URGENCY' }));
  });

  it('adds ONLY_PENDING_MISSION when there is exactly one candidate', () => {
    const result = pickFirstMission([makeMission()], [], NOW);
    expect(result.reasons).toContainEqual({ code: 'ONLY_PENDING_MISSION', weight: 0 });
  });

  it('does not add ONLY_PENDING_MISSION when there are multiple candidates', () => {
    const a = makeMission({ id: 'a' });
    const b = makeMission({ id: 'b' });
    const result = pickFirstMission([a, b], [], NOW);
    expect(result.reasons).not.toContainEqual(expect.objectContaining({ code: 'ONLY_PENDING_MISSION' }));
  });

  it('breaks a score tie by earliest reminderTime', () => {
    const later = makeMission({ id: 'later', reminderTime: '20:00' });
    const earlier = makeMission({ id: 'earlier', reminderTime: '19:00' });
    const result = pickFirstMission([later, earlier], [], NOW);
    expect(result.mission?.id).toBe('earlier');
  });

  it('breaks a score-and-time tie by mission id, deterministically', () => {
    const b = makeMission({ id: 'b' });
    const a = makeMission({ id: 'a' });
    const result = pickFirstMission([b, a], [], NOW);
    expect(result.mission?.id).toBe('a');
  });

  it('score always equals the sum of the returned reasons weights', () => {
    const goal = makeGoal({
      _id: 'goal-1',
      importance: 4,
      deadline: new Date(2026, 6, 20, 0, 0).toISOString(),
    });
    const mission = makeMission({ priority: 'HIGH', currentStreak: 5, reminderTime: '08:30', goalId: 'goal-1' });
    const result = pickFirstMission([mission], [goal], NOW);
    expect(result.reasons).toContainEqual(expect.objectContaining({ code: 'GOAL_URGENCY' }));
    const total = result.reasons.reduce((sum, r) => sum + r.weight, 0);
    expect(result.score).toBe(total);
  });
});
