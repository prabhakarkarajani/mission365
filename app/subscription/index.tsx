import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Badge, Button, Card, ModalHeader, Text } from '@/shared/ui';
import { colors } from '@/shared/theme';
import { useSubscriptionStore } from '@/features/subscription/application/subscription.store';
import { PLANS } from '@/features/subscription/domain/types';

export default function SubscriptionScreen() {
  const planId = useSubscriptionStore((s) => s.planId);
  const setPlan = useSubscriptionStore((s) => s.setPlan);

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ModalHeader title="Subscription" />
      <ScrollView contentContainerClassName="gap-4 px-6 pb-8">
        {planId === 'free' ? (
          <Text variant="bodySmall" color="muted">
            You&apos;re on the Free plan. Upgrade anytime — no payment provider is connected
            yet, so upgrading here just unlocks the UI locally.
          </Text>
        ) : null}

        {PLANS.map((plan) => {
          const isCurrent = plan.id === planId;
          return (
            <Card key={plan.id} className={isCurrent ? 'gap-3 border-2 border-primary' : 'gap-3'}>
              <View className="flex-row items-center justify-between">
                <Text variant="h2">{plan.name}</Text>
                {isCurrent ? <Badge label="Current Plan" color="primary" /> : null}
              </View>
              <Text variant="h3" color="muted">
                {plan.priceLabel}
              </Text>
              <View className="gap-2">
                {plan.features.map((feature) => (
                  <View key={feature} className="flex-row items-center gap-2">
                    <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                    <Text variant="bodySmall" className="flex-1">
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>
              {!isCurrent ? (
                <Button
                  label={plan.id === 'premium' ? 'Upgrade to Premium' : 'Downgrade to Free'}
                  variant={plan.id === 'premium' ? 'primary' : 'secondary'}
                  onPress={() => setPlan(plan.id)}
                />
              ) : null}
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
