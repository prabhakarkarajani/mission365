import type { Roadmap } from '@/features/roadmaps/types/roadmap.types';

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

export type GeneratedRoadmap = Roadmap;

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** Snapshot of live user/goal/mission state the coach grounds its replies in. */
export interface CoachContext {
  userName?: string;
  level?: number;
  xp?: number;
  currentStreak?: number;
  goals: {
    title: string;
    category?: string;
    currentValue: number;
    targetValue: number;
    unit?: string;
    deadline?: string | null;
    percentComplete: number;
  }[];
  missions: {
    title: string;
    type: string;
    priority: string;
    completed: boolean;
  }[];
}

export interface ChatInput {
  messages: ChatMessage[];
  context: CoachContext;
}

export interface ChatResponse {
  message: string;
}

/**
 * Every vendor (OpenAI, Claude, Gemini, Groq, Ollama, mock) implements this
 * contract. Business logic (the Coach feature) depends only on this
 * interface, never on a vendor SDK directly.
 */
export interface AIProvider {
  readonly name: string;
  generateRoadmap(input: RoadmapGenerationInput): Promise<GeneratedRoadmap>;
  chat(input: ChatInput): Promise<ChatResponse>;
}
