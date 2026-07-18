import { View } from 'react-native';
import Svg, { Circle, Line as SvgLine, Polyline } from 'react-native-svg';

import { colors } from '../theme';
import { Text } from './Text';

export interface LineChartDatum {
  label: string;
  value: number | null;
}

export interface LineChartProps {
  data: LineChartDatum[];
  minValue?: number;
  maxValue?: number;
  color?: string;
  height?: number;
}

export function LineChart({
  data,
  minValue = 0,
  maxValue,
  color = colors.primary,
  height = 140,
}: LineChartProps) {
  const values = data.map((d) => d.value).filter((v): v is number => v !== null);
  const max = maxValue ?? Math.max(1, ...values);
  const min = minValue;
  const width = 320;
  const paddingX = 16;
  const usableWidth = width - paddingX * 2;
  const step = data.length > 1 ? usableWidth / (data.length - 1) : 0;

  const points = data.map((d, index) => {
    const x = paddingX + index * step;
    if (d.value === null) return null;
    const ratio = max > min ? (d.value - min) / (max - min) : 0;
    const y = height - ratio * height;
    return { x, y };
  });

  const polylinePoints = points
    .filter((p): p is { x: number; y: number } => p !== null)
    .map((p) => `${p.x},${p.y}`)
    .join(' ');

  return (
    <View className="gap-2">
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <SvgLine x1={0} y1={height - 1} x2={width} y2={height - 1} stroke={colors.border.light} strokeWidth={1} />
        {polylinePoints ? (
          <Polyline points={polylinePoints} fill="none" stroke={color} strokeWidth={2.5} />
        ) : null}
        {points.map((p, index) =>
          p ? <Circle key={index} cx={p.x} cy={p.y} r={4} fill={color} /> : null
        )}
      </Svg>
      <View className="flex-row justify-between">
        {data.map((d, index) => (
          <Text key={`${d.label}-${index}`} variant="caption" color="muted">
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
}
