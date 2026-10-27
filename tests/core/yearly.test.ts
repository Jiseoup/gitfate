import { test, expect } from 'vitest';
import { computeChart } from '@/core/chart';
import {
  realityCheck,
  sajuMonths,
  sajuYearAt,
  sumByMonths,
  yearlyFortune,
} from '@/core/yearly';

test('saju year switches at 立春', () => {
  expect(sajuYearAt(new Date('2026-01-20T00:00:00Z')).pillar).toEqual({ stem: '乙', branch: '巳' });
  const y = sajuYearAt(new Date('2026-10-27T00:00:00Z'));
  expect(y.pillar).toEqual({ stem: '丙', branch: '午' });
  expect(y.startYear).toBe(2026);
  expect(y.start.toISOString()).toBe('2026-02-03T20:02:08.000Z');
  expect(y.end.toISOString()).toBe('2027-02-04T01:46:18.000Z');
});

test('saju year flips at the 立春 instant, not at midnight of the day', () => {
  const before = sajuYearAt(new Date('2026-02-03T20:02:07Z'));
  expect(before.pillar).toEqual({ stem: '乙', branch: '巳' });
  expect(before.startYear).toBe(2025);
  expect(before.end.toISOString()).toBe('2026-02-03T20:02:08.000Z');
  const at = sajuYearAt(new Date('2026-02-03T20:02:08Z'));
  expect(at.pillar).toEqual({ stem: '丙', branch: '午' });
  expect(at.startYear).toBe(2026);
  expect(at.start.toISOString()).toBe('2026-02-03T20:02:08.000Z');
});

test('twelve solar-term months', () => {
  const m = sajuMonths(sajuYearAt(new Date('2026-10-27T00:00:00Z')));
  expect(m).toHaveLength(12);
  expect(m[0]).toMatchObject({
    pillar: { stem: '庚', branch: '寅' },
    labelMonth: 2,
    startDate: '2026-02-04',
    endDate: '2026-03-05',
  });
  expect(m[8]).toMatchObject({
    pillar: { stem: '戊', branch: '戌' },
    startDate: '2026-10-08',
    endDate: '2026-11-07',
  });
  expect(m[11]).toMatchObject({
    pillar: { stem: '辛', branch: '丑' },
    labelMonth: 1,
    startDate: '2027-01-05',
  });
});

test('yearly fortune for jiseoup', () => {
  const chart = computeChart(new Date('2022-04-28T04:46:16Z'), { kind: 'iana', name: 'Asia/Seoul' });
  const f = yearlyFortune(chart, new Date('2026-10-27T00:00:00Z'));
  expect(f.tenGod).toBe('zhengguan'); // 辛 vs 丙
  expect(f.branchRelations).toEqual(['sanhe', 'none', 'none', 'liuhe']); // 午 vs 寅 辰 亥 未
  expect(f.months.every((x) => x.score >= 20 && x.score <= 99)).toBe(true);
});

test('sumByMonths and reality', () => {
  const months = sajuMonths(sajuYearAt(new Date('2026-10-27T00:00:00Z')));
  const sums = sumByMonths(
    [
      { date: '2026-02-03', count: 5 },
      { date: '2026-02-04', count: 2 },
      { date: '2026-03-05', count: 3 },
    ],
    months,
    '2026-10-27',
  );
  expect(sums[0]).toBe(2);
  expect(sums[1]).toBe(3);
  expect(sums[9]).toBeNull(); // 立冬(11/7) 이후 달
  expect(realityCheck(140, 100)).toEqual({ kind: 'up', pct: 40 });
  expect(realityCheck(95, 100)).toEqual({ kind: 'flat', pct: -5 });
  expect(realityCheck(60, 100)).toEqual({ kind: 'down', pct: -40 });
  expect(realityCheck(0, 0)).toEqual({ kind: 'none', pct: 0 });
  expect(realityCheck(10, 0)).toEqual({ kind: 'up', pct: 100 });
});
