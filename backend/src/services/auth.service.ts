import bcrypt from 'bcryptjs';

import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt';

const SALT_ROUNDS = 12;

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

function issueTokens(userId: string, email: string, tokenVersion: number): AuthTokens {
  return {
    accessToken: signAccessToken({ sub: userId, email }),
    refreshToken: signRefreshToken({ sub: userId, tokenVersion }),
  };
}

export async function registerUser(name: string, email: string, password: string) {
  const existing = await User.findOne({ email }).lean();
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ name, email, passwordHash });

  const tokens = issueTokens(user.id, user.email, 0);
  return { user, tokens };
}

export async function loginUser(email: string, password: string) {
  const user = await User.findOne({ email }).select('+passwordHash +tokenVersion');
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const tokens = issueTokens(user.id, user.email, user.tokenVersion);
  return { user, tokens };
}

export async function refreshTokens(refreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.findById(payload.sub).select('+tokenVersion');
  if (!user || user.tokenVersion !== payload.tokenVersion) {
    throw ApiError.unauthorized('Refresh token has been revoked');
  }

  return issueTokens(user.id, user.email, user.tokenVersion);
}

export async function revokeAllSessions(userId: string) {
  await User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });
}

export async function getUserById(userId: string) {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  return user;
}
