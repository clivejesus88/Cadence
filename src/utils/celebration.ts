export const CELEBRATION_EVENT = 'cadence:celebrate';

export function celebrate(): void {
  window.dispatchEvent(new Event(CELEBRATION_EVENT));
}
