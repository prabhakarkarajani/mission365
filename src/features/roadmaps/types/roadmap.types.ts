import type { MissionPriority, MissionType } from '@/features/missions/types/mission.types';

export type GoalCurrentLevel = 'beginner' | 'intermediate' | 'advanced';
export type DailyTimeBudget = 'under_30' | '30_60' | '1_2h' | '2h_plus';
export type PreferredWorkingHours = 'morning' | 'afternoon' | 'evening' | 'night';

export interface RoadmapGenerationInput {
  goalTitle: string;
  goalCategory?: string;
  targetDate?: string;
  currentLevel?: GoalCurrentLevel;
  dailyTimeBudget?: DailyTimeBudget;
  preferredWorkingHours?: PreferredWorkingHours[];
  challenges?: string[];
}

export interface RoadmapMilestone {
  title: string;
  description?: string;
  targetOffsetDays: number;
}

export interface SuggestedMission {
  title: string;
  type: MissionType;
  priority: MissionPriority;
  recurrenceHint?: string;
  /** 0 = today, 6 = the last day of the first week. Present on firstWeekMissions. */
  dayOffset?: number;
}

/**
 * Client-side only for now — nothing persists a Roadmap yet. A future phase
 * adds a backend model once Dream/Roadmap/Milestone need to survive a reload.
 */
export interface Roadmap {
  summary: string;
  /** 0-100 confidence estimate that the plan succeeds if followed. */
  estimatedSuccessPercent: number;
  /** Total plan length in days. */
  timelineDays: number;
  milestones: RoadmapMilestone[];
  suggestedMissions: SuggestedMission[];
  /** The concrete Day 0-6 missions used to seed the user's first week. */
  firstWeekMissions: SuggestedMission[];
}

export type GeneratedRoadmap = Roadmap;
