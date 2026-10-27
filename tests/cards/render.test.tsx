import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { ImageResponse } from 'next/og';
import type { ReactElement } from 'react';
import { CompatCard } from '@/cards/CompatCard';
import { DailyCard } from '@/cards/DailyCard';
import { CARD_SIZE } from '@/cards/Frame';
import { NatalCard } from '@/cards/NatalCard';
import { YearlyCard } from '@/cards/YearlyCard';
import { okCompat } from '../fixtures/compat-reading';
import { okReading } from '../fixtures/user-reading';

// Real Satori + resvg render, offline: the renderer's own CJK font lookup is refused, so this checks
// layout validity (Satori rejects unsupported markup) rather than glyphs. Glyphs are checked by hand.
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => {
    throw new Error('offline');
  }));
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function render(element: ReactElement): Promise<Uint8Array> {
  const res = new ImageResponse(element, CARD_SIZE);
  return new Uint8Array(await res.arrayBuffer());
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function expectPng(bytes: Uint8Array) {
  expect([...bytes.slice(0, 8)]).toEqual(PNG_SIGNATURE);
  const view = new DataView(bytes.buffer, bytes.byteOffset);
  expect([view.getUint32(16), view.getUint32(20)]).toEqual([1200, 630]);
}

test('every card renders to a 1200×630 PNG, with and without avatars and activity', async () => {
  const r = okReading({ withActivity: true });
  const org = { ...r, activity: { ...r.activity!, monthly: r.yearly.months.map(() => null), reality: null } };
  const tiny = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  for (const locale of ['ko', 'en']) {
    expectPng(await render(<NatalCard r={r} locale={locale} avatar={tiny} />));
    expectPng(await render(<DailyCard r={r} locale={locale} avatar={null} />));
    expectPng(await render(<YearlyCard r={r} locale={locale} avatar={null} />));
    expectPng(await render(<YearlyCard r={org} locale={locale} avatar={null} />));
    expectPng(await render(<CompatCard r={okCompat()} locale={locale} avatars={[tiny, null]} />));
  }
}, 60000);

test('cards use the Dev Sign vocabulary: sign names, roles and zodiac names, with no hanja', async () => {
  const { cardText } = await import('@/cards/fonts');
  const r = okReading({ withActivity: true });
  const natal = cardText(<NatalCard r={r} locale="en" avatar={null} />);
  expect(natal).toContain('Ji Seoup is The Garden');
  expect(natal).toContain('The JewelWhite Goat');
  expect(natal).toContain('@JiSeoupJoined March 4, 2015 · GitHub age 11');
  const daily = cardText(<DailyCard r={r} locale="en" avatar={null} />);
  expect(daily).toContain("Today's role");
  expect(daily).toContain('The ancient almanac says');
  expect(daily).not.toMatch(/\(正官\)|Direct Officer/);
  const yearly = cardText(<YearlyCard r={r} locale="en" avatar={null} />);
  expect(yearly).toContain('Year of The Sun');
  expect(yearly).toContain('Red Horse');
  const compat = cardText(<CompatCard r={okCompat()} locale="ko" avatars={[null, null]} />);
  expect(compat).toContain('2015년 3월 4일 가입텃밭');
  expect(compat).toContain('2011년 9월 3일 가입보석');
  for (const text of [natal, daily, yearly, compat]) expect(text).not.toMatch(/\p{Script=Han}/u);
});
