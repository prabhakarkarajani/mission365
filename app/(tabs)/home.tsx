import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

import { Confetti, EmptyState, MissionCardSkeleton, Text } from '@/shared/ui';
import { colors } from '@/shared/theme';
import { useAuthStore } from '@/features/auth/application/auth.store';
import { useToggleHabitCompletion } from '@/features/habits/application/habit.hooks';
import { todayKey, formatDisplayDate, greetingForHour } from '@/shared/lib/date';
import type { IoniconName } from '@/shared/lib/icon-name';

import { useHomeBrief } from '@/features/home/application/useHomeBrief';
import { TodaysBriefCard } from '@/features/home/presentation/TodaysBriefCard';
import { AICoachCard } from '@/features/home/presentation/AICoachCard';
import { CurrentGoalCard } from '@/features/home/presentation/CurrentGoalCard';
import { MissionCard } from '@/features/home/presentation/MissionCard';
import { SmartSuggestionsCard } from '@/features/home/presentation/SmartSuggestionsCard';
import { ContinueMissionCTA } from '@/features/home/presentation/ContinueMissionCTA';
import { UpcomingRemindersTimeline } from '@/features/home/presentation/UpcomingRemindersTimeline';
import { AchievementStrip } from '@/features/home/presentation/AchievementStrip';

const QUICK_ACTIONS: { href: Href; icon: IoniconName; label: string; color: string }[] = [
  { href: '/coach', icon: 'sparkles-outline', label: 'Ask AI', color: colors.primary },
  { href: '/goals/new', icon: 'flag-outline', label: 'New Goal', color: colors.accent },
  { href: '/habits/new', icon: 'add-circle-outline', label: 'New Mission', color: colors.success },
  { href: '/calendar', icon: 'calendar-outline', label: 'Calendar', color: colors.warning },
  { href: '/analytics', icon: 'bar-chart-outline', label: 'Insights', color: colors.secondary },
];

const MOTIVATIONAL_LINES = [
  "Small steps, every day, win the year.",
  "Your future self is built by today's choices.",
  "Consistency beats intensity.",
  "Progress, not perfection.",
  "One mission at a time.",
  "Discipline is choosing what you want most.",
  "Show up — the rest follows.",
];

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const brief = useHomeBrief();
  const toggleCompletion = useToggleHabitCompletion();
  const [refreshing, setRefreshing] = useState(false);
  const [coachDismissed, setCoachDismissed] = useState(false);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const prevPendingCount = useRef<number | null>(null);

  useEffect(() => {
    if (brief.isLoading) return;
    const prev = prevPendingCount.current;
    if (prev !== null && prev > 0 && brief.pendingCount === 0 && brief.completedCount > 0) {
      setConfettiTrigger((t) => t + 1);
    }
    prevPendingCount.current = brief.pendingCount;
  }, [brief.pendingCount, brief.completedCount, brief.isLoading]);

  const onRefresh = async () => {
    setRefreshing(true);
    await brief.refetch();
    setRefreshing(false);
  };

  const firstName = user?.name?.split(' ')[0] ?? '';
  const motivationalLine = MOTIVATIONAL_LINES[new Date().getDate() % MOTIVATIONAL_LINES.length];
  const greeting = greetingForHour(new Date().getHours());

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top']}>
      <ScrollView
        contentContainerClassName="gap-5 p-6"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View className="flex-row items-start justify-between">
          <View className="flex-1 gap-1 pr-3">
            <Text variant="h1">
              {greeting}
              {firstName ? `, ${firstName}` : ''} 👋
            </Text>
            <Text variant="caption" color="muted">
              {formatDisplayDate(todayKey())}
            </Text>
            <Text variant="bodySmall" color="muted">
              {motivationalLine}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              onPress={() => router.push('/settings')}
              className="h-11 w-11 items-center justify-center rounded-full bg-surface dark:bg-surface-dark"
            >
              <Ionicons name="notifications-outline" size={20} color={colors.muted} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open AI Coach"
              onPress={() => router.push('/coach')}
              className="h-11 w-11 items-center justify-center rounded-full bg-primary/10"
            >
              <Ionicons name="sparkles" size={20} color={colors.primary} />
            </Pressable>
          </View>
        </View>

        {/* Today's Brief */}
        <TodaysBriefCard brief={brief} currentStreak={user?.currentStreak ?? 0} xp={user?.xp ?? 0} level={user?.level ?? 1} />

        {/* AI Coach */}
        {!coachDismissed ? (
          <AICoachCard
            firstName={firstName}
            topPendingMission={brief.topPendingMission}
            onDismiss={() => setCoachDismissed(true)}
          />
        ) : null}

        {/* Current Goal */}
        <CurrentGoalCard goal={brief.currentGoal} milestone={brief.currentMilestone} daysRemaining={brief.daysRemaining} />

        {/* Today's Missions */}
        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text variant="h3">Today&apos;s Missions</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add mission"
              onPress={() => router.push('/habits/new')}
            >
              <Text color="primary" variant="bodySmall">
                + Add
              </Text>
            </Pressable>
          </View>

          {brief.isLoading ? (
            <View className="gap-3">
              <MissionCardSkeleton />
              <MissionCardSkeleton />
              <MissionCardSkeleton />
            </View>
          ) : brief.missions.length === 0 ? (
            <View className="rounded-card bg-surface p-4 shadow-elevation-sm dark:bg-surface-dark">
              <EmptyState
                icon="rocket-outline"
                title="No missions yet"
                description="Add your first one to start today's missions."
                actionLabel="Add a mission"
                onAction={() => router.push('/habits/new')}
              />
            </View>
          ) : (
            brief.missions.map((item) => (
              <MissionCard
                key={item.mission.habit._id}
                item={item}
                onToggle={() =>
                  toggleCompletion.mutate({
                    habitId: item.mission.habit._id,
                    date: todayKey(),
                    completed: !item.mission.completed,
                  })
                }
              />
            ))
          )}
        </View>

        {/* Smart AI Suggestions */}
        <SmartSuggestionsCard />

        {/* Continue CTA */}
        <ContinueMissionCTA topPendingMission={brief.topPendingMission} />

        {/* Upcoming Reminders */}
        <UpcomingRemindersTimeline missions={brief.missions.filter((m) => !m.mission.completed)} />

        {/* Achievements */}
        <AchievementStrip xp={user?.xp ?? 0} level={user?.level ?? 1} currentStreak={user?.currentStreak ?? 0} />

        {/* Quick Actions */}
        <View className="gap-3">
          <Text variant="h3">Quick Actions</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3">
            {QUICK_ACTIONS.map((action) => (
              <Pressable
                key={action.label}
                accessibilityRole="button"
                onPress={() => router.push(action.href)}
                className="w-20 items-center gap-2"
              >
                <View
                  className="h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `${action.color}1A` }}
                >
                  <Ionicons name={action.icon} size={24} color={action.color} />
                </View>
                <Text variant="caption" color="muted" numberOfLines={1}>
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
      <Confetti trigger={confettiTrigger} />
    </SafeAreaView>
  );
}
