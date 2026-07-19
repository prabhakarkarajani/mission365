import { View } from 'react-native';

import { Text } from './Text';

export interface DatePickerInputProps {
  label?: string;
  value?: string | null;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  minimumDate?: Date;
}

export function DatePickerInput({ label, value, onChange, minimumDate }: DatePickerInputProps) {
  return (
    <View className="gap-1.5">
      {label ? (
        <Text variant="bodySmall" color="muted">
          {label}
        </Text>
      ) : null}
      <input
        type="date"
        value={value ?? ''}
        min={minimumDate ? minimumDate.toISOString().slice(0, 10) : undefined}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="h-12 rounded-input border border-border bg-surface px-4 font-inter-regular text-[16px] text-foreground dark:border-border-dark dark:bg-surface-dark dark:text-foreground-dark"
      />
    </View>
  );
}
