export type Mood = 'great' | 'good' | 'neutral' | 'bad' | 'awful';

export interface JournalEntry {
  _id: string;
  userId: string;
  content: string;
  mood: Mood;
  date: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}
