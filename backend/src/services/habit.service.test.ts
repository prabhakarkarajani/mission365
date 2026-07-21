import { Types } from 'mongoose';

import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from '../test/mongoMemory';
import { createHabit, getTodayOverview, setHabitCompletion, setHabitSkip, updateHabit } from './habit.service';
import { createGoal } from './goal.service';

beforeAll(connectTestDatabase);
afterEach(clearTestDatabase);
afterAll(disconnectTestDatabase);

const userId = new Types.ObjectId().toString();
const date = '2026-07-21';

describe('habit.service setHabitSkip', () => {
  it('marks a habit skipped for the given date', async () => {
    const habit = await createHabit(userId, { name: 'Read' });
    await setHabitSkip(userId, habit.id, date, true);

    const overview = await getTodayOverview(userId, date);
    const entry = overview.find((o) => o.habit.id === habit.id)!;
    expect(entry.skipped).toBe(true);
    expect(entry.completed).toBe(false);
  });

  it('clears the skip when unskipped, returning to pending', async () => {
    const habit = await createHabit(userId, { name: 'Read' });
    await setHabitSkip(userId, habit.id, date, true);
    await setHabitSkip(userId, habit.id, date, false);

    const overview = await getTodayOverview(userId, date);
    const entry = overview.find((o) => o.habit.id === habit.id)!;
    expect(entry.skipped).toBe(false);
    expect(entry.completed).toBe(false);
  });

  it('completing a previously-skipped habit clears the skipped flag', async () => {
    const habit = await createHabit(userId, { name: 'Read' });
    await setHabitSkip(userId, habit.id, date, true);
    await setHabitCompletion(userId, habit.id, date, true);

    const overview = await getTodayOverview(userId, date);
    const entry = overview.find((o) => o.habit.id === habit.id)!;
    expect(entry.completed).toBe(true);
    expect(entry.skipped).toBe(false);
  });

  it('skipping a previously-completed habit clears the completed flag', async () => {
    const habit = await createHabit(userId, { name: 'Read' });
    await setHabitCompletion(userId, habit.id, date, true);
    await setHabitSkip(userId, habit.id, date, true);

    const overview = await getTodayOverview(userId, date);
    const entry = overview.find((o) => o.habit.id === habit.id)!;
    expect(entry.completed).toBe(false);
    expect(entry.skipped).toBe(true);
  });

  it('rejects skipping a habit owned by a different user', async () => {
    const habit = await createHabit(new Types.ObjectId().toString(), { name: 'Not yours' });
    await expect(setHabitSkip(userId, habit.id, date, true)).rejects.toThrow();
  });
});

describe('habit.service Goal/Milestone linkage', () => {
  it('creates a habit linked to an owned goal', async () => {
    const goal = await createGoal(userId, { title: 'Run a 10k', targetValue: 10 });
    const habit = await createHabit(userId, { name: 'Run', goalId: goal.id });
    expect(habit.goalId?.toString()).toBe(goal.id);
    expect(habit.milestoneId).toBeNull();
  });

  it('creates a habit linked to a specific milestone within an owned goal', async () => {
    const goal = await createGoal(userId, {
      title: 'Run a 10k',
      targetValue: 10,
      milestones: [{ title: 'Run 5k' }],
    });
    const milestoneId = goal.milestones[0].id as string;
    const habit = await createHabit(userId, { name: 'Run', goalId: goal.id, milestoneId });
    expect(habit.goalId?.toString()).toBe(goal.id);
    expect(habit.milestoneId?.toString()).toBe(milestoneId);
  });

  it('rejects a goalId that does not belong to any goal', async () => {
    const goalId = new Types.ObjectId().toString();
    await expect(createHabit(userId, { name: 'Run', goalId })).rejects.toThrow();
  });

  it('rejects a goalId owned by a different user', async () => {
    const otherUsersGoal = await createGoal(new Types.ObjectId().toString(), {
      title: 'Not yours',
      targetValue: 10,
    });
    await expect(createHabit(userId, { name: 'Run', goalId: otherUsersGoal.id })).rejects.toThrow();
  });

  it('rejects a milestoneId supplied without a goalId', async () => {
    const milestoneId = new Types.ObjectId().toString();
    await expect(createHabit(userId, { name: 'Run', milestoneId })).rejects.toThrow();
  });

  it('rejects a milestoneId that does not belong to the given goal', async () => {
    const goal = await createGoal(userId, { title: 'Run a 10k', targetValue: 10 });
    const milestoneId = new Types.ObjectId().toString();
    await expect(createHabit(userId, { name: 'Run', goalId: goal.id, milestoneId })).rejects.toThrow();
  });

  it('allows updateHabit to clear an existing goal link to null', async () => {
    const goal = await createGoal(userId, { title: 'Run a 10k', targetValue: 10 });
    const habit = await createHabit(userId, { name: 'Run', goalId: goal.id });

    const updated = await updateHabit(userId, habit.id, { goalId: null });

    expect(updated.goalId).toBeNull();
  });

  it('rejects updateHabit setting an unowned goalId', async () => {
    const habit = await createHabit(userId, { name: 'Run' });
    const otherUsersGoal = await createGoal(new Types.ObjectId().toString(), {
      title: 'Not yours',
      targetValue: 10,
    });

    await expect(updateHabit(userId, habit.id, { goalId: otherUsersGoal.id })).rejects.toThrow();
  });

  it('validates a milestoneId-only update against the habit\'s existing goalId', async () => {
    const goal = await createGoal(userId, {
      title: 'Run a 10k',
      targetValue: 10,
      milestones: [{ title: 'Run 5k' }],
    });
    const milestoneId = goal.milestones[0].id as string;
    const habit = await createHabit(userId, { name: 'Run', goalId: goal.id });

    const updated = await updateHabit(userId, habit.id, { milestoneId });

    expect(updated.milestoneId?.toString()).toBe(milestoneId);
  });

  it('rejects a milestoneId-only update when the habit has no existing goalId', async () => {
    const habit = await createHabit(userId, { name: 'Run' });
    const milestoneId = new Types.ObjectId().toString();

    await expect(updateHabit(userId, habit.id, { milestoneId })).rejects.toThrow();
  });
});

describe('habit.service getTodayOverview', () => {
  it('defaults to pending (not completed, not skipped) with no log', async () => {
    const habit = await createHabit(userId, { name: 'Read' });

    const overview = await getTodayOverview(userId, date);
    const entry = overview.find((o) => o.habit.id === habit.id)!;
    expect(entry.completed).toBe(false);
    expect(entry.skipped).toBe(false);
  });

  it('reflects a mix of completed, skipped, and pending habits independently', async () => {
    const completedHabit = await createHabit(userId, { name: 'Meditate' });
    const skippedHabit = await createHabit(userId, { name: 'Run' });
    const pendingHabit = await createHabit(userId, { name: 'Journal' });

    await setHabitCompletion(userId, completedHabit.id, date, true);
    await setHabitSkip(userId, skippedHabit.id, date, true);

    const overview = await getTodayOverview(userId, date);
    const byId = new Map(overview.map((o) => [o.habit.id, o]));

    expect(byId.get(completedHabit.id)).toMatchObject({ completed: true, skipped: false });
    expect(byId.get(skippedHabit.id)).toMatchObject({ completed: false, skipped: true });
    expect(byId.get(pendingHabit.id)).toMatchObject({ completed: false, skipped: false });
  });
});
