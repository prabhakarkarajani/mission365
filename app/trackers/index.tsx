import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button, Card, Chip, ErrorState, Input, ModalHeader, Text } from '@/shared/ui';
import { colors } from '@/shared/theme';
import { useCreateTrackerLog, useTrackerSummary } from '@/features/trackers/application/tracker.hooks';

const WATER_PRESETS = [250, 500, 750];
const WORKOUT_TYPES = ['Cardio', 'Strength', 'Yoga', 'Sports'];
const SLEEP_QUALITIES = ['poor', 'fair', 'good', 'excellent'] as const;

export default function TrackersScreen() {
  const { data: summary, isError, refetch } = useTrackerSummary();
  const createLog = useCreateTrackerLog();

  const [workoutMinutes, setWorkoutMinutes] = useState('');
  const [workoutType, setWorkoutType] = useState(WORKOUT_TYPES[0]);
  const [sleepHours, setSleepHours] = useState('');
  const [sleepQuality, setSleepQuality] = useState<(typeof SLEEP_QUALITIES)[number]>('good');

  const logWater = (ml: number) => createLog.mutate({ kind: 'water', value: ml, unit: 'ml' });

  const logWorkout = () => {
    const minutes = Number(workoutMinutes);
    if (!minutes || minutes <= 0) return;
    createLog.mutate(
      { kind: 'workout', value: minutes, unit: 'min', meta: { workoutType } },
      { onSuccess: () => setWorkoutMinutes('') }
    );
  };

  const logSleep = () => {
    const hours = Number(sleepHours);
    if (!hours || hours <= 0) return;
    createLog.mutate(
      { kind: 'sleep', value: hours, unit: 'hr', meta: { sleepQuality } },
      { onSuccess: () => setSleepHours('') }
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ModalHeader title="Trackers" />
      <ScrollView contentContainerClassName="gap-5 px-6 pb-8">
        {isError ? (
          <Card>
            <ErrorState description="Couldn't load today's tracker totals - the 0s below aren't real yet." onRetry={() => refetch()} />
          </Card>
        ) : null}

        <Card className="gap-3">
          <View className="flex-row items-center gap-2">
            <Ionicons name="water-outline" size={20} color={colors.primary} />
            <Text variant="h3">Water</Text>
          </View>
          <Text variant="display" color="primary">
            {summary?.water ?? 0}
            <Text variant="body" color="muted">
              {' '}
              ml today
            </Text>
          </Text>
          {summary && summary.waterStreak > 0 ? (
            <Text variant="caption" color="muted">
              🔥 {summary.waterStreak} day streak
            </Text>
          ) : null}
          <View className="flex-row gap-2">
            {WATER_PRESETS.map((ml) => (
              <Button key={ml} label={`+${ml}ml`} variant="secondary" size="sm" onPress={() => logWater(ml)} />
            ))}
          </View>
        </Card>

        <Card className="gap-3">
          <View className="flex-row items-center gap-2">
            <Ionicons name="barbell-outline" size={20} color={colors.success} />
            <Text variant="h3">Workout</Text>
          </View>
          <Text variant="display" color="success">
            {summary?.workoutMinutes ?? 0}
            <Text variant="body" color="muted">
              {' '}
              min today
            </Text>
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {WORKOUT_TYPES.map((type) => (
              <Chip key={type} label={type} selected={workoutType === type} onPress={() => setWorkoutType(type)} />
            ))}
          </View>
          <View className="flex-row items-end gap-2">
            <View className="flex-1">
              <Input
                label="Duration (min)"
                keyboardType="numeric"
                placeholder="30"
                value={workoutMinutes}
                onChangeText={setWorkoutMinutes}
              />
            </View>
            <Button label="Log" variant="primary" onPress={logWorkout} />
          </View>
        </Card>

        <Card className="gap-3">
          <View className="flex-row items-center gap-2">
            <Ionicons name="moon-outline" size={20} color={colors.accent} />
            <Text variant="h3">Sleep</Text>
          </View>
          <Text variant="display" color="default">
            {summary?.sleepHours ?? '–'}
            <Text variant="body" color="muted">
              {' '}
              hrs last night
            </Text>
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {SLEEP_QUALITIES.map((q) => (
              <Chip
                key={q}
                label={q[0].toUpperCase() + q.slice(1)}
                selected={sleepQuality === q}
                onPress={() => setSleepQuality(q)}
              />
            ))}
          </View>
          <View className="flex-row items-end gap-2">
            <View className="flex-1">
              <Input
                label="Hours"
                keyboardType="numeric"
                placeholder="8"
                value={sleepHours}
                onChangeText={setSleepHours}
              />
            </View>
            <Button label="Log" variant="primary" onPress={logSleep} />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
