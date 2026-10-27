import { expect, test } from 'vitest';
import { hashSeed, seededInt } from '@/core/seed';

test('hashSeed is deterministic and order-sensitive', () => {
  expect(hashSeed('jiseoup', '2026-10-27')).toBe(hashSeed('jiseoup', '2026-10-27'));
  expect(hashSeed('a', 'b')).not.toBe(hashSeed('b', 'a'));
  expect(hashSeed('ab', 'c')).not.toBe(hashSeed('a', 'bc'));
});

test('seededInt stays in range and covers it', () => {
  const seen = new Set<number>();
  for (let i = 0; i < 2000; i++) {
    const v = seededInt(-18, 18, 'u', String(i));
    expect(v).toBeGreaterThanOrEqual(-18);
    expect(v).toBeLessThanOrEqual(18);
    seen.add(v);
  }
  expect(seen.size).toBe(37);
});

test('golden values: the algorithm (and so every published reading) must not change by accident', () => {
  // FNV-1a 32-bit reference vectors: offset basis for '', and the published value for 'a'.
  expect(hashSeed('')).toBe(0x811c9dc5);
  expect(hashSeed('a')).toBe(0xe40c292c);
  expect(hashSeed('jiseoup', '2026-10-27')).toBe(4159256645);
  expect(hashSeed('jiseoup|natal')).toBe(1412345494);
  expect(seededInt(0, 99, 'jiseoup', '2026-10-27')).toBe(0);
  expect(seededInt(0, 99, 'jiseoup|natal')).toBe(7);
  expect(seededInt(0, 99, 'gaearon', '2027-01-01')).toBe(91);
  expect(seededInt(-18, 18, 'torvalds|natal')).toBe(13);
  expect(seededInt(1, 6, '한글', 'x')).toBe(3);
});
