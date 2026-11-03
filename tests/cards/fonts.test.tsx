import { afterEach, expect, test, vi } from 'vitest';
import { ImageResponse } from 'next/og';
import { CARD_SIZE } from '@/cards/Frame';
import { NatalCard } from '@/cards/NatalCard';
import { okReading } from '../fixtures/user-reading';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.resetModules();
});

test('loads Noto Sans KR 400 and 700 from assets/fonts once, returning the same array every time', async () => {
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  const { loadCardFonts } = await import('@/cards/fonts');
  const fonts = await loadCardFonts();
  expect(fonts.map((f) => [f.name, f.weight, f.style])).toEqual([
    ['Noto Sans KR', 400, 'normal'],
    ['Noto Sans KR', 700, 'normal'],
  ]);
  for (const f of fonts) expect(f.data.byteLength).toBeGreaterThan(100_000);
  // Same array, so the renderer's parsed-font cache (keyed by array identity) hits.
  expect(await loadCardFonts()).toBe(fonts);
  expect(fetchMock).not.toHaveBeenCalled();
});

test('a card renders with the bundled fonts', async () => {
  // Offline: every glyph on the card must come from the bundled fonts, not the renderer's own lookup.
  const fetchMock = vi.fn(async (url: string | URL) => {
    throw new Error(`offline: ${String(url).slice(0, 40)}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  const { loadCardFonts } = await import('@/cards/fonts');
  for (const locale of ['ko', 'en']) {
    const element = <NatalCard r={okReading({ withActivity: true })} locale={locale} avatar={null} />;
    const res = new ImageResponse(element, { ...CARD_SIZE, fonts: await loadCardFonts() });
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect([...bytes.slice(1, 4)]).toEqual([0x50, 0x4e, 0x47]);
  }
  // The renderer loads its own engine through data: URLs; nothing goes over the network.
  const network = fetchMock.mock.calls.map(([url]) => String(url)).filter((url) => /^https?:/.test(url));
  expect(network).toEqual([]);
}, 30000);

test('unreadable font files are logged and give no fonts; the next call tries again', async () => {
  vi.doMock('node:fs/promises', () => ({ readFile: vi.fn().mockRejectedValue(new Error('ENOENT')) }));
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  const { loadCardFonts } = await import('@/cards/fonts');
  expect(await loadCardFonts()).toEqual([]);
  expect(await loadCardFonts()).toEqual([]);
  expect(log).toHaveBeenCalledTimes(2);
  vi.doUnmock('node:fs/promises');
});

test('cardText collects strings through nested components', async () => {
  const { cardText } = await import('@/cards/fonts');
  function Name({ who }: { who: string }) {
    return <b>{`@${who}`}</b>;
  }
  expect(cardText(<div><span>깃사주</span>{null}{false}<Name who="a" />{7}</div>)).toBe('깃사주@a7');
});
