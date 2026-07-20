import { Goal } from '../models/Goal';
import { ApiError } from '../utils/ApiError';
import { awardXp, checkAndUnlockAchievements, recordActivity } from './gamification.service';

const XP_PER_GOAL_COMPLETION = 150;

export interface CreateGoalInput {
  title: string;
  category?: string;
  icon?: string;
  color?: string;
  dreamId?: string | null;
  importance?: number;
  targetValue: number;
  unit?: string;
  deadline?: string | null;
  milestones?: Array<{ title: string; order?: number; targetDate?: string | null }>;
}

export async function listGoals(userId: string, status?: string) {
  return Goal.find({ userId, ...(status ? { status } : {}) }).sort({ createdAt: -1 });
}

async function findOwnedGoal(userId: string, goalId: string) {
  const goal = await Goal.findOne({ _id: goalId, userId });
  if (!goal) {
    throw ApiError.notFound('Goal not found');
  }
  return goal;
}

export async function createGoal(userId: string, input: CreateGoalInput) {
  return Goal.create({
    userId,
    dreamId: input.dreamId ?? null,
    title: input.title,
    category: input.category,
    icon: input.icon,
    color: input.color,
    importance: input.importance,
    targetValue: input.targetValue,
    unit: input.unit,
    deadline: input.deadline ?? null,
    milestones: (input.milestones ?? []).map((milestone, index) => ({
      title: milestone.title,
      order: milestone.order ?? index,
      targetDate: milestone.targetDate ?? null,
    })),
  });
}

export async function updateGoal(userId: string, goalId: string, input: Partial<CreateGoalInput>) {
  const goal = await findOwnedGoal(userId, goalId);
  Object.assign(goal, input);
  await goal.save();
  return goal;
}

export async function deleteGoal(userId: string, goalId: string) {
  const goal = await findOwnedGoal(userId, goalId);
  await goal.deleteOne();
}

export async function updateGoalProgress(userId: string, goalId: string, currentValue: number) {
  const goal = await findOwnedGoal(userId, goalId);
  const wasCompleted = goal.status === 'completed';

  goal.currentValue = Math.max(0, currentValue);
  if (goal.currentValue >= goal.targetValue && goal.status === 'active') {
    goal.status = 'completed';
  }
  await goal.save();

  let unlockedAchievements: Awaited<ReturnType<typeof checkAndUnlockAchievements>> = [];

  if (!wasCompleted && goal.status === 'completed') {
    await recordActivity(userId);
    await awardXp(userId, XP_PER_GOAL_COMPLETION);
    unlockedAchievements = await checkAndUnlockAchievements(userId);
  }

  return { goal, unlockedAchievements };
}

export async function toggleMilestone(
  userId: string,
  goalId: string,
  milestoneId: string,
  completed: boolean
) {
  const goal = await findOwnedGoal(userId, goalId);
  const milestone = goal.milestones.id(milestoneId);
  if (!milestone) {
    throw ApiError.notFound('Milestone not found');
  }
  milestone.completed = completed;
  milestone.completedAt = completed ? new Date() : null;
  await goal.save();
  return goal;
}
