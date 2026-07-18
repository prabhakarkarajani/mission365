import { z } from 'zod';

import {
  getUserById,
  loginUser,
  refreshTokens,
  registerUser,
  revokeAllSessions,
} from '../services/auth.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { serializeUser } from '../utils/serializeUser';
import { ApiError } from '../utils/ApiError';

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body as z.infer<typeof registerSchema>;
  const { user, tokens } = await registerUser(name, email, password);
  sendSuccess(res, 201, { user: serializeUser(user), ...tokens });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body as z.infer<typeof loginSchema>;
  const { user, tokens } = await loginUser(email, password);
  sendSuccess(res, 200, { user: serializeUser(user), ...tokens });
});

export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body as z.infer<typeof refreshSchema>;
  const tokens = await refreshTokens(refreshToken);
  sendSuccess(res, 200, tokens);
});

export const logout = asyncHandler(async (req, res) => {
  if (!req.userId) {
    throw ApiError.unauthorized();
  }
  await revokeAllSessions(req.userId);
  sendSuccess(res, 200, { loggedOut: true });
});

export const me = asyncHandler(async (req, res) => {
  if (!req.userId) {
    throw ApiError.unauthorized();
  }
  const user = await getUserById(req.userId);
  sendSuccess(res, 200, { user: serializeUser(user) });
});
