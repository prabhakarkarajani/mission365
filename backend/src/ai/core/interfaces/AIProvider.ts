/**
 * Snapshot of live user state Maya grounds her replies in. Thin in Phase 1
 * (just enough for a real, working chat) - grows in Phase 2 to include
 * dreams/goals/todayMissions/decisionEngineRecommendation/recentActivity/
 * moodCheckIn without changing this shape's meaning, only its richness.
 */
export interface CoachContext {
  user: {
    name: string;
    level: number;
    xp: number;
    currentStreak: number;
  };
}

export interface CoachMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface CoachChatInput {
  messages: CoachMessage[];
  context: CoachContext;
}

export interface CoachChatResult {
  message: string;
}

/**
 * Every vendor (mock, OpenAI, and later Claude/Gemini/Ollama) implements
 * this contract. Business logic (the coach service/controller) depends only
 * on this interface, never on a vendor SDK directly - see createAIProvider.
 */
export interface AIProvider {
  readonly name: string;
  chat(input: CoachChatInput): Promise<CoachChatResult>;
}
