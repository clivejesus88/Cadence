import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { CELEBRATION_EVENT } from '../../utils/celebration';

const COLORS = ['#fb923c', '#fbbf24', '#34d399', '#38bdf8', '#c084fc', '#f472b6', '#f8fafc'];
const PARTICLE_COUNT = 72;

interface ConfettiParticle {
  id: number;
  startX: number;
  driftX: number;
  startY: number;
  fall: number;
  rotation: number;
  flip: number;
  delay: number;
  duration: number;
  color: string;
  width: number;
  height: number;
  circle: boolean;
}

interface ConfettiBurst {
  id: number;
  particles: ConfettiParticle[];
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function createParticles(): ConfettiParticle[] {
  const width = Math.min(window.innerWidth, 1000);
  const height = window.innerHeight;
  const wind = randomBetween(-width * 0.1, width * 0.1);
  return Array.from({ length: PARTICLE_COUNT }, (_, id) => {
    const direction = Math.random() < 0.5 ? -1 : 1;
    return {
      id,
      startX: randomBetween(-width * 0.5, width * 0.5),
      driftX: wind + direction * randomBetween(12, width * 0.12),
      startY: randomBetween(-height * 0.35, -16),
      fall: height * randomBetween(1.15, 1.65),
      rotation: randomBetween(-720, 720),
      flip: randomBetween(180, 720),
      delay: randomBetween(0, 0.75),
      duration: randomBetween(3.2, 5),
      color: COLORS[id % COLORS.length],
      width: randomBetween(5, 9),
      height: randomBetween(7, 15),
      circle: id % 6 === 0
    };
  });
}

export function ConfettiCelebration() {
  const [burst, setBurst] = useState<ConfettiBurst | null>(null);

  useEffect(() => {
    const handleCelebrate = () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      setBurst({ id: Date.now() + Math.random(), particles: createParticles() });
    };
    window.addEventListener(CELEBRATION_EVENT, handleCelebrate);
    return () => window.removeEventListener(CELEBRATION_EVENT, handleCelebrate);
  }, []);

  useEffect(() => {
    if (!burst) return;
    const timeout = window.setTimeout(() => setBurst(null), 6000);
    return () => window.clearTimeout(timeout);
  }, [burst]);

  if (!burst) return null;

  return createPortal(
    <div key={burst.id} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {burst.particles.map((particle) => (
        <motion.span
          key={particle.id}
          className="absolute left-1/2 top-0"
          style={{
            width: particle.circle ? particle.width : particle.width * 0.62,
            height: particle.circle ? particle.width : particle.height,
            borderRadius: particle.circle ? '50%' : '1px',
            backgroundColor: particle.color,
            transformOrigin: 'center',
            perspective: 400,
            backfaceVisibility: 'hidden'
          }}
          initial={{
            opacity: 1,
            x: particle.startX,
            y: particle.startY,
            rotate: 0,
            rotateY: 0
          }}
          animate={{
            opacity: [0, 1, 1, 0],
            x: [particle.startX, particle.startX + particle.driftX * 0.35, particle.startX + particle.driftX],
            y: [particle.startY, particle.startY + particle.fall * 0.12, particle.startY + particle.fall],
            rotate: [0, particle.rotation * 0.3, particle.rotation],
            rotateY: [0, particle.flip * 0.45, particle.flip]
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            times: [0, 0.12, 0.82, 1],
            ease: ['easeIn', 'linear', 'easeIn']
          }}
        />
      ))}
    </div>,
    document.body
  );
}
