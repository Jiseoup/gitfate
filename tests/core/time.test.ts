import { expect, test } from 'vitest';
import {
  CHINA_STANDARD,
  UTC,
  isValidIana,
  localDateKey,
  secondsUntilNextMidnight,
  toWallClock,
  tzLabel,
  tzOffsetMinutes,
} from '@/core/time';

test('wall clock for iana and offset', () => {
  const t = new Date('2022-04-28T04:46:16Z');
  expect(toWallClock(t, { kind: 'iana', name: 'Asia/Seoul' })).toEqual({
    year: 2022,
    month: 4,
    day: 28,
    hour: 13,
    minute: 46,
    second: 16,
  });
  expect(toWallClock(t, { kind: 'offset', minutes: -300 }).hour).toBe(23);
  expect(localDateKey(new Date('2022-04-28T15:30:00Z'), { kind: 'offset', minutes: 540 })).toBe(
    '2022-04-29',
  );
  expect(isValidIana('Europe/Berlin')).toBe(true);
  expect(isValidIana('Mars/Base')).toBe(false);
  expect(tzLabel({ kind: 'offset', minutes: 330 }, t)).toBe('UTC+5:30');
});

test('midnight is hour 0 and offsets are labelled', () => {
  const t = new Date('2022-04-27T15:00:00Z');
  expect(toWallClock(t, { kind: 'iana', name: 'Asia/Seoul' }).hour).toBe(0);
  expect(tzLabel(UTC, t)).toBe('UTC');
  expect(tzLabel({ kind: 'offset', minutes: 540 }, t)).toBe('UTC+9');
  expect(tzLabel({ kind: 'offset', minutes: -210 }, t)).toBe('UTC-3:30');
  expect(tzLabel({ kind: 'iana', name: 'Asia/Seoul' }, t)).toBe('Asia/Seoul');
  expect(CHINA_STANDARD).toEqual({ kind: 'offset', minutes: 480 });
});

test('tzOffsetMinutes follows daylight saving for iana zones', () => {
  const berlin = { kind: 'iana', name: 'Europe/Berlin' } as const;
  expect(tzOffsetMinutes(berlin, new Date('2022-01-15T12:00:00Z'))).toBe(60);
  expect(tzOffsetMinutes(berlin, new Date('2022-07-15T12:00:00Z'))).toBe(120);
  expect(tzOffsetMinutes({ kind: 'offset', minutes: -300 }, new Date())).toBe(-300);
});

test('seconds until the next local midnight, across a DST change', () => {
  const now = new Date('2026-10-27T03:25:41Z');
  expect(secondsUntilNextMidnight(now, { kind: 'offset', minutes: 540 })).toBe(11 * 3600 + 34 * 60 + 19);
  expect(secondsUntilNextMidnight(now, UTC)).toBe(20 * 3600 + 34 * 60 + 19);
  expect(secondsUntilNextMidnight(new Date('2026-10-27T15:00:00Z'), { kind: 'iana', name: 'Asia/Seoul' })).toBe(24 * 3600);
  // New York falls back on 2026-11-01: that local day is 25 hours long.
  expect(secondsUntilNextMidnight(new Date('2026-11-01T04:00:00Z'), { kind: 'iana', name: 'America/New_York' })).toBe(25 * 3600);
  // And springs forward on 2026-03-08: 23 hours.
  expect(secondsUntilNextMidnight(new Date('2026-03-08T05:00:00Z'), { kind: 'iana', name: 'America/New_York' })).toBe(23 * 3600);
});
