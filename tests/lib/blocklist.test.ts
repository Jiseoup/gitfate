import { afterEach, expect, test, vi } from 'vitest';

afterEach(() => {
  vi.doUnmock('../../data/blocklist.json');
  vi.resetModules();
});

test('empty blocklist blocks nobody', async () => {
  const { isBlocked } = await import('@/lib/blocklist');
  expect(isBlocked('anyone')).toBe(false);
});

test('comparison is case-insensitive on both sides', async () => {
  vi.resetModules();
  vi.doMock('../../data/blocklist.json', () => ({ default: ['BadUser', 'other'] }));
  const { isBlocked } = await import('@/lib/blocklist');
  expect(isBlocked('baduser')).toBe(true);
  expect(isBlocked('BADUSER')).toBe(true);
  expect(isBlocked('Other')).toBe(true);
  expect(isBlocked('fine')).toBe(false);
});
