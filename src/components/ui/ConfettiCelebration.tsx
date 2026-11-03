import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { CELEBRATION_EVENT } from '../../utils/celebration';

const COLORS = ['#fb923c', '#fbbf24', '#34d399', '#38bdf8', '#c084fc', '#f472b6', '#f8fafc'];
const PARTICLE_COUNT = 112;

interface ConfettiParticle {
  id: number;
  originX: number;
  originY: number;
  driftX: number;
  peakY: number;
  finishY: number;
  rotation: number;
  wobble: number;
  delay: number;
  duration: number;
  color: string;
  width: number;
  height: number;
  shape: 'circle' | 'paper' | 'streamer';
}

interface ConfettiBurst {
  id: number;
  particles: ConfettiParticle[];
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function createParticles(): ConfettiParticle[] {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const count = width < 480 ? Math.round(PARTICLE_COUNT * 0.65) : PARTICLE_COUNT;

  return Array.from({ length: count }, (_, id) => {
    const fromLeft = id % 2 === 0;
    const direction = fromLeft ? 1 : -1;
    const originX = width * (fromLeft ? randomBetween(0.02, 0.13) : randomBetween(0.87, 0.98));
    const originY = height * randomBetween(0.58, 0.82);
    const shape = id % 9 === 0 ? 'streamer' : id % 4 === 0 ? 'circle' : 'paper';
    const driftX = direction * randomBetween(width * 0.12, width * 0.58) +
      randomBetween(-width * 0.08, width * 0.08);
    const peakY = height * randomBetween(0.28, 0.72);
    return {
      id,
      originX,
      originY,
      driftX,
      peakY,
      finishY: height * randomBetween(0.3, 0.75),
      rotation: randomBetween(-540, 540),
      wobble: randomBetween(-width * 0.04, width * 0.04),
      delay: randomBetween(0, 0.35),
      duration: randomBetween(2.4, 4.1),
      color: COLORS[id % COLORS.length],
      width: shape === 'streamer' ? randomBetween(3, 5) : randomBetween(5, 10),
      height: shape === 'streamer' ? randomBetween(16, 28) : randomBetween(7, 16),
      shape
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
    const duration = Math.max(...burst.particles.map((particle) => particle.duration + particle.delay));
    const timeout = window.setTimeout(() => setBurst(null), duration * 1000 + 300);
    return () => window.clearTimeout(timeout);
  }, [burst]);

  if (!burst) return null;

  return createPortal(
    <div key={burst.id} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {burst.particles.map((particle) => (
        <motion.span
          key={particle.id}
          className="absolute left-0 top-0"
          style={{
            width: particle.width,
            height: particle.height,
            borderRadius: particle.shape === 'circle' ? '50%' : particle.shape === 'streamer' ? '999px' : '1px',
            backgroundColor: particle.color,
            transformOrigin: 'center',
            perspective: 400,
            backfaceVisibility: 'hidden',
            willChange: 'transform, opacity'
          }}
          initial={{
            opacity: 0,
            x: particle.originX,
            y: particle.originY,
            rotate: 0,
            rotateX: 0,
            rotateY: 0,
            scale: 0.4
          }}
          animate={{
            opacity: [0, 1, 1, 0],
            x: [
              particle.originX,
              particle.originX + particle.driftX * 0.32,
              particle.originX + particle.driftX * 0.72 + particle.wobble,
              particle.originX + particle.driftX
            ],
            y: [
              particle.originY,
              particle.originY - particle.peakY,
              particle.originY - particle.peakY * 0.45,
              particle.originY + particle.finishY
            ],
            rotate: [0, particle.rotation * 0.35, particle.rotation * 0.7, particle.rotation],
            rotateX: [0, particle.rotation * 0.2, particle.rotation * 0.65, particle.rotation],
            rotateY: [0, particle.rotation * 0.3, particle.rotation * 0.8, particle.rotation],
            scale: [0.4, 1, 0.9, 0.5]
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            times: [0, 0.24, 0.68, 1],
            ease: ['easeOut', 'easeInOut', 'easeIn']
          }}
        />
      ))}
    </div>,
    document.body
  );
}
