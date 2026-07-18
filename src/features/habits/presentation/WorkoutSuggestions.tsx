import { ScrollView, View } from 'react-native';

import { Badge, Card, Text } from '@/shared/ui';
import { workoutSuggestions } from '../domain/workoutSuggestions';

export function WorkoutSuggestions() {
  return (
    <View className="gap-2">
      <Text variant="bodySmall" color="muted">
        Workout ideas
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3 pr-2">
        {workoutSuggestions.map((suggestion) => (
          <Card key={suggestion.title} bordered className="w-56 gap-2">
            <View className="flex-row items-center justify-between">
              <Text variant="h3">{suggestion.title}</Text>
              <Badge label={suggestion.duration} color="primary" />
            </View>
            <Text variant="bodySmall" color="muted">
              {suggestion.exercises.join(' · ')}
            </Text>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}
