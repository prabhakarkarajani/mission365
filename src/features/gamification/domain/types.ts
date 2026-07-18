export interface UnlockedAchievement {
  key: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
}

export interface Achievement {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  unlocked: boolean;
  unlockedAt: string | null;
}
