/** `YYYY-MM-DD` keys are calendar dates, so they are formatted in UTC to avoid any shift. */
function utcDate(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00Z`);
}

/** `2026-10-27` → "2026년 10월 27일" / "October 27, 2026". */
export function formatLongDate(locale: string, dateKey: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(utcDate(dateKey));
}

/** `2026-02-04` → "2월 4일" / "Feb 4". */
export function formatShortDay(locale: string, dateKey: string): string {
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(utcDate(dateKey));
}

/** Saju month label as a familiar month name: 2 → "2월" / "Feb". */
export function formatMonthShort(locale: string, month: number): string {
  return new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2000, month - 1, 15)));
}

/** Whole years from one `YYYY-MM-DD` date to another: "GitHub age" on the signup anniversary. */
export function fullYears(fromKey: string, toKey: string): number {
  const years = Number(toKey.slice(0, 4)) - Number(fromKey.slice(0, 4));
  return toKey.slice(5) < fromKey.slice(5) ? years - 1 : years;
}
