import { useState } from 'react';
import { addDays, format, startOfWeek, subDays } from 'date-fns';
import { FocusSession } from '../../types/session';

interface StreakHeatmapProps {
  sessions: FocusSession[];
}

const TOTAL_DAYS = 84;
const WEEKS = TOTAL_DAYS / 7;

export function StreakHeatmap({ sessions }: StreakHeatmapProps) {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const start = subDays(weekStart, TOTAL_DAYS - 7);
  const days = Array.from({ length: TOTAL_DAYS }, (_, i) => addDays(start, i));

  const minutesByDate = new Map<string, number>();
  sessions
    .filter((s) => s.type === 'focus' && s.completed)
    .forEach((s) => {
      minutesByDate.set(s.date, (minutesByDate.get(s.date) ?? 0) + s.durationMinutes);
    });

  const max = Math.max(...Array.from(minutesByDate.values()), 1);
  const [selected, setSelected] = useState<string | null>(null);
  const selectedMinutes = selected ? minutesByDate.get(selected) ?? 0 : null;
  const hasData = minutesByDate.size > 0;

  return (
    <div className="glass rounded-2xl p-4">
      <div
        className="grid w-full"
        style={{
          aspectRatio: `${WEEKS} / 7`,
          gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))`,
          gridTemplateRows: 'repeat(7, minmax(0, 1fr))',
          gridAutoFlow: 'column',
          gap: 4
        }}>
        {days.map((d, i) => {
          const iso = format(d, 'yyyy-MM-dd');
          const minutes = minutesByDate.get(iso) ?? 0;
          const intensity = minutes === 0 ? 0 : Math.min(1, minutes / max);
          const future = iso > todayStr;
          const selectedToday = selected === iso;

          return (
            <button
              key={i}
              type="button"
              title={`${format(d, 'MMM d')}: ${minutes} min`}
              aria-label={`${format(d, 'MMM d')}: ${minutes} min`}
              aria-pressed={selectedToday}
              aria-hidden={future}
              tabIndex={future ? -1 : 0}
              disabled={future}
              onClick={() => setSelected(selectedToday ? null : iso)}
              className="h-full w-full rounded-[5px] border transition-transform duration-150 active:scale-90 disabled:pointer-events-none"
              style={{
                backgroundColor: future
                  ? 'rgba(255,255,255,0.015)'
                  : intensity === 0
                    ? 'rgba(255,255,255,0.04)'
                    : `rgba(251, 146, 60, ${0.18 + intensity * 0.82})`,
                borderColor: selectedToday ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.04)',
                boxShadow: selectedToday ? '0 0 0 1px rgba(255,255,255,0.25)' : 'none'
              }}
            />
          );
        })}
      </div>

      <p className="mt-3 min-h-[15px] text-[11px] text-neutral-400" aria-live="polite">
        {selected ? (
          <span className="font-medium text-neutral-200">
            {format(new Date(selected), 'EEE, MMM d')} · {selectedMinutes} min
          </span>
        ) : hasData ? (
          'Tap a day for focus minutes'
        ) : (
          'Log a session to start filling your grid'
        )}
      </p>

      <div className="mt-2 flex items-center justify-end gap-1">
        <span className="text-[10px] text-neutral-500">Low</span>
        <div className="h-2.5 w-2.5 rounded-[3px] bg-white/5" />
        <div className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: 'rgba(251,146,60,0.35)' }} />
        <div className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: 'rgba(251,146,60,0.7)' }} />
        <div className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: 'rgba(251,146,60,1)' }} />
        <span className="text-[10px] text-neutral-500">High</span>
      </div>
    </div>
  );
}
