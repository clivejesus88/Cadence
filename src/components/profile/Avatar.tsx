import BoringAvatar from 'boring-avatars';
import { findAvatar, resolveAvatar } from '../../data/avatars';

interface AvatarProps {
  value?: string;
  className?: string;
  alt?: string;
}

export function Avatar({ value, className = 'h-11 w-11', alt = 'Avatar' }: AvatarProps) {
  const { preset, src } = resolveAvatar(value);

  if (src) {
    return <img src={src} alt={alt} className={`rounded-full object-cover ${className}`} />;
  }

  const p = preset ?? findAvatar('beam-ember');
  return (
    <span
      className={`avatar-fill relative inline-block overflow-hidden rounded-full ${className}`}
      role="img"
      aria-label={alt}>
      <BoringAvatar
        size={128}
        square
        name={p.seed}
        variant={p.variant}
        colors={p.colors}
      />
    </span>
  );
}
