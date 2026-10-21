export function detectTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return typeof tz === 'string' ? tz : '';
  } catch {
    return '';
  }
}

export function currentHourIn(timezone: string, date: Date = new Date()): number {
  try {
    const formatted = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone || undefined,
      hour: 'numeric',
      hour12: false
    }).format(date);
    const hour = parseInt(formatted, 10);
    return Number.isNaN(hour) ? date.getHours() : hour % 24;
  } catch {
    return date.getHours();
  }
}
