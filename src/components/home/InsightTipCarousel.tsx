import { useEffect, useRef, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, LightbulbIcon } from 'lucide-react';

interface InsightTipCarouselProps {
  tips: string[];
}

function getLocalDayNumber(date = new Date()) {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
}

function getDailyTipIndex(tipCount: number, dayNumber: number) {
  return tipCount > 1 ? dayNumber % tipCount : 0;
}

export function InsightTipCarousel({ tips }: InsightTipCarouselProps) {
  const [currentDay, setCurrentDay] = useState(() => getLocalDayNumber());
  const [activeIndex, setActiveIndex] = useState(() => getDailyTipIndex(tips.length, getLocalDayNumber()));
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timer = window.setTimeout(() => setCurrentDay(getLocalDayNumber()), nextMidnight.getTime() - now.getTime());

    return () => window.clearTimeout(timer);
  }, [currentDay]);

  useEffect(() => {
    setActiveIndex(getDailyTipIndex(tips.length, currentDay));
  }, [currentDay, tips.length]);

  useEffect(() => {
    if (isPaused || tips.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const timer = window.setInterval(() => {
      if (!document.hidden) {
        setActiveIndex((index) => (index + 1) % tips.length);
      }
    }, 7000);

    return () => window.clearInterval(timer);
  }, [isPaused, tips.length]);

  const showTip = (index: number) => {
    setActiveIndex((index + tips.length) % tips.length);
  };

  const handleTouchEnd = (touchEndX: number) => {
    if (touchStartX.current === null) return;

    const delta = touchEndX - touchStartX.current;
    if (Math.abs(delta) > 40) {
      showTip(activeIndex + (delta < 0 ? 1 : -1));
    }
    touchStartX.current = null;
  };

  return (
    <section
      aria-label="Insight tips"
      className="glass relative mt-6 mb-8 overflow-hidden rounded-2xl p-4 lg:col-span-2 lg:mt-0 lg:mb-0 lg:p-5"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsPaused(false);
        }
      }}
      onTouchStart={(event) => {
        touchStartX.current = event.changedTouches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        const touchEndX = event.changedTouches[0]?.clientX;
        if (touchEndX !== undefined) handleTouchEnd(touchEndX);
      }}>
      <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-ember-400/10 blur-3xl" />
      <div className="relative flex items-start gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-ember-400/10">
          <LightbulbIcon className="h-4 w-4 text-ember-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Insight Tip</p>
            <div className="flex items-center gap-2">
              <span className="font-numeric text-[10px] tabular-nums text-neutral-500">
                {String(activeIndex + 1).padStart(2, '0')} / {String(tips.length).padStart(2, '0')}
              </span>
              <button
                type="button"
                onClick={() => showTip(activeIndex - 1)}
                aria-label="Previous tip"
                className="rounded-full p-1 text-neutral-400 transition-colors hover:bg-white/10 hover:text-white">
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => showTip(activeIndex + 1)}
                aria-label="Next tip"
                className="rounded-full p-1 text-neutral-400 transition-colors hover:bg-white/10 hover:text-white">
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
              style={{
                width: `${tips.length * 100}%`,
                transform: `translateX(-${activeIndex * (100 / tips.length)}%)`
              }}>
              {tips.map((tip, index) => (
                <p
                  key={tip}
                  aria-hidden={index !== activeIndex}
                  className="flex-shrink-0 pr-2 text-sm leading-relaxed text-neutral-200"
                  style={{ flexBasis: `${100 / tips.length}%` }}>
                  {tip}
                </p>
              ))}
            </div>
          </div>
          <div className="mt-3 flex gap-1.5" aria-label="Choose a tip">
            {tips.map((tip, index) => (
              <button
                key={tip}
                type="button"
                onClick={() => showTip(index)}
                aria-label={`Show tip ${index + 1}`}
                aria-current={index === activeIndex ? 'true' : undefined}
                className={`h-1 rounded-full transition-all duration-300 ${
                  index === activeIndex ? 'w-5 bg-ember-400' : 'w-1.5 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
