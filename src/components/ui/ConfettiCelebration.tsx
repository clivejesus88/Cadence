import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { CELEBRATION_EVENT } from '../../utils/celebration';

const COLORS = ['#fb923c', '#fbbf24', '#34d399', '#38bdf8', '#c084fc', '#f472b6'];
const PARTICLE_COUNT = 56;

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  delay: number;
  color: string;
  size: number;
  round: boolean;
}

function createParticles(): ConfettiParticle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, id) => ({
    id,
    x: (Math.random() - 0.5) * Math.min(window.innerWidth * 0.95, 900),
    y: window.innerHeight * (0.12 + Math.random() * 0.16),
    rotation: (Math.random() - 0.5) * 1080,
    delay: Math.random() * 0.3,
    color: COLORS[id % COLORS.length],
    size: 5 + Math.random() * 7,
    round: id % 4 === 0
  }));
}

export function ConfettiCelebration() {
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);

  useEffect(() => {
    const handleCelebrate = () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      setParticles(createParticles());
    };
    window.addEventListener(CELEBRATION_EVENT, handleCelebrate);
    return () => window.removeEventListener(CELEBRATION_EVENT, handleCelebrate);
  }, []);

  useEffect(() => {
    if (particles.length === 0) return;
    const timeout = window.setTimeout(() => setParticles([]), 2200);
    return () => window.clearTimeout(timeout);
  }, [particles]);

  if (particles.length === 0) return null;

  return createPortal(
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.55, 0] }}
        transition={{ duration: 1.8, ease: 'easeOut' }}
        style={{
          background:
            'radial-gradient(ellipse at 50% 28%, rgba(251,146,60,0.2), rgba(251,146,60,0.06) 34%, transparent 68%)'
        }}
      />
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className="absolute left-1/2 top-0"
          style={{
            width: particle.round ? particle.size : particle.size * 0.68,
            height: particle.round ? particle.size : particle.size * 1.55,
            borderRadius: particle.round ? '999px' : '2px',
            backgroundColor: particle.color,
            boxShadow: `0 0 12px ${particle.color}88`
          }}
          initial={{ opacity: 0, x: 0, y: particle.y, rotate: 0, scale: 0.4 }}
          animate={{
            opacity: [0, 1, 1, 0],
            x: particle.x,
            y: particle.y + window.innerHeight * 0.62,
            rotate: particle.rotation,
            scale: [0.4, 1.1, 0.8]
          }}
          transition={{ duration: 1.9, delay: particle.delay, ease: 'easeOut' }}
        />
      ))}
    </div>,
    document.body
  );
}
