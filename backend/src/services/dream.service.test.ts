import { Types } from 'mongoose';

import { eventBus } from '../lib/eventBus';
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from '../test/mongoMemory';
import { createDream, deleteDream, listDreams, updateDream } from './dream.service';

beforeAll(connectTestDatabase);
afterEach(clearTestDatabase);
afterAll(disconnectTestDatabase);

const userId = new Types.ObjectId().toString();

describe('dream.service createDream', () => {
  it('creates a dream owned by the given user', async () => {
    const dream = await createDream(userId, { title: 'Run my own studio' });
    expect(dream.title).toBe('Run my own studio');
    expect(dream.userId.toString()).toBe(userId);
  });

  it('emits a dream.created event with the new dream id and owner', async () => {
    const listener = jest.fn();
    const unsubscribe = eventBus.on('dream.created', listener);

    const dream = await createDream(userId, { title: 'Run my own studio' });

    expect(listener).toHaveBeenCalledWith({ dreamId: dream.id, userId });
    unsubscribe();
  });
});

describe('dream.service listDreams', () => {
  it('only returns dreams owned by the given user', async () => {
    await createDream(userId, { title: 'Mine' });
    await createDream(new Types.ObjectId().toString(), { title: 'Someone else\'s' });

    const dreams = await listDreams(userId);

    expect(dreams).toHaveLength(1);
    expect(dreams[0].title).toBe('Mine');
  });

  it('filters by status when provided', async () => {
    const dream = await createDream(userId, { title: 'Archived one' });
    await updateDream(userId, dream.id, { status: 'archived' });
    await createDream(userId, { title: 'Active one' });

    const archived = await listDreams(userId, 'archived');

    expect(archived).toHaveLength(1);
    expect(archived[0].title).toBe('Archived one');
  });
});

describe('dream.service updateDream', () => {
  it('updates fields on an owned dream', async () => {
    const dream = await createDream(userId, { title: 'Original title' });

    const updated = await updateDream(userId, dream.id, { title: 'Updated title' });

    expect(updated.title).toBe('Updated title');
  });

  it('rejects updating a dream owned by a different user', async () => {
    const dream = await createDream(new Types.ObjectId().toString(), { title: 'Not yours' });

    await expect(updateDream(userId, dream.id, { title: 'Hijacked' })).rejects.toThrow();
  });
});

describe('dream.service deleteDream', () => {
  it('removes an owned dream', async () => {
    const dream = await createDream(userId, { title: 'To be deleted' });

    await deleteDream(userId, dream.id);

    const dreams = await listDreams(userId);
    expect(dreams).toHaveLength(0);
  });

  it('rejects deleting a dream owned by a different user', async () => {
    const dream = await createDream(new Types.ObjectId().toString(), { title: 'Not yours' });

    await expect(deleteDream(userId, dream.id)).rejects.toThrow();
  });
});
