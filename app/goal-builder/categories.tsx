import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button, Card, Text } from '@/shared/ui';
import { GOAL_CATEGORIES } from '@/features/goals/domain/categories';
import { useGoalBuilderStore } from '@/features/goals/application/goalBuilder.store';

export default function GoalCategoriesScreen() {
  const selectedCategories = useGoalBuilderStore((s) => s.selectedCategories);
  const toggleCategory = useGoalBuilderStore((s) => s.toggleCategory);

  const canContinue = selectedCategories.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerClassName="flex-grow gap-6 px-6 pb-8 pt-4" keyboardShouldPersistTaps="handled">
        <View className="gap-2">
          <Text variant="h1">What do you want to achieve?</Text>
          <Text variant="body" color="muted">
            You can select multiple
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-3">
          {GOAL_CATEGORIES.map((category) => {
            const selected = selectedCategories.includes(category.id);
            return (
              <Pressable
                key={category.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => toggleCategory(category.id)}
                className="w-[47%]"
              >
                <Card
                  bordered
                  className={`items-center gap-2 py-5 ${selected ? 'border-primary bg-primary/10' : ''}`}
                >
                  <View
                    className="h-12 w-12 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${category.color}22` }}
                  >
                    <Ionicons name={category.icon} size={22} color={category.color} />
                  </View>
                  <Text variant="bodySmall" className="text-center">
                    {category.label}
                  </Text>
                </Card>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View className="gap-3 px-6 pb-4 pt-2">
        <Button
          label="Continue"
          variant="primary"
          size="lg"
          disabled={!canContinue}
          onPress={() => router.push('/goal-builder/wizard')}
        />
        <Pressable accessibilityRole="button" onPress={() => router.replace('/home')}>
          <Text variant="bodySmall" color="muted" className="text-center">
            Skip for now
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
