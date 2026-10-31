const AVATAR_CHOICE_KEY_PREFIX = 'cadence:avatar-selected:';

export function hasChosenAvatar(userId: string | null | undefined): boolean {
  if (!userId) return false;
  try {
    return localStorage.getItem(`${AVATAR_CHOICE_KEY_PREFIX}${userId}`) === '1';
  } catch {
    return false;
  }
}

export function markAvatarChosen(userId: string): void {
  localStorage.setItem(`${AVATAR_CHOICE_KEY_PREFIX}${userId}`, '1');
}
