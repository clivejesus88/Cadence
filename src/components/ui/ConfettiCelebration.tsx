import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CELEBRATION_EVENT } from '../../utils/celebration';

const COLORS = ['#fb923c', '#fbbf24', '#34d399', '#38bdf8', '#c084fc', '#f472b6', '#f8fafc'];

export function ConfettiCelebration() {
  useEffect(() => {
    const handleCelebrate = () => {
      confetti({
        particleCount: 150,
        spread: 60,
        colors: COLORS,
        disableForReducedMotion: true
      });
    };

    window.addEventListener(CELEBRATION_EVENT, handleCelebrate);
    return () => window.removeEventListener(CELEBRATION_EVENT, handleCelebrate);
  }, []);

  return null;
}
