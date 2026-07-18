import { View } from 'react-native';

import { colors } from '../theme';
import { Text } from './Text';

export interface BarChartDatum {
  label: string;
  value: number;
}

export interface BarChartProps {
  data: BarChartDatum[];
  maxValue?: number;
  color?: string;
  height?: number;
}

export function BarChart({ data, maxValue, color = colors.primary, height = 140 }: BarChartProps) {
  const max = maxValue ?? Math.max(1, ...data.map((d) => d.value));

  return (
    <View className="gap-2">
      <View
        className="flex-row items-end justify-between border-b border-border dark:border-border-dark"
        style={{ height }}
      >
        {data.map((d, index) => {
          const barHeight = d.value > 0 && max > 0 ? Math.max(4, (d.value / max) * height) : 0;
          return (
            <View key={`${d.label}-${index}`} className="flex-1 items-center">
              <View
                style={{ height: barHeight, width: '55%', backgroundColor: color, borderRadius: 6 }}
              />
            </View>
          );
        })}
      </View>
      <View className="flex-row justify-between">
        {data.map((d, index) => (
          <View key={`${d.label}-${index}`} className="flex-1 items-center">
            <Text variant="caption" color="muted">
              {d.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
