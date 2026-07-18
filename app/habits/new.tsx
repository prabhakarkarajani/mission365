import { useState } from 'react';
import { router, Stack } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { z } from 'zod';

import { Button, Chip, Input, ModalHeader, Text, TimePickerInput } from '@/shared/ui';
import { colors } from '@/shared/theme';
import { useCreateHabit } from '@/features/habits/application/habit.hooks';
import type { HabitCategory } from '@/features/habits/domain/types';
import { WorkoutSuggestions } from '@/features/habits/presentation/WorkoutSuggestions';

const CATEGORIES: { value: HabitCategory; label: string }[] = [
  { value: 'morning', label: 'Morning' },
  { value: 'health', label: 'Health' },
  { value: 'mind', label: 'Mind' },
  { value: 'learn', label: 'Learn' },
  { value: 'other', label: 'Other' },
];

const ICONS = [
  'barbell-outline',
  'book-outline',
  'water-outline',
  'moon-outline',
  'walk-outline',
  'nutrition-outline',
  'bicycle-outline',
  'musical-notes-outline',
  'leaf-outline',
  'checkmark-circle-outline',
] as const;

const COLORS = [
  colors.primary,
  colors.danger,
  colors.success,
  colors.accent,
  colors.warning,
  colors.secondary,
];

const habitSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  category: z.enum(['morning', 'health', 'mind', 'learn', 'other']),
  icon: z.string(),
  color: z.string(),
  reminderTime: z.string().optional(),
});

type HabitForm = z.infer<typeof habitSchema>;

export default function NewHabitScreen() {
  const createHabit = useCreateHabit();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<HabitForm>({
    resolver: zodResolver(habitSchema),
    defaultValues: { name: '', category: 'other', icon: ICONS[9], color: COLORS[0] },
  });

  const selectedIcon = watch('icon');
  const selectedColor = watch('color');
  const selectedCategory = watch('category');

  const onSubmit = async (values: HabitForm) => {
    setServerError(null);
    try {
      await createHabit.mutateAsync({
        name: values.name,
        category: values.category,
        icon: values.icon,
        color: values.color,
        reminderTime: values.reminderTime || null,
      });
      router.back();
    } catch {
      setServerError('Could not create habit. Please try again.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />
      <ModalHeader title="Add Habit" />
      <ScrollView contentContainerClassName="gap-5 px-6 pb-8" keyboardShouldPersistTaps="handled">
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <Input
              label="Habit Name"
              placeholder="e.g. Morning Workout"
              value={field.value}
              onChangeText={field.onChange}
              error={errors.name?.message}
            />
          )}
        />

        <View className="gap-2">
          <Text variant="bodySmall" color="muted">
            Category
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <Chip
                key={cat.value}
                label={cat.label}
                selected={selectedCategory === cat.value}
                onPress={() => setValue('category', cat.value)}
              />
            ))}
          </View>
        </View>

        <View className="gap-2">
          <Text variant="bodySmall" color="muted">
            Icon
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {ICONS.map((icon) => (
              <Pressable
                key={icon}
                accessibilityRole="button"
                accessibilityState={{ selected: selectedIcon === icon }}
                onPress={() => setValue('icon', icon)}
                className={`h-12 w-12 items-center justify-center rounded-full border-2 ${
                  selectedIcon === icon ? 'border-primary' : 'border-transparent'
                }`}
                style={{ backgroundColor: `${selectedColor}22` }}
              >
                <Ionicons name={icon} size={22} color={selectedColor} />
              </Pressable>
            ))}
          </View>
        </View>

        <View className="gap-2">
          <Text variant="bodySmall" color="muted">
            Color
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {COLORS.map((color) => (
              <Pressable
                key={color}
                accessibilityRole="button"
                accessibilityState={{ selected: selectedColor === color }}
                onPress={() => setValue('color', color)}
                className="h-10 w-10 items-center justify-center rounded-full border-2"
                style={{ backgroundColor: color, borderColor: selectedColor === color ? colors.foreground.light : 'transparent' }}
              />
            ))}
          </View>
        </View>

        {selectedIcon === 'barbell-outline' ? <WorkoutSuggestions /> : null}

        <Controller
          control={control}
          name="reminderTime"
          render={({ field }) => (
            <TimePickerInput label="Reminder Time (optional)" value={field.value} onChange={field.onChange} />
          )}
        />

        {serverError ? (
          <Text color="danger" variant="bodySmall">
            {serverError}
          </Text>
        ) : null}

        <Button
          label="Create Habit"
          variant="primary"
          size="lg"
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
