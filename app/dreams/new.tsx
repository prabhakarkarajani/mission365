import { useState } from 'react';
import { router, Stack } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { Button, Input, ModalHeader, Text } from '@/shared/ui';
import { useCreateDream } from '@/features/dreams/hooks/dream.hooks';

const dreamSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(160),
  description: z.string().trim().max(2000).optional(),
});

type DreamForm = z.infer<typeof dreamSchema>;

export default function NewDreamScreen() {
  const createDream = useCreateDream();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DreamForm>({
    resolver: zodResolver(dreamSchema),
    defaultValues: { title: '', description: '' },
  });

  const onSubmit = async (values: DreamForm) => {
    setServerError(null);
    try {
      await createDream.mutateAsync({ title: values.title, description: values.description });
      router.back();
    } catch {
      setServerError('Could not create dream. Please try again.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />
      <ModalHeader title="New Dream" />
      <ScrollView contentContainerClassName="gap-5 px-6 pb-8" keyboardShouldPersistTaps="handled">
        <Text variant="bodySmall" color="muted">
          What&rsquo;s the bigger picture? A Dream is the destination — your goals are how you get there.
        </Text>

        <Controller
          control={control}
          name="title"
          render={({ field }) => (
            <Input
              label="Dream Title"
              placeholder="e.g. Become a published author"
              value={field.value}
              onChangeText={field.onChange}
              error={errors.title?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <Input
              label="Why does this matter? (optional)"
              placeholder="Describe what this dream means to you"
              value={field.value}
              onChangeText={field.onChange}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="h-28 py-3"
              error={errors.description?.message}
            />
          )}
        />

        {serverError ? (
          <Text color="danger" variant="bodySmall">
            {serverError}
          </Text>
        ) : null}

        <Button
          label="Create Dream"
          variant="primary"
          size="lg"
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
