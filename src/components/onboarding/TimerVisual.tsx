
import { CircularTimer } from '../CircularTimer';
import { TickRing } from '../focus/TickRing';

const PROGRESS = 0.62;
const SIZE = 220;
const STROKE_WIDTH = 12;

export function TimerVisual() {
  const radius = (SIZE - STROKE_WIDTH) / 2;
  const knobRad = (PROGRESS * 360 - 90) * Math.PI / 180;
  const knobX = SIZE / 2 + radius * Math.cos(knobRad);
  const knobY = SIZE / 2 + radius * Math.sin(knobRad);

  return (
    <div className="flex items-center justify-center">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <CircularTimer progress={PROGRESS} size={SIZE} strokeWidth={STROKE_WIDTH}>
          <div className="text-center">
            <p className="font-display text-4xl text-white">18:24</p>
            <p className="text-xs text-neutral-400 mt-1 tracking-wide uppercase">Focus Session</p>
          </div>
        </CircularTimer>
        <TickRing size={SIZE} radius={radius - STROKE_WIDTH / 2 - 8} progress={PROGRESS} tickCount={30} />
        <div
          className="absolute rounded-full bg-white pointer-events-none"
          style={{
            width: 18,
            height: 18,
            left: knobX,
            top: knobY,
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 0 4px rgba(10,13,16,0.85), 0 0 20px 4px rgba(251,146,60,0.55)'
          }} />
        
      </div>
    </div>);

}