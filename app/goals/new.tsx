import { useState } from 'react';
import { router, Stack } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { z } from 'zod';

import { Button, Input, ModalHeader, Text } from '@/shared/ui';
import { colors } from '@/shared/theme';
import { useCreateGoal } from '@/features/goals/application/goal.hooks';

const goalSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(160),
  targetValue: z
    .string()
    .trim()
    .min(1, 'Target is required')
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, 'Enter a target greater than 0'),
  unit: z.string().optional(),
});

type GoalForm = z.infer<typeof goalSchema>;

export default function NewGoalScreen() {
  const createGoal = useCreateGoal();
  const [serverError, setServerError] = useState<string | null>(null);
  const [milestones, setMilestones] = useState<string[]>([]);
  const [milestoneDraft, setMilestoneDraft] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GoalForm>({
    resolver: zodResolver(goalSchema),
    defaultValues: { title: '', targetValue: '', unit: '' },
  });

  const addMilestone = () => {
    if (milestoneDraft.trim()) {
      setMilestones((prev) => [...prev, milestoneDraft.trim()]);
      setMilestoneDraft('');
    }
  };

  const removeMilestone = (index: number) => {
    setMilestones((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: GoalForm) => {
    setServerError(null);
    try {
      await createGoal.mutateAsync({
        title: values.title,
        targetValue: Number(values.targetValue),
        unit: values.unit,
        milestones: milestones.map((title) => ({ title })),
      });
      router.back();
    } catch {
      setServerError('Could not create goal. Please try again.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />
      <ModalHeader title="New Goal" />
      <ScrollView contentContainerClassName="gap-5 px-6 pb-8" keyboardShouldPersistTaps="handled">
        <Controller
          control={control}
          name="title"
          render={({ field }) => (
            <Input
              label="Goal Title"
              placeholder="e.g. Read 10 books"
              value={field.value}
              onChangeText={field.onChange}
              error={errors.title?.message}
            />
          )}
        />

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Controller
              control={control}
              name="targetValue"
              render={({ field }) => (
                <Input
                  label="Target"
                  placeholder="10"
                  keyboardType="numeric"
                  value={field.value}
                  onChangeText={field.onChange}
                  error={errors.targetValue?.message}
                />
              )}
            />
          </View>
          <View className="flex-1">
            <Controller
              control={control}
              name="unit"
              render={({ field }) => (
                <Input label="Unit" placeholder="books" value={field.value} onChangeText={field.onChange} />
              )}
            />
          </View>
        </View>

        <View className="gap-2">
          <Text variant="bodySmall" color="muted">
            Milestones (optional)
          </Text>
          {milestones.map((title, index) => (
            <View key={`${title}-${index}`} className="flex-row items-center gap-2">
              <Text variant="body" className="flex-1">
                {title}
              </Text>
              <Pressable onPress={() => removeMilestone(index)} hitSlop={8} accessibilityRole="button">
                <Ionicons name="close-circle-outline" size={20} color={colors.danger} />
              </Pressable>
            </View>
          ))}
          <View className="flex-row items-center gap-2">
            <View className="flex-1">
              <Input
                placeholder="Add a milestone"
                value={milestoneDraft}
                onChangeText={setMilestoneDraft}
                onSubmitEditing={addMilestone}
              />
            </View>
            <Pressable
              onPress={addMilestone}
              hitSlop={8}
              accessibilityRole="button"
              className="h-12 w-12 items-center justify-center rounded-xl bg-primary/10"
            >
              <Ionicons name="add" size={20} color={colors.primary} />
            </Pressable>
          </View>
        </View>

        {serverError ? (
          <Text color="danger" variant="bodySmall">
            {serverError}
          </Text>
        ) : null}

        <Button
          label="Create Goal"
          variant="primary"
          size="lg"
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
