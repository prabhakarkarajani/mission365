import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Card, ProgressBar, Text } from '@/shared/ui';
import { colors } from '@/shared/theme';
import { useAuthStore } from '@/features/auth/application/auth.store';

const XP_PER_LEVEL = 500;

const MENU_ITEMS: { icon: keyof typeof Ionicons.glyphMap; label: string; href: Href }[] = [
  { icon: 'person-outline', label: 'Edit Profile', href: '/profile/edit' },
  { icon: 'trophy-outline', label: 'Achievements', href: '/achievements' },
  { icon: 'settings-outline', label: 'Settings', href: '/settings' },
  { icon: 'card-outline', label: 'Subscription', href: '/subscription' },
];

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const xpIntoLevel = (user?.xp ?? 0) % XP_PER_LEVEL;
  const levelProgress = (xpIntoLevel / XP_PER_LEVEL) * 100;

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top']}>
      <ScrollView contentContainerClassName="gap-5 p-6">
        <View className="items-center gap-3">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Text variant="h1" color="primary">
              {(user?.name?.[0] ?? '?').toUpperCase()}
            </Text>
          </View>
          <View className="items-center gap-1">
            <Text variant="h2">{user?.name}</Text>
            <Text variant="bodySmall" color="muted">
              {user?.email}
            </Text>
          </View>
        </View>

        <Card className="gap-2">
          <View className="flex-row items-center justify-between">
            <Text variant="h3">Level {user?.level ?? 1}</Text>
            <Text variant="bodySmall" color="muted">
              {xpIntoLevel} / {XP_PER_LEVEL} XP
            </Text>
          </View>
          <ProgressBar percent={levelProgress} color={colors.accent} />
        </Card>

        <View className="flex-row gap-3">
          <Card className="flex-1 items-center gap-1">
            <Text variant="h3" color="primary">
              🔥 {user?.currentStreak ?? 0}
            </Text>
            <Text variant="caption" color="muted">
              Current Streak
            </Text>
          </Card>
          <Card className="flex-1 items-center gap-1">
            <Text variant="h3" color="success">
              {user?.longestStreak ?? 0}
            </Text>
            <Text variant="caption" color="muted">
              Best Streak
            </Text>
          </Card>
        </View>

        <Card className="divide-y divide-border dark:divide-border-dark">
          {MENU_ITEMS.map((item) => (
            <Pressable
              key={item.label}
              accessibilityRole="button"
              onPress={() => router.push(item.href)}
              className="flex-row items-center gap-3 py-3"
            >
              <Ionicons name={item.icon} size={20} color={colors.muted} />
              <Text variant="body" className="flex-1">
                {item.label}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
          ))}
        </Card>

        <Pressable
          accessibilityRole="button"
          onPress={() => logout()}
          className="flex-row items-center justify-center gap-2 py-3"
        >
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text color="danger">Logout</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
