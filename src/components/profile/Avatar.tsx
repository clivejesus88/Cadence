import BoringAvatar from 'boring-avatars';
import { createAvatar } from '@dicebear/core';
import * as adventurer from '@dicebear/adventurer';
import { findAvatar, resolveAvatar } from '../../data/avatars';

interface AvatarProps {
  value?: string;
  className?: string;
  alt?: string;
}

export function Avatar({ value, className = 'h-11 w-11', alt = 'Avatar' }: AvatarProps) {
  const { preset, src } = resolveAvatar(value);

  if (src) {
    return <img src={src} alt={alt} className={`rounded-[18px] object-cover shadow-[0_10px_20px_rgba(0,0,0,0.28)] ${className}`} />;
  }

  const p = preset ?? findAvatar('adventurer-ember');

  if (p.style === 'adventurer') {
    const avatar = createAvatar(adventurer, {
      seed: p.seed,
      size: 128
    });
    return (
      <img
        src={avatar.toDataUri()}
        alt={alt}
        className={`rounded-[18px] object-contain shadow-[0_10px_20px_rgba(0,0,0,0.28)] ${className}`}
      />
    );
  }

  return (
    <span
      className={`avatar-fill relative inline-block overflow-hidden rounded-[18px] shadow-[0_10px_20px_rgba(0,0,0,0.28)] ${className}`}
      role="img"
      aria-label={alt}>
      <BoringAvatar
        size={128}
        square
        name={p.seed}
        variant={p.variant ?? 'beam'}
        colors={p.colors ?? ['#e5e7eb', '#334155', '#fb923c', '#0b0d10']}
      />
    </span>
  );
}
