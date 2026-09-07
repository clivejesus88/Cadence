

interface TickRingProps {
  size: number;
  radius: number;
  progress: number; // 0 to 1, clockwise from the top
  tickCount?: number;
}

export function TickRing({ size, radius, progress, tickCount = 30 }: TickRingProps) {
  const center = size / 2;

  return (
    <svg width={size} height={size} className="absolute inset-0 pointer-events-none">
      {Array.from({ length: tickCount }).map((_, i) => {
        const angle = i / tickCount * 360;
        const passed = angle <= progress * 360;
        const rad = (angle - 90) * Math.PI / 180;
        const major = i % 5 === 0;
        const inner = radius - (major ? 8 : 5);
        const x1 = center + inner * Math.cos(rad);
        const y1 = center + inner * Math.sin(rad);
        const x2 = center + radius * Math.cos(rad);
        const y2 = center + radius * Math.sin(rad);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={passed ? 'rgba(251,146,60,0.6)' : 'rgba(255,255,255,0.12)'}
            strokeWidth={major ? 2 : 1.25}
            strokeLinecap="round" />);


      })}
    </svg>);

}