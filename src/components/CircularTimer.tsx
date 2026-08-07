import React, { ReactNode } from 'react';

interface CircularTimerProps {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  children?: ReactNode;
  trackColor?: string;
  progressColor?: string;
}

export function CircularTimer({
  progress,
  size = 240,
  strokeWidth = 14,
  children,
  trackColor = 'rgba(255,255,255,0.08)',
  progressColor = '#fb923c'
}: CircularTimerProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(progress, 0), 1);
  const offset = circumference * (1 - clamped);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div className="glass absolute inset-0 rounded-full" />
      <svg width={size} height={size} className="relative -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.3s linear' }} />
        
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>);

}