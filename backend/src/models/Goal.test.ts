import { Types } from 'mongoose';

import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from '../test/mongoMemory';
import { Goal } from './Goal';

beforeAll(connectTestDatabase);
afterEach(clearTestDatabase);
afterAll(disconnectTestDatabase);

const userId = new Types.ObjectId();

describe('Goal model validation', () => {
  it('defaults importance to 3 when not provided', async () => {
    const goal = await Goal.create({ userId, title: 'Run a 10k', targetValue: 10 });
    expect(goal.importance).toBe(3);
  });

  it('rejects importance below the 1-5 range', async () => {
    await expect(
      Goal.create({ userId, title: 'Run a 10k', targetValue: 10, importance: 0 })
    ).rejects.toThrow();
  });

  it('rejects importance above the 1-5 range', async () => {
    await expect(
      Goal.create({ userId, title: 'Run a 10k', targetValue: 10, importance: 6 })
    ).rejects.toThrow();
  });

  it('defaults dreamId to null when not provided', async () => {
    const goal = await Goal.create({ userId, title: 'Run a 10k', targetValue: 10 });
    expect(goal.dreamId).toBeNull();
  });

  it('accepts an explicit dreamId reference', async () => {
    const dreamId = new Types.ObjectId();
    const goal = await Goal.create({ userId, title: 'Run a 10k', targetValue: 10, dreamId });
    expect(goal.dreamId?.toString()).toBe(dreamId.toString());
  });

  it('still requires title and targetValue (pre-existing behavior)', async () => {
    await expect(Goal.create({ userId })).rejects.toThrow();
  });

  it('stores order and targetDate on embedded milestones', async () => {
    const goal = await Goal.create({
      userId,
      title: 'Run a 10k',
      targetValue: 10,
      milestones: [{ title: 'Run 5k', order: 0, targetDate: new Date('2026-08-01') }],
    });
    expect(goal.milestones[0].order).toBe(0);
    expect(goal.milestones[0].targetDate).toEqual(new Date('2026-08-01'));
  });
});
