import type { ReactNode } from 'react';
import { Pressable, Switch, View } from 'react-native';

import { colors } from '../theme';
import { Text } from './Text';

export interface SettingRowProps {
  label: string;
  description?: string;
  right?: ReactNode;
  onPress?: () => void;
  danger?: boolean;
}

export function SettingRow({ label, description, right, onPress, danger }: SettingRowProps) {
  const content = (
    <View className="flex-row items-center justify-between py-3">
      <View className="flex-1 gap-0.5 pr-3">
        <Text variant="body" color={danger ? 'danger' : 'default'}>
          {label}
        </Text>
        {description ? (
          <Text variant="caption" color="muted">
            {description}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      {content}
    </Pressable>
  );
}

export interface SettingSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export function SettingSwitch({ value, onValueChange }: SettingSwitchProps) {
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: colors.border.light, true: colors.primary }}
      thumbColor="#FFFFFF"
    />
  );
}
