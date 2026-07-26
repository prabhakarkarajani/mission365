import request from 'supertest';

import { createApp } from '../app';
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from '../test/mongoMemory';

beforeAll(connectTestDatabase);
afterEach(clearTestDatabase);
afterAll(disconnectTestDatabase);

const app = createApp();

const CREDENTIALS = { name: 'Ada Lovelace', email: 'ada@example.com', password: 'correct-horse-battery' };

async function registerAndGetToken(): Promise<string> {
  const res = await request(app).post('/api/v1/auth/register').send(CREDENTIALS);
  return res.body.data.accessToken as string;
}

describe('GET /api/v1/coach/suggestions', () => {
  it('rejects a request with no token', async () => {
    const res = await request(app).get('/api/v1/coach/suggestions');
    expect(res.status).toBe(401);
  });

  it('returns the suggestion cards, with mood-check gating only on the emotionally-loaded ones', async () => {
    const token = await registerAndGetToken();
    const res = await request(app).get('/api/v1/coach/suggestions').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.cards.length).toBeGreaterThan(0);

    const moodGated = res.body.data.cards.filter((c: { requiresMoodCheck: boolean }) => c.requiresMoodCheck);
    expect(moodGated.map((c: { id: string }) => c.id).sort()).toEqual(['dont-know-start', 'feeling-overwhelmed']);
  });
});

describe('POST /api/v1/coach/chat', () => {
  it('rejects a request with no token', async () => {
    const res = await request(app)
      .post('/api/v1/coach/chat')
      .send({ messages: [{ role: 'user', content: 'motivate me' }] });
    expect(res.status).toBe(401);
  });

  it('rejects an empty messages array', async () => {
    const token = await registerAndGetToken();
    const res = await request(app)
      .post('/api/v1/coach/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ messages: [] });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects a message over the length limit', async () => {
    const token = await registerAndGetToken();
    const res = await request(app)
      .post('/api/v1/coach/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ messages: [{ role: 'user', content: 'x'.repeat(4001) }] });
    expect(res.status).toBe(400);
  });

  it('returns a grounded assistant reply for a valid message (AI_PROVIDER=mock in tests)', async () => {
    const token = await registerAndGetToken();
    const res = await request(app)
      .post('/api/v1/coach/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ messages: [{ role: 'user', content: 'asdkjfhaskdjfh' }] });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.reply.role).toBe('assistant');
    // The fallback greeting addresses the user by their real first name -
    // proves context was actually assembled from the authenticated user,
    // not a stub/hardcoded value.
    expect(res.body.data.reply.content).toContain('Ada');
  });

  it('accepts an optional cardId and mood alongside the message', async () => {
    const token = await registerAndGetToken();
    const res = await request(app)
      .post('/api/v1/coach/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({
        messages: [{ role: 'user', content: "I'm feeling overwhelmed right now." }],
        cardId: 'feeling-overwhelmed',
        mood: 'bad',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.reply.content).toMatch(/okay/i);
  });

  it('rejects an invalid mood value', async () => {
    const token = await registerAndGetToken();
    const res = await request(app)
      .post('/api/v1/coach/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ messages: [{ role: 'user', content: 'hi' }], mood: 'furious' });

    expect(res.status).toBe(400);
  });
});
