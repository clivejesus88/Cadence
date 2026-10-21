import { motion } from 'framer-motion';

interface DailyGoalRingProps {
  minutes: number;
  goal: number;
  size?: number;
  stroke?: number;
}

export function DailyGoalRing({ minutes, goal, size = 108, stroke = 9 }: DailyGoalRingProps) {
  const safeGoal = Math.max(1, goal);
  const progress = Math.min(1, minutes / safeGoal);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);
  const done = minutes >= safeGoal;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="goal-ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={done ? '#fbbf24' : '#fb923c'} />
            <stop offset="100%" stopColor={done ? '#f59e0b' : '#ea580c'} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#goal-ring-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={false}
          animate={{ strokeDashoffset: offset }}
          transition={{ type: 'spring', stiffness: 90, damping: 20 }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-numeric text-2xl font-semibold text-white tabular-nums">{minutes}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
          of {safeGoal}m
        </span>
      </div>
    </div>
  );
}
