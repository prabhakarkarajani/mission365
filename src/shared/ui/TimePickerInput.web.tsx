import { View } from 'react-native';

import { Text } from './Text';

export interface TimePickerInputProps {
  label?: string;
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
}

export function TimePickerInput({ label, value, onChange }: TimePickerInputProps) {
  return (
    <View className="gap-1.5">
      {label ? (
        <Text variant="bodySmall" color="muted">
          {label}
        </Text>
      ) : null}
      <input
        type="time"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="h-12 rounded-input border border-border bg-surface px-4 font-inter-regular text-[16px] text-foreground dark:border-border-dark dark:bg-surface-dark dark:text-foreground-dark"
      />
    </View>
  );
}
