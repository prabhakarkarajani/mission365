export interface WorkoutSuggestion {
  title: string;
  duration: string;
  exercises: string[];
}

export const workoutSuggestions: WorkoutSuggestion[] = [
  {
    title: 'Full Body',
    duration: '30-40 min',
    exercises: ['Squats', 'Push-ups', 'Bent-over rows', 'Plank'],
  },
  {
    title: 'Push Day',
    duration: '40-50 min',
    exercises: ['Bench press', 'Shoulder press', 'Triceps dips', 'Lateral raises'],
  },
  {
    title: 'Pull Day',
    duration: '40-50 min',
    exercises: ['Pull-ups', 'Barbell rows', 'Bicep curls', 'Face pulls'],
  },
  {
    title: 'Leg Day',
    duration: '45-60 min',
    exercises: ['Squats', 'Lunges', 'Deadlifts', 'Calf raises'],
  },
  {
    title: 'Cardio',
    duration: '20-30 min',
    exercises: ['Jump rope', 'Cycling', 'Rowing', 'Interval sprints'],
  },
  {
    title: 'Stretch & Mobility',
    duration: '15-20 min',
    exercises: ['Hip flexor stretch', 'Shoulder rolls', 'Hamstring stretch', 'Cat-cow'],
  },
];
