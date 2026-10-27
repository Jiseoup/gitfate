import { expect, test } from 'vitest';
import { computeChart } from '@/core/chart';
import { dailyFortune } from '@/core/daily';
import { branchElement } from '@/core/ganzhi';
import { UTC } from '@/core/time';

function dayKeyPlus(key: string, n: number): string {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

const chart = computeChart(new Date('2022-04-28T04:46:16Z'), { kind: 'iana', name: 'Asia/Seoul' });

test('2026-10-27 for jiseoup', () => {
  const f = dailyFortune(chart, 'Jiseoup', '2026-10-27');
  expect(f.dayPillar).toEqual({ stem: '甲', branch: '戌' });
  expect(f.tenGod).toBe('zhengcai'); // 辛 vs 甲
  expect(f.branchRelation).toBe('none'); // 戌 vs 亥
  expect(f.yi).toEqual(['祭祀', '出行', '修造']); // only supported items, library order, max 3
  expect(f.ji).toEqual(['动土', '破土', '安葬']);
  expect(f.variantSeed).toBe('jiseoup|2026-10-27');
});

test('deterministic and case-insensitive login', () => {
  expect(dailyFortune(chart, 'JISEOUP', '2026-10-27')).toEqual(
    dailyFortune(chart, 'jiseoup', '2026-10-27'),
  );
});

test('stars in 1..5, lucky hour matches lucky element', () => {
  const f = dailyFortune(chart, 'jiseoup', '2026-10-27');
  for (const v of Object.values(f.stars)) {
    expect(v).toBeGreaterThanOrEqual(1);
    expect(v).toBeLessThanOrEqual(5);
  }
  expect(branchElement(f.lucky.hourBranch)).toBe(f.lucky.element);
});

test('pressure days take the element that supports the day master', () => {
  // 辛(metal) day master on a 丁 (qisha) day -> earth generates metal
  const d = Array.from({ length: 60 }, (_, i) => dayKeyPlus('2026-10-27', i)).find(
    (k) => dailyFortune(chart, 'x', k).tenGod === 'qisha',
  )!;
  expect(dailyFortune(chart, 'x', d).lucky.element).toBe('earth');
});

test('rejects malformed dates', () => {
  expect(() => dailyFortune(chart, 'x', '2026-1-5')).toThrow();
  expect(() => dailyFortune(chart, 'x', 'tomorrow')).toThrow();
});

test('score spread over many users and days', () => {
  const scores: number[] = [];
  for (let u = 0; u < 60; u++) {
    const c = computeChart(new Date(Date.UTC(2010 + (u % 15), u % 12, 1 + (u % 27), u % 24)), UTC);
    for (let i = 0; i < 365; i++) {
      scores.push(dailyFortune(c, `user${u}`, dayKeyPlus('2026-01-01', i)).score);
    }
  }
  scores.sort((a, b) => a - b);
  expect(scores[0]).toBeGreaterThanOrEqual(20);
  expect(scores.at(-1)).toBeLessThanOrEqual(99);
  expect(scores[Math.floor(scores.length * 0.1)]).toBeLessThanOrEqual(45);
  expect(scores[Math.floor(scores.length * 0.9)]).toBeGreaterThanOrEqual(80);
});
