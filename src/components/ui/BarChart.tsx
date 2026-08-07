import React, { useState } from 'react';
import { View, Text } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

interface BarChartProps {
  data: { day: string; minutes: number }[];
  height?: number;
  barColor?: string;
}

export function BarChart({ data, height = 170, barColor = '#fb923c' }: BarChartProps) {
  const [width, setWidth] = useState(0);
  const max = Math.max(...data.map((d) => d.minutes), 1);
  const gap = 8;
  const barWidth = width > 0 ? Math.max(4, (width - gap * (data.length - 1)) / data.length) : 0;
  const labelSpace = 18;

  return (
    <View>
      <View style={{ height }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 && (
          <Svg width={width} height={height}>
            {data.map((d, i) => {
              const h = Math.max(d.minutes === 0 ? 3 : 4, (d.minutes / max) * (height - labelSpace - 6));
              const x = i * (barWidth + gap);
              return (
                <Rect
                  key={`${d.day}-${i}`}
                  x={x}
                  y={height - labelSpace - h}
                  width={barWidth}
                  height={h}
                  rx={Math.min(barWidth / 2, 8)}
                  fill={d.minutes === 0 ? 'rgba(255,255,255,0.08)' : barColor}
                />
              );
            })}
          </Svg>
        )}
      </View>
      <View className="mt-2 flex-row" style={{ gap }}>
        {data.map((d, i) => (
          <Text
            key={`${d.day}-${i}`}
            className={`flex-1 text-center text-[10px] ${
              i === data.length - 1 ? 'font-sans-semibold text-ember-400' : 'text-neutral-500'
            }`}>
            {d.day[0]}
          </Text>
        ))}
      </View>
    </View>
  );
}
