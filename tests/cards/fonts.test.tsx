import { afterEach, expect, test, vi } from 'vitest';
import { cardText, loadCardFonts } from '@/cards/fonts';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const css = (family: string) =>
  `@font-face { font-family: '${family}'; src: url(https://fonts.gstatic.com/l/font?kit=${family.replaceAll(' ', '')}) format('truetype'); }`;

test('requests only the glyphs in the text from Noto Sans KR, cached for 30 days', async () => {
  const fetchMock = vi.fn(async (input: string | URL) => {
    const url = String(input);
    if (url.startsWith('https://fonts.googleapis.com/')) return new Response(css('Noto Sans KR'));
    return new Response(new Uint8Array([1, 2, 3]));
  });
  vi.stubGlobal('fetch', fetchMock);

  const fonts = await loadCardFonts('Merge 머지 머지');
  expect(fonts.map((f) => [f.name, f.weight])).toEqual([
    ['Noto Sans KR', 400],
    ['Noto Sans KR', 700],
  ]);
  expect(fonts[0].data.byteLength).toBe(3);

  const cssUrls = fetchMock.mock.calls.map(([u]) => String(u)).filter((u) => u.includes('googleapis'));
  const textOf = (u: string) => new URL(u).searchParams.get('text');
  expect(cssUrls[0]).toContain('family=Noto+Sans+KR:wght@400');
  // Distinct characters, sorted, plus the ellipsis Satori draws when it clamps text.
  expect(textOf(cssUrls[0])).toBe(Array.from(' Megr머지…').sort().join(''));
  expect(cssUrls[1]).toContain('family=Noto+Sans+KR:wght@700');
  expect(cssUrls).toHaveLength(2);
  for (const [, init] of fetchMock.mock.calls as unknown as [string, RequestInit][]) {
    expect(init.next).toEqual({ revalidate: 2592000 });
  }
});

test('a font that fails to load is left out and logged; the rest still load', async () => {
  vi.stubGlobal('fetch', vi.fn(async (input: string | URL) => {
    const url = String(input);
    if (url.includes('wght@700')) return new Response('nope', { status: 500 });
    if (url.startsWith('https://fonts.googleapis.com/')) return new Response(css('Noto Sans KR'));
    return new Response(new Uint8Array([1]));
  }));
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  const fonts = await loadCardFonts('gitfate');
  expect(fonts.map((f) => [f.name, f.weight])).toEqual([['Noto Sans KR', 400]]);
  expect(log).toHaveBeenCalledTimes(1);

  vi.stubGlobal('fetch', vi.fn(async () => {
    throw new TypeError('fetch failed');
  }));
  expect(await loadCardFonts('gitfate')).toEqual([]);
});

test('cardText collects strings through nested components', () => {
  function Name({ who }: { who: string }) {
    return <b>{`@${who}`}</b>;
  }
  expect(cardText(<div><span>깃사주</span>{null}{false}<Name who="a" />{7}</div>)).toBe('깃사주@a7');
});
