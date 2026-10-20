import { useId } from 'react';
import { AvatarShape, findAvatar, resolveAvatar } from '../../data/avatars';

interface AvatarProps {
  value?: string;
  className?: string;
  alt?: string;
}

function ShapeLayer({ shape, id, glow }: { shape: AvatarShape; id: string; glow: string }) {
  switch (shape) {
    case 'ring':
      return (
        <>
          <circle cx="50" cy="50" r="30" fill="none" stroke="#fff" strokeOpacity="0.85" strokeWidth="9" />
          <circle cx="50" cy="50" r="17" fill={`url(#g-${id})`} />
        </>
      );
    case 'prism':
      return <path d="M50 20 L80 70 L20 70 Z" fill={`url(#g-${id})`} stroke="#fff" strokeOpacity="0.35" strokeWidth="3" strokeLinejoin="round" />;
    case 'mesh':
      return (
        <g stroke="#fff" strokeOpacity="0.55" strokeWidth="4" strokeLinecap="round" fill="none">
          <path d="M28 40 Q50 20 72 40" />
          <path d="M28 60 Q50 80 72 60" />
          <circle cx="50" cy="50" r="6" fill={glow} stroke="none" />
        </g>
      );
    case 'bloom':
      return (
        <g fill="#fff" fillOpacity="0.9">
          <circle cx="50" cy="50" r="20" fill={`url(#g-${id})`} />
          <circle cx="50" cy="26" r="7" />
          <circle cx="50" cy="74" r="7" />
          <circle cx="26" cy="50" r="7" />
          <circle cx="74" cy="50" r="7" />
        </g>
      );
    case 'orb':
    default:
      return <circle cx="50" cy="50" r="34" fill={`url(#g-${id})`} />;
  }
}

export function Avatar({ value, className = 'h-11 w-11', alt = 'Avatar' }: AvatarProps) {
  const uid = useId().replace(/:/g, '');
  const { preset, src } = resolveAvatar(value);

  if (src) {
    return <img src={src} alt={alt} className={`rounded-full object-cover ${className}`} />;
  }

  const p = preset ?? findAvatar('ember-orb');
  return (
    <svg viewBox="0 0 100 100" role="img" aria-label={p.name} className={`rounded-full ${className}`}>
      <defs>
        <linearGradient id={`g-${uid}`} x1="20" y1="12" x2="82" y2="90" gradientUnits="userSpaceOnUse">
          <stop stopColor={p.gradient[0]} />
          <stop offset="1" stopColor={p.gradient[1]} />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="50" fill="#181c22" />
      <rect width="100" height="100" rx="50" fill={`url(#g-${uid})`} fillOpacity="0.18" />
      <ShapeLayer shape={p.shape} id={uid} glow={p.glow} />
    </svg>
  );
}
