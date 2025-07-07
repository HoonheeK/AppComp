export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function formatDate(date: Date): string {
  // YYYY-MM-DD
  return date.toISOString().slice(0, 10);
}

export function getDaysBetween(start: Date | string, end: Date | string): number {
  const s = typeof start === 'string' ? new Date(start) : start;
  const e = typeof end === 'string' ? new Date(end) : end;
  return Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
}