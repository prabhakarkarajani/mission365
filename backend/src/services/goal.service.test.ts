import { Types } from 'mongoose';

import { eventBus } from '../lib/eventBus';
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from '../test/mongoMemory';
import { createGoal, deleteGoal, updateGoal } from './goal.service';
import { createDream } from './dream.service';
import { createHabit } from './habit.service';
import { Habit } from '../models/Habit';

beforeAll(connectTestDatabase);
afterEach(clearTestDatabase);
afterAll(disconnectTestDatabase);

const userId = new Types.ObjectId().toString();

describe('goal.service createGoal', () => {
  it('creates a goal with default importance when none is supplied', async () => {
    const goal = await createGoal(userId, { title: 'Learn piano', targetValue: 20 });
    expect(goal.importance).toBe(3);
    expect(goal.dreamId).toBeNull();
  });

  it('passes through an explicit importance and an owned dreamId', async () => {
    const dream = await createDream(userId, { title: 'Become a musician' });
    const goal = await createGoal(userId, {
      title: 'Learn piano',
      targetValue: 20,
      importance: 5,
      dreamId: dream.id,
    });
    expect(goal.importance).toBe(5);
    expect(goal.dreamId?.toString()).toBe(dream.id);
  });

  it('rejects a dreamId that does not belong to any dream', async () => {
    const dreamId = new Types.ObjectId().toString();
    await expect(
      createGoal(userId, { title: 'Learn piano', targetValue: 20, dreamId })
    ).rejects.toThrow();
  });

  it('rejects a dreamId owned by a different user', async () => {
    const otherUsersDream = await createDream(new Types.ObjectId().toString(), { title: 'Not yours' });
    await expect(
      createGoal(userId, { title: 'Learn piano', targetValue: 20, dreamId: otherUsersDream.id })
    ).rejects.toThrow();
  });

  it('assigns sequential order to milestones that omit it', async () => {
    const goal = await createGoal(userId, {
      title: 'Learn piano',
      targetValue: 20,
      milestones: [{ title: 'Learn scales' }, { title: 'Learn a song' }],
    });
    expect(goal.milestones[0].order).toBe(0);
    expect(goal.milestones[1].order).toBe(1);
  });

  it('preserves an explicitly provided milestone order', async () => {
    const goal = await createGoal(userId, {
      title: 'Learn piano',
      targetValue: 20,
      milestones: [{ title: 'Learn a song', order: 5 }],
    });
    expect(goal.milestones[0].order).toBe(5);
  });

  it('emits goal.created with source "manual" when no dreamId is given', async () => {
    const listener = jest.fn();
    const unsubscribe = eventBus.on('goal.created', listener);

    const goal = await createGoal(userId, { title: 'Learn piano', targetValue: 20 });

    expect(listener).toHaveBeenCalledWith({ goalId: goal.id, userId, source: 'manual' });
    unsubscribe();
  });

  it('emits goal.created with source "dream_conversion" when a dreamId is given', async () => {
    const dream = await createDream(userId, { title: 'Become a musician' });
    const listener = jest.fn();
    const unsubscribe = eventBus.on('goal.created', listener);

    const goal = await createGoal(userId, { title: 'Learn piano', targetValue: 20, dreamId: dream.id });

    expect(listener).toHaveBeenCalledWith({ goalId: goal.id, userId, source: 'dream_conversion' });
    unsubscribe();
  });
});

describe('goal.service updateGoal', () => {
  it('updates importance and dreamId on an existing goal', async () => {
    const goal = await createGoal(userId, { title: 'Learn piano', targetValue: 20 });
    const dream = await createDream(userId, { title: 'Become a musician' });

    const updated = await updateGoal(userId, goal.id, { importance: 4, dreamId: dream.id });

    expect(updated.importance).toBe(4);
    expect(updated.dreamId?.toString()).toBe(dream.id);
  });

  it('rejects updating to a dreamId that does not belong to any dream', async () => {
    const goal = await createGoal(userId, { title: 'Learn piano', targetValue: 20 });
    const dreamId = new Types.ObjectId().toString();

    await expect(updateGoal(userId, goal.id, { dreamId })).rejects.toThrow();
  });

  it('rejects updating to a dreamId owned by a different user', async () => {
    const goal = await createGoal(userId, { title: 'Learn piano', targetValue: 20 });
    const otherUsersDream = await createDream(new Types.ObjectId().toString(), { title: 'Not yours' });

    await expect(updateGoal(userId, goal.id, { dreamId: otherUsersDream.id })).rejects.toThrow();
  });

  it('allows clearing dreamId back to null without ownership validation', async () => {
    const dream = await createDream(userId, { title: 'Become a musician' });
    const goal = await createGoal(userId, { title: 'Learn piano', targetValue: 20, dreamId: dream.id });

    const updated = await updateGoal(userId, goal.id, { dreamId: null });

    expect(updated.dreamId).toBeNull();
  });

  it('does not affect unrelated existing fields', async () => {
    const goal = await createGoal(userId, { title: 'Learn piano', targetValue: 20, category: 'skill' });

    const updated = await updateGoal(userId, goal.id, { importance: 2 });

    expect(updated.category).toBe('skill');
    expect(updated.title).toBe('Learn piano');
  });
});

describe('goal.service deleteGoal', () => {
  it('severs linked habits\' goalId/milestoneId instead of leaving a dangling reference', async () => {
    const goal = await createGoal(userId, {
      title: 'Learn piano',
      targetValue: 20,
      milestones: [{ title: 'Learn scales' }],
    });
    const milestoneId = goal.milestones[0].id as string;
    const habit = await createHabit(userId, { name: 'Practice scales', goalId: goal.id, milestoneId });

    await deleteGoal(userId, goal.id);

    const reloaded = await Habit.findById(habit.id);
    expect(reloaded!.goalId).toBeNull();
    expect(reloaded!.milestoneId).toBeNull();
  });

  it('does not affect habits linked to a different goal', async () => {
    const goal = await createGoal(userId, { title: 'Learn piano', targetValue: 20 });
    const otherGoal = await createGoal(userId, { title: 'Run a 10k', targetValue: 10 });
    const habit = await createHabit(userId, { name: 'Run', goalId: otherGoal.id });

    await deleteGoal(userId, goal.id);

    const reloaded = await Habit.findById(habit.id);
    expect(reloaded!.goalId?.toString()).toBe(otherGoal.id);
  });
});
