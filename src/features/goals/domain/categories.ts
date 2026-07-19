import type { IoniconName } from '@/shared/lib/icon-name';
import { colors } from '@/shared/theme';

export interface GoalCategory {
  id: string;
  label: string;
  icon: IoniconName;
  color: string;
}

export const GOAL_CATEGORIES: GoalCategory[] = [
  { id: 'health', label: 'Health & Fitness', icon: 'fitness-outline', color: colors.success },
  { id: 'career', label: 'Career & Growth', icon: 'briefcase-outline', color: colors.primary },
  { id: 'business', label: 'Business & Startup', icon: 'rocket-outline', color: colors.accent },
  { id: 'finance', label: 'Finance & Wealth', icon: 'cash-outline', color: colors.warning },
  { id: 'learning', label: 'Learning & Skills', icon: 'school-outline', color: colors.secondary },
  { id: 'creative', label: 'Creative & Passion', icon: 'color-palette-outline', color: colors.danger },
  { id: 'relationships', label: 'Relationships', icon: 'heart-outline', color: colors.danger },
  { id: 'travel', label: 'Travel & Explore', icon: 'airplane-outline', color: colors.primary },
  { id: 'custom', label: 'Custom Goal', icon: 'create-outline', color: colors.muted },
];

export function getGoalCategory(id: string): GoalCategory | undefined {
  return GOAL_CATEGORIES.find((c) => c.id === id);
}
