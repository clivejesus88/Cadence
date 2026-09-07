

const bars = [30, 55, 40, 80, 65, 90, 50];

export function InsightsVisual() {
  return (
    <div className="w-full max-w-[260px]">
      <div className="glass-strong rounded-3xl p-5">
        <p className="text-xs text-neutral-400">This week</p>
        <p className="font-display text-2xl text-white mt-1">6h 40m focused</p>
        <div className="flex items-end gap-2 h-24 mt-5">
          {bars.map((h, i) =>
          <div key={i} className="flex-1 rounded-full bg-ember-400/80" style={{ height: `${h}%` }} />
          )}
        </div>
      </div>
    </div>);

}