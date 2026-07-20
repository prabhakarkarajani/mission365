import { Types } from 'mongoose';

import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from '../test/mongoMemory';
import { createGoal, updateGoal } from './goal.service';

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

  it('passes through an explicit importance and dreamId', async () => {
    const dreamId = new Types.ObjectId().toString();
    const goal = await createGoal(userId, {
      title: 'Learn piano',
      targetValue: 20,
      importance: 5,
      dreamId,
    });
    expect(goal.importance).toBe(5);
    expect(goal.dreamId?.toString()).toBe(dreamId);
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
});

describe('goal.service updateGoal', () => {
  it('updates importance and dreamId on an existing goal', async () => {
    const goal = await createGoal(userId, { title: 'Learn piano', targetValue: 20 });
    const dreamId = new Types.ObjectId().toString();

    const updated = await updateGoal(userId, goal.id, { importance: 4, dreamId });

    expect(updated.importance).toBe(4);
    expect(updated.dreamId?.toString()).toBe(dreamId);
  });

  it('does not affect unrelated existing fields', async () => {
    const goal = await createGoal(userId, { title: 'Learn piano', targetValue: 20, category: 'skill' });

    const updated = await updateGoal(userId, goal.id, { importance: 2 });

    expect(updated.category).toBe('skill');
    expect(updated.title).toBe('Learn piano');
  });
});
