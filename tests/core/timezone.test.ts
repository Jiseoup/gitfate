import { expect, test } from 'vitest';
import { majorityOffset, parsePatchDateOffset, resolveTimezone } from '@/core/timezone';

const patch =
  'From 4d33 Mon Sep 17 00:00:00 2001\nFrom: Someone <someone@example.com>\nDate: Thu, 22 Oct 2026 10:55:45 +0900\nSubject: [PATCH] x\n\n---\nDate: Fri, 1 Jan 2021 00:00:00 -0500\n';

test('reads only the header Date line', () => {
  expect(parsePatchDateOffset(patch)).toBe(540);
  expect(parsePatchDateOffset('Date: Thu, 22 Oct 2026 10:55:45 -0330\n\nbody')).toBe(-210);
  expect(parsePatchDateOffset('no header')).toBeNull();
});

test('ignores a Date line that appears only after the header', () => {
  expect(parsePatchDateOffset('Subject: x\n\nDate: Fri, 1 Jan 2021 00:00:00 -0500\n')).toBeNull();
});

test('rejects nonsense offsets', () => {
  expect(parsePatchDateOffset('Date: Thu, 22 Oct 2026 10:55:45 +9999\n\nbody')).toBeNull();
  expect(parsePatchDateOffset('Date: Thu, 22 Oct 2026 10:55:45 +0960\n\nbody')).toBeNull();
  expect(parsePatchDateOffset('Date: Thu, 22 Oct 2026 10:55:45 +1400\n\nbody')).toBe(840);
});

test('handles CRLF headers', () => {
  expect(parsePatchDateOffset('Date: Thu, 22 Oct 2026 10:55:45 +0530\r\nSubject: x\r\n\r\nbody')).toBe(330);
});

test('majority', () => {
  expect(majorityOffset([540, 0, 540])).toBe(540);
  expect(majorityOffset([0, 540])).toBe(0);
  expect(majorityOffset([])).toBeNull();
});

const at = new Date('2026-10-27T00:00:00Z');

test('precedence', () => {
  const base = { earlyOffsets: [540, 540], recentOffsets: [60], location: 'Berlin', at };
  expect(resolveTimezone({ ...base, tzParam: 'America/New_York' })).toMatchObject({
    source: 'param',
    tz: { kind: 'iana', name: 'America/New_York' },
  });
  expect(resolveTimezone({ ...base, tzParam: 'Mars/Base' })).toMatchObject({
    source: 'early-commits',
    tz: { kind: 'offset', minutes: 540 },
  });
  expect(resolveTimezone({ ...base, earlyOffsets: [] })).toMatchObject({
    source: 'recent-commits',
    tz: { kind: 'offset', minutes: 60 },
  });
  expect(resolveTimezone({ ...base, earlyOffsets: [], recentOffsets: [] })).toMatchObject({
    source: 'location',
    tz: { kind: 'iana', name: 'Europe/Berlin' },
  });
  expect(resolveTimezone({ earlyOffsets: [], recentOffsets: [], location: null, at })).toMatchObject({
    source: 'default',
    tz: { kind: 'offset', minutes: 0 },
    suggestion: null,
  });
});

test('suggests profile location only when it disagrees and was not chosen', () => {
  expect(resolveTimezone({ earlyOffsets: [540], recentOffsets: [], location: 'Berlin, Germany', at }).suggestion).toEqual({
    iana: 'Europe/Berlin',
    location: 'Berlin, Germany',
  });
  expect(resolveTimezone({ earlyOffsets: [540], recentOffsets: [], location: 'Seoul', at }).suggestion).toBeNull();
  expect(resolveTimezone({ earlyOffsets: [], recentOffsets: [], location: 'Berlin', at }).suggestion).toBeNull();
  expect(
    resolveTimezone({ earlyOffsets: [540], recentOffsets: [], location: 'Berlin', tzParam: 'Asia/Seoul', at }).suggestion,
  ).toBeNull();
});

test('an unresolvable location falls back to default without a suggestion', () => {
  expect(resolveTimezone({ earlyOffsets: [], recentOffsets: [], location: 'Earth', at })).toMatchObject({
    source: 'default',
    suggestion: null,
  });
});
