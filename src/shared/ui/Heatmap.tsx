import { View } from 'react-native';

import { colors } from '../theme';

export interface HeatmapDatum {
  date: string;
  percent: number;
}

export interface HeatmapProps {
  data: HeatmapDatum[];
  color?: string;
}

function opacityForPercent(percent: number): number {
  if (percent <= 0) return 0.08;
  return Math.min(1, 0.25 + (percent / 100) * 0.75);
}

export function Heatmap({ data, color = colors.primary }: HeatmapProps) {
  return (
    <View className="flex-row flex-wrap gap-1.5">
      {data.map((d) => (
        <View
          key={d.date}
          style={{
            width: 16,
            height: 16,
            borderRadius: 4,
            backgroundColor: `${color}${Math.round(opacityForPercent(d.percent) * 255)
              .toString(16)
              .padStart(2, '0')}`,
          }}
        />
      ))}
    </View>
  );
}
