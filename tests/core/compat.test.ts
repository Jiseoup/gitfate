import { expect, test } from 'vitest';
import { computeChart } from '@/core/chart';
import { compatibility, sharedLanguages } from '@/core/compat';
import { UTC } from '@/core/time';

const at = (iso: string) => computeChart(new Date(iso), UTC);

test('symmetric score, giver flips', () => {
  const a = at('2022-04-28T04:46:16Z'),
    b = at('2015-03-02T10:00:00Z');
  const ab = compatibility(a, b),
    ba = compatibility(b, a);
  expect(ba.score).toBe(ab.score);
  expect(ba.sub).toEqual(ab.sub);
  expect(ba.flow).toBe(ab.flow);
  if (ab.giver) expect(ba.giver).toBe(ab.giver === 'a' ? 'b' : 'a');
});

test('self compatibility is same-element and deterministic', () => {
  const a = at('2022-04-28T04:46:16Z');
  expect(compatibility(a, a)).toEqual(compatibility(a, a));
  expect(compatibility(a, a).flow).toBe('same');
  expect(compatibility(a, a).giver).toBeNull();
});

test('extremes are rare', () => {
  const charts = Array.from({ length: 200 }, (_, i) =>
    at(new Date(Date.UTC(2008, 0, 1) + i * 2_700_000_000 + (i % 24) * 3_600_000).toISOString()),
  );
  const s: number[] = [];
  for (let i = 0; i < charts.length; i++)
    for (let j = i + 1; j < charts.length; j += 3) s.push(compatibility(charts[i], charts[j]).score);
  expect(s.filter((x) => x < 30).length / s.length).toBeLessThan(0.05);
  expect(s.filter((x) => x > 95).length / s.length).toBeLessThan(0.06);
});

test('scores are integers within 10..99 and symmetric across many pairs', () => {
  const charts = Array.from({ length: 40 }, (_, i) => at(new Date(Date.UTC(2010, 0, 1) + i * 97_000_000_000 / 40).toISOString()));
  for (const a of charts)
    for (const b of charts) {
      const ab = compatibility(a, b),
        ba = compatibility(b, a);
      for (const n of [ab.score, ...Object.values(ab.sub)]) {
        expect(Number.isInteger(n)).toBe(true);
        expect(n).toBeGreaterThanOrEqual(10);
        expect(n).toBeLessThanOrEqual(99);
      }
      expect(ba.score).toBe(ab.score);
      expect(ba.sub).toEqual(ab.sub);
      expect(ba.flow).toBe(ab.flow);
      expect(ba.dayBranch).toBe(ab.dayBranch);
      expect(ba.zodiac).toBe(ab.zodiac);
      if (ab.giver) expect(ba.giver).toBe(ab.giver === 'a' ? 'b' : 'a');
      else expect(ba.giver).toBeNull();
    }
});

test('shared languages', () => {
  expect(sharedLanguages(['TypeScript', 'Go', 'Rust'], ['rust', 'Python', 'typescript'])).toEqual([
    'TypeScript',
    'Rust',
  ]);
});
