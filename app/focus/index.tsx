import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

import { Button, Chip, CircularProgress, ModalHeader, Text } from '@/shared/ui';
import { colors } from '@/shared/theme';
import { useCompleteFocusSession, useStartFocusSession } from '@/features/focus/application/focus.hooks';
import { FOCUS_DURATIONS, type FocusSessionType } from '@/features/focus/domain/types';

const TYPE_LABELS: { value: FocusSessionType; label: string }[] = [
  { value: 'focus', label: 'Focus' },
  { value: 'short_break', label: 'Short Break' },
  { value: 'long_break', label: 'Long Break' },
];

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function FocusTimerScreen() {
  const [type, setType] = useState<FocusSessionType>('focus');
  const durationMinutes = FOCUS_DURATIONS[type];
  const totalSeconds = durationMinutes * 60;

  const [remaining, setRemaining] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const startSession = useStartFocusSession();
  const completeSession = useCompleteFocusSession();

  // The interval is the "external system" this effect subscribes to; all
  // state updates happen inside its callback, not in the effect body itself.
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsRunning(false);
          setSessionId((currentSessionId) => {
            if (currentSessionId) {
              completeSession.mutate({ sessionId: currentSessionId, completed: true });
            }
            return null;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  const selectType = (next: FocusSessionType) => {
    setType(next);
    setRemaining(FOCUS_DURATIONS[next] * 60);
  };

  const onStart = async () => {
    const { session } = await startSession.mutateAsync({ type, durationMinutes });
    setSessionId(session._id);
    setIsRunning(true);
  };

  const onPause = () => setIsRunning(false);
  const onResume = () => setIsRunning(true);

  const onStop = () => {
    setIsRunning(false);
    if (sessionId) {
      completeSession.mutate({ sessionId, completed: false });
      setSessionId(null);
    }
    setRemaining(totalSeconds);
  };

  const percent = ((totalSeconds - remaining) / totalSeconds) * 100;
  const ringColor = type === 'focus' ? colors.primary : colors.success;

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ModalHeader title="Focus Timer" />
      <View className="flex-1 items-center gap-8 px-6 pt-8">
        <View className="flex-row gap-2">
          {TYPE_LABELS.map((t) => (
            <Chip
              key={t.value}
              label={t.label}
              selected={type === t.value}
              disabled={isRunning}
              onPress={() => selectType(t.value)}
            />
          ))}
        </View>

        <CircularProgress percent={percent} size={220} strokeWidth={14} color={ringColor}>
          <Text variant="display">{formatTime(remaining)}</Text>
          <Text variant="bodySmall" color="muted">
            {isRunning ? 'Time to focus!' : 'Ready when you are'}
          </Text>
        </CircularProgress>

        <View className="w-full gap-3">
          {!isRunning && !sessionId ? (
            <Button label="Start" variant="primary" size="lg" onPress={onStart} loading={startSession.isPending} />
          ) : isRunning ? (
            <Button label="Pause" variant="secondary" size="lg" onPress={onPause} />
          ) : (
            <Button label="Resume" variant="primary" size="lg" onPress={onResume} />
          )}
          {sessionId ? <Button label="Stop" variant="ghost" size="lg" onPress={onStop} /> : null}
        </View>
      </View>
    </SafeAreaView>
  );
}
