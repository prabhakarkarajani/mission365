import type { Mood } from './types';

export const MOODS: { value: Mood; emoji: string; label: string }[] = [
  { value: 'great', emoji: '😄', label: 'Great' },
  { value: 'good', emoji: '🙂', label: 'Good' },
  { value: 'neutral', emoji: '😐', label: 'Neutral' },
  { value: 'bad', emoji: '☹️', label: 'Bad' },
  { value: 'awful', emoji: '😢', label: 'Awful' },
];

export function getMoodMeta(mood: Mood) {
  return MOODS.find((m) => m.value === mood) ?? MOODS[2];
}
