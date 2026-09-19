import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { TickRing } from './TickRing';

interface DurationDialProps {
  value: number;
  onChange: (minutes: number) => void;
  min?: number;
  max?: number;
  step?: number;
  size?: number;
}

interface DragState {
  lastAngle: number;
  accumulatedMinutes: number;
}

// One full 360° turn always represents exactly this many minutes — dialing further
// than 360° just keeps adding another lap's worth (720° = 240m, 1080° = 360m, ...).
const MINUTES_PER_TURN = 120;
const DEGREES_PER_MINUTE = 360 / MINUTES_PER_TURN;

export function DurationDial({ value, onChange, min = 5, max = 1440, step = 5, size = 260 }: DurationDialProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const lastEmittedRef = useRef(value);
  const [dragging, setDragging] = useState(false);

  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Which lap the current value falls on, and how far around that lap's ring we are.
  const lapCount = value > 0 ? Math.ceil(value / MINUTES_PER_TURN) : 0;
  const fraction = lapCount > 0 ? (value - (lapCount - 1) * MINUTES_PER_TURN) / MINUTES_PER_TURN : 0;
  const offset = circumference * (1 - fraction);

  // Angle measured clockwise from the top (12 o'clock), 0-360.
  const angleFromPoint = useCallback((clientX: number, clientY: number) => {
    const el = containerRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    let angle = Math.atan2(dx, -dy) * 180 / Math.PI;
    if (angle < 0) angle += 360;
    return angle;
  }, []);

  const emit = useCallback(
    (minutes: number) => {
      if (minutes !== lastEmittedRef.current) {
        lastEmittedRef.current = minutes;
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(4);
          } catch {

            // ignore devices without vibration support
          }}
      }
      onChange(minutes);
    },
    [onChange]
  );

  useEffect(() => {
    if (!dragging) return;

    const handleMove = (e: PointerEvent) => {
      const state = dragStateRef.current;
      if (!state) return;
      const angle = angleFromPoint(e.clientX, e.clientY);

      // Use the shortest angular delta so crossing the 0°/360° seam never causes a jump —
      // it just keeps rolling into the next (or previous) lap instead.
      let delta = angle - state.lastAngle;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;

      state.lastAngle = angle;
      state.accumulatedMinutes += delta / DEGREES_PER_MINUTE;

      const clamped = Math.min(max, Math.max(min, state.accumulatedMinutes));
      const snapped = Math.round(clamped / step) * step;
      emit(snapped);
    };

    const handleUp = () => {
      setDragging(false);
      dragStateRef.current = null;
    };

    window.addEventListener('pointermove', handleMove, { passive: true });
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [dragging, angleFromPoint, emit, min, max, step]);

  const handlePointerDown = (e: React.PointerEvent) => {
    const angle = angleFromPoint(e.clientX, e.clientY);
    dragStateRef.current = { lastAngle: angle, accumulatedMinutes: value };
    setDragging(true);
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {

      // pointer capture not supported, drag still works via window listeners
    }};

  const knobRad = (fraction * 360 - 90) * Math.PI / 180;
  const knobX = size / 2 + radius * Math.cos(knobRad);
  const knobY = size / 2 + radius * Math.sin(knobRad);

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      className="glass relative touch-none select-none rounded-full"
      style={{ width: size, height: size, cursor: dragging ? 'grabbing' : 'grab' }}>
      
      <svg width={size} height={size} className="absolute inset-0 -rotate-90 pointer-events-none">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#fb923c"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: dragging ? 'none' : 'stroke-dashoffset 0.25s ease' }} />
        
      </svg>

      <TickRing size={size} radius={radius - strokeWidth / 2 - 8} progress={fraction} tickCount={30} />

      <div
        className="absolute rounded-full bg-white pointer-events-none"
        style={{
          width: dragging ? 22 : 18,
          height: dragging ? 22 : 18,
          left: knobX,
          top: knobY,
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 0 0 4px rgba(10,13,16,0.85), 0 0 20px 4px rgba(251,146,60,0.55)',
          transition: dragging ?
          'width 0.15s ease, height 0.15s ease' :
          'left 0.25s ease, top 0.25s ease, width 0.15s ease, height 0.15s ease'
        }} />
      

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {dragging ?
        <p className="font-display text-5xl text-white tabular-nums">{value}</p> :

        <motion.p
          key={value}
          initial={{ opacity: 0, y: 6, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          className="font-display text-5xl text-white tabular-nums">
          
            {value}
          </motion.p>
        }
        <p className="text-xs text-neutral-400 mt-1 tracking-wide uppercase">minutes</p>
        {lapCount > 1 &&
        <p className="text-[11px] text-ember-400 font-medium mt-1">
            Lap {lapCount} · {Math.floor(value / 60)}h {value % 60}m
          </p>
        }
      </div>
    </div>);

}