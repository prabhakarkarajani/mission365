export type GoalStatus = 'active' | 'completed' | 'archived';

export interface Milestone {
  _id: string;
  title: string;
  completed: boolean;
  completedAt: string | null;
}

export interface Goal {
  _id: string;
  userId: string;
  dreamId: string | null;
  title: string;
  category: string;
  icon: string;
  color: string;
  /** Goal Impact weight the user assigns, 1 (low) - 5 (high). See backend/src/models/Goal.ts. */
  importance: number;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline: string | null;
  status: GoalStatus;
  milestones: Milestone[];
  createdAt: string;
  updatedAt: string;
}
