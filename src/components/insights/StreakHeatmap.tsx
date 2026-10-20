import { useState } from 'react';
import { format, subDays } from 'date-fns';
import { FocusSession } from '../../types/session';

interface StreakHeatmapProps {
  sessions: FocusSession[];
}

const TOTAL_DAYS = 91; // ~13 full weeks, GitHub-style
const WEEKS = TOTAL_DAYS / 7;

export function StreakHeatmap({ sessions }: StreakHeatmapProps) {
  const today = new Date();
  // End the grid on the most recent Saturday so columns line up as weeks.
  const end = subDays(today, (today.getDay() + 1) % 7);
  const days = Array.from({ length: TOTAL_DAYS }, (_, i) => subDays(end, TOTAL_DAYS - 1 - i));

  const minutesByDate = new Map<string, number>();
  sessions.
  filter((s) => s.type === 'focus' && s.completed).
  forEach((s) => {
    minutesByDate.set(s.date, (minutesByDate.get(s.date) ?? 0) + s.durationMinutes);
  });
  const max = Math.max(...Array.from(minutesByDate.values()), 1);
  const [selected, setSelected] = useState<string | null>(null);

  const selectedMinutes = selected ? minutesByDate.get(selected) ?? 0 : null;

  return (
    <div className="glass rounded-2xl p-4">
      <div
        className="grid w-full"
        style={{
          gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))`,
          gridAutoFlow: 'column',
          gridTemplateRows: 'repeat(7, minmax(0, 1fr))',
          gap: 3
        }}>
        {days.map((d, i) => {
          const iso = format(d, 'yyyy-MM-dd');
          const minutes = minutesByDate.get(iso) ?? 0;
          const intensity = minutes === 0 ? 0 : Math.min(1, minutes / max);
          const future = d > today;
          const label = `${format(d, 'MMM d')}: ${minutes} min`;
          return (
            <button
              key={i}
              type="button"
              title={label}
              aria-label={label}
              aria-pressed={selected === iso}
              disabled={future}
              onClick={() => setSelected(selected === iso ? null : iso)}
              className="aspect-square w-full rounded-[3px] transition-transform active:scale-90"
              style={{
                backgroundColor: future ? 'transparent' : intensity === 0 ? '#20252c' : `rgba(251,146,60,${0.22 + intensity * 0.78})`,
                boxShadow: selected === iso ? '0 0 0 1.5px rgba(255,255,255,0.85)' : undefined
              }} />);
        })}
      </div>
      <p className="mt-2 min-h-[15px] text-[11px] text-neutral-400" aria-live="polite">
        {selected ?
        <span className="font-medium text-neutral-200">
            {format(new Date(selected), 'EEE, MMM d')} · {selectedMinutes} min
          </span> :
        'Tap a day for focus minutes'}
      </p>
      <div className="flex items-center justify-end gap-1 mt-1">
        <span className="text-[10px] text-neutral-500">Less</span>
        <div className="h-2.5 w-2.5 rounded-[3px] bg-ink-700" />
        <div className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: 'rgba(251,146,60,0.4)' }} />
        <div className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: 'rgba(251,146,60,1)' }} />
        <span className="text-[10px] text-neutral-500">More</span>
      </div>
    </div>);
}
