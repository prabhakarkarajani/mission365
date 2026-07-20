import { Types } from 'mongoose';

import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from '../test/mongoMemory';
import { Dream } from './Dream';

beforeAll(connectTestDatabase);
afterEach(clearTestDatabase);
afterAll(disconnectTestDatabase);

const userId = new Types.ObjectId();

describe('Dream model validation', () => {
  it('creates a dream with just a title', async () => {
    const dream = await Dream.create({ userId, title: 'Become a published author' });
    expect(dream.title).toBe('Become a published author');
  });

  it('requires a title', async () => {
    await expect(Dream.create({ userId })).rejects.toThrow();
  });

  it('defaults status to active', async () => {
    const dream = await Dream.create({ userId, title: 'Become a published author' });
    expect(dream.status).toBe('active');
  });

  it('defaults description to an empty string', async () => {
    const dream = await Dream.create({ userId, title: 'Become a published author' });
    expect(dream.description).toBe('');
  });

  it('rejects a status outside active/archived', async () => {
    await expect(
      Dream.create({ userId, title: 'Become a published author', status: 'done' })
    ).rejects.toThrow();
  });
});
