import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CELEBRATION_EVENT } from '../../utils/celebration';

const COLORS = ['#fdba74', '#fb923c', '#f59e0b', '#ea580c', '#fff7ed'];

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
