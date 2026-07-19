import type { MissionPriority, MissionType } from '@/features/missions/types/mission.types';

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
}

/**
 * Client-side only for now — nothing persists a Roadmap yet. A future phase
 * adds a backend model once Dream/Roadmap/Milestone need to survive a reload.
 */
export interface Roadmap {
  summary: string;
  milestones: RoadmapMilestone[];
  suggestedMissions: SuggestedMission[];
}
