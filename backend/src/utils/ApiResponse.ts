import type { Response } from 'express';

export function sendSuccess<T>(res: Response, statusCode: number, data: T, meta?: Record<string, unknown>) {
  return res.status(statusCode).json({ success: true, data, ...(meta ? { meta } : {}) });
}
