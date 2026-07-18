import { listAchievementsForUser } from '../services/achievement.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';

export const listAll = asyncHandler(async (req, res) => {
  const achievements = await listAchievementsForUser(req.userId!);
  sendSuccess(res, 200, { achievements });
});
