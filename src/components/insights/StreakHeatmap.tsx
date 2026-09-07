
import { format, subDays } from 'date-fns';
import { FocusSession } from '../../types/session';

interface StreakHeatmapProps {
  sessions: FocusSession[];
}

export function StreakHeatmap({ sessions }: StreakHeatmapProps) {
  const days = Array.from({ length: 28 }, (_, i) => subDays(new Date(), 27 - i));
  const minutesByDate = new Map<string, number>();
  sessions.
  filter((s) => s.type === 'focus' && s.completed).
  forEach((s) => {
    minutesByDate.set(s.date, (minutesByDate.get(s.date) ?? 0) + s.durationMinutes);
  });
  const max = Math.max(...Array.from(minutesByDate.values()), 1);

  return (
    <div className="glass rounded-2xl p-4">
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d, i) => {
          const iso = format(d, 'yyyy-MM-dd');
          const minutes = minutesByDate.get(iso) ?? 0;
          const intensity = minutes === 0 ? 0 : Math.min(1, minutes / max);
          return (
            <div
              key={i}
              title={`${format(d, 'MMM d')}: ${minutes} min`}
              className="aspect-square rounded-md"
              style={{
                backgroundColor: intensity === 0 ? '#20252c' : `rgba(251,146,60,${0.25 + intensity * 0.75})`
              }} />);


        })}
      </div>
      <div className="flex items-center justify-end gap-1.5 mt-3">
        <span className="text-[10px] text-neutral-500">Less</span>
        <div className="w-2.5 h-2.5 rounded-sm bg-ink-700" />
        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'rgba(251,146,60,0.4)' }} />
        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'rgba(251,146,60,1)' }} />
        <span className="text-[10px] text-neutral-500">More</span>
      </div>
    </div>);

}