export type TzSpec = { kind: 'iana'; name: string } | { kind: 'offset'; minutes: number };

export interface WallClock {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export const UTC: TzSpec = { kind: 'offset', minutes: 0 };
export const CHINA_STANDARD: TzSpec = { kind: 'offset', minutes: 480 };

function ianaFormatter(name: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: name,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  });
}

export function isValidIana(name: string): boolean {
  try {
    ianaFormatter(name);
    return true;
  } catch {
    return false;
  }
}

export function toWallClock(instant: Date, tz: TzSpec): WallClock {
  if (tz.kind === 'offset') {
    const d = new Date(instant.getTime() + tz.minutes * 60000);
    return {
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
      day: d.getUTCDate(),
      hour: d.getUTCHours(),
      minute: d.getUTCMinutes(),
      second: d.getUTCSeconds(),
    };
  }
  const v: Record<string, number> = {};
  for (const part of ianaFormatter(tz.name).formatToParts(instant)) {
    if (part.type !== 'literal') v[part.type] = Number(part.value);
  }
  return {
    year: v.year,
    month: v.month,
    day: v.day,
    hour: v.hour % 24,
    minute: v.minute,
    second: v.second,
  };
}

export function localDateKey(instant: Date, tz: TzSpec): string {
  const w = toWallClock(instant, tz);
  const pad = (n: number, len: number) => String(n).padStart(len, '0');
  return `${pad(w.year, 4)}-${pad(w.month, 2)}-${pad(w.day, 2)}`;
}

export function tzOffsetMinutes(tz: TzSpec, at: Date): number {
  if (tz.kind === 'offset') return tz.minutes;
  const w = toWallClock(at, tz);
  const asUtc = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second);
  const wholeSeconds = Math.floor(at.getTime() / 1000) * 1000;
  return Math.round((asUtc - wholeSeconds) / 60000);
}

/** Seconds from `now` until the next 00:00 wall clock in `tz` (DST-aware: a local day can be 23 or 25 hours). */
export function secondsUntilNextMidnight(now: Date, tz: TzSpec): number {
  const w = toWallClock(now, tz);
  const midnightAsUtc = Date.UTC(w.year, w.month - 1, w.day + 1);
  // Subtract the offset in effect at midnight; one refinement step settles DST changes.
  let instant = midnightAsUtc - tzOffsetMinutes(tz, now) * 60000;
  instant = midnightAsUtc - tzOffsetMinutes(tz, new Date(instant)) * 60000;
  return Math.ceil((instant - now.getTime()) / 1000);
}

export function tzLabel(tz: TzSpec, at: Date): string {
  if (tz.kind === 'iana') return tz.name;
  void at;
  if (tz.minutes === 0) return 'UTC';
  const sign = tz.minutes < 0 ? '-' : '+';
  const abs = Math.abs(tz.minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return m === 0 ? `UTC${sign}${h}` : `UTC${sign}${h}:${String(m).padStart(2, '0')}`;
}
