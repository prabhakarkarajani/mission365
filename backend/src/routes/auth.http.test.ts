import jwt from 'jsonwebtoken';
import request from 'supertest';

import { createApp } from '../app';
import { env } from '../config/env';
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from '../test/mongoMemory';

beforeAll(connectTestDatabase);
afterEach(clearTestDatabase);
afterAll(disconnectTestDatabase);

const app = createApp();

const CREDENTIALS = { name: 'Ada Lovelace', email: 'ada@example.com', password: 'correct-horse-battery' };

function register(overrides: Partial<typeof CREDENTIALS> = {}) {
  return request(app)
    .post('/api/v1/auth/register')
    .send({ ...CREDENTIALS, ...overrides });
}

describe('POST /api/v1/auth/register', () => {
  it('registers successfully and returns a user and both tokens', async () => {
    const res = await register();

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toMatchObject({ name: CREDENTIALS.name, email: CREDENTIALS.email });
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(typeof res.body.data.accessToken).toBe('string');
    expect(typeof res.body.data.refreshToken).toBe('string');
  });

  it('rejects a duplicate email', async () => {
    await register();
    const res = await register();

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/v1/auth/login', () => {
  it('logs in successfully with the correct password', async () => {
    await register();
    const res = await request(app).post('/api/v1/auth/login').send({
      email: CREDENTIALS.email,
      password: CREDENTIALS.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.accessToken).toBe('string');
    expect(typeof res.body.data.refreshToken).toBe('string');
  });

  it('rejects an invalid password', async () => {
    await register();
    const res = await request(app).post('/api/v1/auth/login').send({
      email: CREDENTIALS.email,
      password: 'the-wrong-password',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects an unknown email', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'nobody@example.com',
      password: CREDENTIALS.password,
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/v1/auth/refresh', () => {
  it('issues a new token pair for a valid refresh token', async () => {
    const { body } = await register();
    const res = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: body.data.refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.accessToken).toBe('string');
    expect(typeof res.body.data.refreshToken).toBe('string');
  });

  it('rejects an expired refresh token', async () => {
    const { body } = await register();
    const decoded = jwt.decode(body.data.refreshToken) as { sub: string; tokenVersion: number };
    const expiredToken = jwt.sign({ sub: decoded.sub, tokenVersion: decoded.tokenVersion }, env.JWT_REFRESH_SECRET, {
      expiresIn: -10, // already expired the instant it's signed
    });

    const res = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: expiredToken });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects an invalid refresh token', async () => {
    const res = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: 'not-a-real-token' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe('protected endpoint (GET /api/v1/auth/me)', () => {
  it('rejects a request with no token', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('accepts a request with a valid access token', async () => {
    const { body } = await register();
    const res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${body.data.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(CREDENTIALS.email);
  });
});

describe('CORS configuration', () => {
  it('echoes the configured Access-Control-Allow-Origin for a cross-origin request', async () => {
    const res = await request(app).get('/health').set('Origin', 'https://example.com');

    // env.CORS_ORIGIN defaults to "*" in the test environment (see
    // test/setupEnv.ts and config/env.ts) - this asserts the cors()
    // middleware in app.ts actually reflects whatever env.CORS_ORIGIN
    // resolves to, not that "*" itself is safe (that's covered by
    // config/env.test.ts's production-only rejection of "*").
    expect(res.headers['access-control-allow-origin']).toBe(env.CORS_ORIGIN);
  });
});

describe('full authentication journey', () => {
  it('register -> login -> protected -> refresh -> protected again', async () => {
    const registerRes = await register();
    expect(registerRes.status).toBe(201);

    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: CREDENTIALS.email,
      password: CREDENTIALS.password,
    });
    expect(loginRes.status).toBe(200);
    const { accessToken, refreshToken } = loginRes.body.data;

    const firstMeRes = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${accessToken}`);
    expect(firstMeRes.status).toBe(200);
    expect(firstMeRes.body.data.user.email).toBe(CREDENTIALS.email);

    const refreshRes = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });
    expect(refreshRes.status).toBe(200);
    const newAccessToken = refreshRes.body.data.accessToken;
    expect(typeof newAccessToken).toBe('string');

    const secondMeRes = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${newAccessToken}`);
    expect(secondMeRes.status).toBe(200);
    expect(secondMeRes.body.data.user.email).toBe(CREDENTIALS.email);
  });
});
