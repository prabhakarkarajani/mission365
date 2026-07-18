import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Card, ModalHeader, Text, cn } from '@/shared/ui';
import { colors } from '@/shared/theme';
import { getMonthGrid, todayKey } from '@/shared/lib/date';
import { useHabitLogs } from '@/features/habits/application/habit.hooks';
import { useJournalEntries } from '@/features/journal/application/journal.hooks';
import { getMoodMeta } from '@/features/journal/domain/moods';
import type { Mood } from '@/features/journal/domain/types';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function CalendarScreen() {
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(todayKey());

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const grid = useMemo(() => getMonthGrid(year, month), [year, month]);
  const monthStart = grid[0].dateKey;
  const monthEnd = grid[grid.length - 1].dateKey;

  const { data: habitLogs } = useHabitLogs(monthStart, monthEnd);
  const { data: journalEntries } = useJournalEntries(monthStart, monthEnd);

  const habitDates = useMemo(() => new Set((habitLogs ?? []).map((l) => l.date)), [habitLogs]);
  const moodByDate = useMemo(() => {
    const map = new Map<string, Mood>();
    for (const entry of journalEntries ?? []) {
      map.set(entry.date, entry.mood);
    }
    return map;
  }, [journalEntries]);

  const selectedHabitCount = (habitLogs ?? []).filter((l) => l.date === selectedDate).length;
  const selectedMood = moodByDate.get(selectedDate);

  const goToMonth = (delta: number) => {
    setCursor(new Date(year, month + delta, 1));
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ModalHeader title="Calendar" />
      <ScrollView contentContainerClassName="gap-4 px-6 pb-8">
        <View className="flex-row items-center justify-between">
          <Pressable accessibilityRole="button" onPress={() => goToMonth(-1)} hitSlop={8}>
            <Ionicons name="chevron-back" size={20} color={colors.muted} />
          </Pressable>
          <Text variant="h3">
            {cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </Text>
          <Pressable accessibilityRole="button" onPress={() => goToMonth(1)} hitSlop={8}>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </Pressable>
        </View>

        <View className="flex-row">
          {WEEKDAYS.map((d, i) => (
            <View key={`${d}-${i}`} className="flex-1 items-center">
              <Text variant="caption" color="muted">
                {d}
              </Text>
            </View>
          ))}
        </View>

        <View className="flex-row flex-wrap">
          {grid.map((cell) => {
            const isSelected = cell.dateKey === selectedDate;
            const isToday = cell.dateKey === todayKey();
            const hasHabit = habitDates.has(cell.dateKey);
            const mood = moodByDate.get(cell.dateKey);

            return (
              <Pressable
                key={cell.dateKey}
                accessibilityRole="button"
                onPress={() => setSelectedDate(cell.dateKey)}
                style={{ width: `${100 / 7}%` }}
                className="items-center gap-1 py-2"
              >
                <View
                  className={cn(
                    'h-9 w-9 items-center justify-center rounded-full',
                    isSelected && 'bg-primary',
                    !isSelected && isToday && 'border border-primary'
                  )}
                >
                  <Text
                    variant="bodySmall"
                    color={isSelected ? 'inverse' : cell.inCurrentMonth ? 'default' : 'muted'}
                  >
                    {cell.day}
                  </Text>
                </View>
                <View className="h-4 flex-row items-center gap-0.5">
                  {hasHabit ? <View className="h-1.5 w-1.5 rounded-full bg-success" /> : null}
                  {mood ? <Text style={{ fontSize: 10 }}>{getMoodMeta(mood).emoji}</Text> : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        <Card className="gap-2">
          <Text variant="h3">
            {new Date(`${selectedDate}T00:00:00`).toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          <Text variant="bodySmall" color="muted">
            {selectedHabitCount > 0
              ? `${selectedHabitCount} habit${selectedHabitCount === 1 ? '' : 's'} completed`
              : 'No habits completed'}
          </Text>
          {selectedMood ? (
            <Text variant="bodySmall" color="muted">
              Mood: {getMoodMeta(selectedMood).emoji} {getMoodMeta(selectedMood).label}
            </Text>
          ) : null}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
