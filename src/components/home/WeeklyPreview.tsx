

interface WeeklyPreviewProps {
  data: {day: string;minutes: number;}[];
}

export function WeeklyPreview({ data }: WeeklyPreviewProps) {
  const max = Math.max(...data.map((d) => d.minutes), 1);
  const total = data.reduce((sum, d) => sum + d.minutes, 0);

  return (
    <div className="glass rounded-2xl p-4">
      <p className="text-lg font-semibold text-white">
        {Math.floor(total / 60)}
        <span className="text-sm text-neutral-500">h</span> {total % 60}
        <span className="text-sm text-neutral-500">m</span>
        <span className="text-sm text-neutral-500 font-normal"> focused this week</span>
      </p>
      <div className="flex items-end justify-between gap-2 h-20 mt-4">
        {data.map((d, i) => {
          const isToday = i === data.length - 1;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <div
                className={`w-full rounded-full ${isToday ? 'bg-ember-400' : 'bg-white/10'}`}
                style={{ height: `${Math.max(d.minutes / max * 100, 4)}%` }} />
              
              <span className={`text-[10px] ${isToday ? 'text-ember-400 font-semibold' : 'text-neutral-500'}`}>
                {d.day[0]}
              </span>
            </div>);

        })}
      </div>
    </div>);

}