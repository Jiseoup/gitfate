import { expect, test } from 'vitest';
import { computeChart, type NatalChart } from '@/core/chart';
import { UTC } from '@/core/time';

const p = (c: NatalChart) =>
  [c.pillars.year, c.pillars.month, c.pillars.day, c.pillars.hour].map((x) => x.stem + x.branch);
const seoul = { kind: 'iana', name: 'Asia/Seoul' } as const;

test('Jiseoup in Seoul and UTC', () => {
  const birth = new Date('2022-04-28T04:46:16Z');
  expect(p(computeChart(birth, seoul))).toEqual(['壬寅', '甲辰', '辛亥', '乙未']);
  expect(p(computeChart(birth, UTC))).toEqual(['壬寅', '甲辰', '辛亥', '庚寅']);
});

test('day pillar follows local date', () => {
  const t = new Date('2022-04-28T15:30:00Z');
  expect(p(computeChart(t, seoul)).slice(2)).toEqual(['壬子', '庚子']);
  expect(p(computeChart(t, UTC)).slice(2)).toEqual(['辛亥', '丙申']);
});

test('year and month switch at the real 立春 instant regardless of tz', () => {
  // 2026 立春 = 2026-02-04 04:02:08 (UTC+8) = 2026-02-03T20:02:08Z
  const before = computeChart(new Date('2026-02-03T20:01:08Z'), seoul);
  const after = computeChart(new Date('2026-02-03T20:03:08Z'), seoul);
  expect(p(before).slice(0, 2)).toEqual(['乙巳', '己丑']);
  expect(p(after).slice(0, 2)).toEqual(['丙午', '庚寅']);
});

test('elements, zodiac, strongest and weakest', () => {
  const c = computeChart(new Date('2022-04-28T04:46:16Z'), seoul);
  expect(c.elementCounts).toEqual({ wood: 3, fire: 0, earth: 2, metal: 1, water: 2 });
  expect(c.strongest).toEqual(['wood']);
  expect(c.weakest).toEqual(['fire']);
  expect(c.zodiac).toEqual({ animal: 'tiger', element: 'water' });
  expect(c.dayMaster).toBe('辛');
});
