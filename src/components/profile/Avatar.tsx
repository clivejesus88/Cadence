import BoringAvatar from 'boring-avatars';
import { AvatarVariant, findAvatar, resolveAvatar } from '../../data/avatars';

interface AvatarProps {
  value?: string;
  className?: string;
  alt?: string;
  /** Stable seed for the generated avatar — falls back to the preset id. */
  seed?: string;
}

export function Avatar({ value, className = 'h-11 w-11', alt = 'Avatar', seed }: AvatarProps) {
  const { preset, src } = resolveAvatar(value);

  if (src) {
    return <img src={src} alt={alt} className={`rounded-full object-cover ${className}`} />;
  }

  const p = preset ?? findAvatar('marble');
  return (
    <span
      className={`avatar-fill relative inline-block overflow-hidden rounded-full ${className}`}
      role="img"
      aria-label={alt}>
      <BoringAvatar
        size="100%"
        square
        name={seed ?? p.id}
        variant={p.id as AvatarVariant}
        colors={p.colors}
      />
    </span>
  );
}
