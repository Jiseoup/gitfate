import { beforeEach, expect, test, vi } from 'vitest';
import type { ReactElement } from 'react';
import { GET } from '@/app/api/card/[type]/[locale]/[...parts]/route';
import { cardText, loadCardFonts } from '@/cards/fonts';
import { buildCompatReading } from '@/reading/compat';
import { buildUserReading } from '@/reading/user';
import { okCompat } from '../fixtures/compat-reading';
import { fixtureNow, okReading } from '../fixtures/user-reading';

vi.mock('@/reading/user', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/reading/user')>()),
  buildUserReading: vi.fn(),
}));
vi.mock('@/reading/compat', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/reading/compat')>()),
  buildCompatReading: vi.fn(),
}));
vi.mock('@/cards/fonts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/cards/fonts')>()),
  loadCardFonts: vi.fn(async () => []),
}));
vi.mock('@/cards/avatar', () => ({ loadAvatar: vi.fn(async () => null) }));
// Rendering itself is covered by tests/cards/render.test.tsx; here only the element and options matter.
vi.mock('next/og', () => ({
  ImageResponse: class extends Response {
    element: ReactElement;
    options: { width?: number; height?: number; headers?: Record<string, string> };
    constructor(element: ReactElement, options: { width?: number; height?: number; headers?: Record<string, string> }) {
      super('png', { headers: { 'content-type': 'image/png', ...options.headers } });
      this.element = element;
      this.options = options;
    }
  },
}));

type Rendered = Response & { element: ReactElement; options: { width?: number; height?: number } };

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(fixtureNow);
  vi.mocked(buildUserReading).mockReset().mockResolvedValue(okReading({ withActivity: true }));
  vi.mocked(buildCompatReading).mockReset().mockResolvedValue(okCompat());
  vi.mocked(loadCardFonts).mockClear();
});

async function get(path: string): Promise<Response> {
  const url = new URL(`http://localhost/api/card/${path}`);
  const [type, locale, ...parts] = url.pathname.split('/').slice(3);
  return GET(new Request(url), { params: Promise.resolve({ type, locale, parts }) });
}

test('natal card: 200 PNG, 1200×630, cached until the next local midnight', async () => {
  const res = (await get('natal/ko/jiseoup.png')) as Rendered;
  expect(res.status).toBe(200);
  expect(res.headers.get('content-type')).toBe('image/png');
  // Fixture timezone is UTC+9: 2026-10-27 12:25:41 local, 11:34:19 until midnight.
  expect(res.headers.get('cache-control')).toBe('public, s-maxage=41659, stale-while-revalidate=3600');
  expect(res.options).toMatchObject({ width: 1200, height: 630 });
  expect(vi.mocked(buildUserReading)).toHaveBeenCalledWith('jiseoup', { tzParam: null, now: fixtureNow });

  const text = cardText(res.element);
  expect(text).toContain('Ji Seoup');
  expect(text).toContain('@JiSeoup');
  expect(text).toContain('gitfate');
  expect(text).toContain('Ji Seoup님은 「텃밭」 개발자');
  expect(text).toContain('재미로 보는 운세입니다. 개발 실력과는 아무 관련이 없어요.');
  // Fonts are fetched for exactly the text on the card.
  expect(vi.mocked(loadCardFonts)).toHaveBeenCalledWith(text);
});

test('each single-user card type renders with its own copy and the footer', async () => {
  const r = okReading({ withActivity: true });
  const daily = (await get('daily/en/jiseoup.png?tz=Asia/Seoul')) as Rendered;
  expect(daily.status).toBe(200);
  expect(vi.mocked(buildUserReading)).toHaveBeenLastCalledWith('jiseoup', { tzParam: 'Asia/Seoul', now: fixtureNow });
  const dailyText = cardText(daily.element);
  expect(dailyText).toContain(String(r.daily.score));
  expect(dailyText).toContain('October 27, 2026');
  expect(dailyText).toContain('gitfate');
  expect(dailyText).toContain('Just for fun. It says nothing about your skills as a developer.');

  const yearly = (await get('yearly/ko/jiseoup.png')) as Rendered;
  expect(yearly.status).toBe(200);
  expect(cardText(yearly.element)).toContain('2026년, 태양의 해 (2월 4일 입춘부터)');
  expect(cardText(yearly.element)).toContain('올해의 역할');
});

test('yearly card handles organizations without a contribution calendar', async () => {
  const r = okReading({ withActivity: true });
  expect(cardText(((await get('yearly/en/jiseoup.png')) as Rendered).element)).toContain('Contributions');
  vi.mocked(buildUserReading).mockResolvedValue({
    ...r,
    activity: { ...r.activity!, monthly: r.yearly.months.map(() => null), reality: null },
  });
  const res = (await get('yearly/en/jiseoup.png')) as Rendered;
  expect(res.status).toBe(200);
  expect(cardText(res.element)).not.toContain('Contributions');
  vi.mocked(buildUserReading).mockResolvedValue(okReading({ withActivity: false }));
  expect((await get('yearly/en/jiseoup.png')).status).toBe(200);
});

test('compat card: 200 with both people and the score, cached until the earlier midnight', async () => {
  const res = (await get('compat/en/a/b.png?tzA=Asia/Seoul')) as Rendered;
  expect(res.status).toBe(200);
  expect(res.headers.get('content-type')).toBe('image/png');
  expect(vi.mocked(buildCompatReading)).toHaveBeenCalledWith('a', 'b', { tzA: 'Asia/Seoul', tzB: null, now: fixtureNow });
  // Sides are UTC+9 (11:34:19 left) and UTC (20:34:19 left): the earlier one wins.
  expect(res.headers.get('cache-control')).toBe('public, s-maxage=41659, stale-while-revalidate=3600');
  const text = cardText(res.element);
  expect(text).toContain('@JiSeoup');
  expect(text).toContain('@Torvalds');
  expect(text).toContain(String(okCompat().result.score));
});

test('daily cards expire at midnight with no stale-while-revalidate', async () => {
  const res = await get('daily/ko/jiseoup.png');
  expect(res.headers.get('cache-control')).toBe('public, s-maxage=41659');
  expect((await get('yearly/ko/jiseoup.png')).headers.get('cache-control')).toBe(
    'public, s-maxage=41659, stale-while-revalidate=3600',
  );
});

test('degraded readings are CDN-cached for only 60 s, without stale-while-revalidate', async () => {
  vi.mocked(buildUserReading).mockResolvedValue({ ...okReading({ withActivity: true }), degraded: true });
  for (const type of ['natal', 'daily', 'yearly']) {
    const res = await get(`${type}/ko/jiseoup.png`);
    expect(res.status, type).toBe(200);
    expect(res.headers.get('cache-control'), type).toBe('public, s-maxage=60');
  }
  vi.mocked(buildCompatReading).mockResolvedValue({ ...okCompat(), degraded: true });
  const compat = await get('compat/ko/a/b.png');
  expect(compat.status).toBe(200);
  expect(compat.headers.get('cache-control')).toBe('public, s-maxage=60');
});

test('unknown type, unsupported locale, bad login or wrong shape → 404 without assembling', async () => {
  for (const path of [
    'unknown/ko/jiseoup.png',
    'natal/fr/jiseoup.png',
    'natal/ko/-bad.png',
    'natal/ko/jiseoup.jpg',
    'natal/ko/a/b.png',
    'compat/ko/a.png',
    'compat/ko/a/-b.png',
  ]) {
    const res = await get(path);
    expect(res.status, path).toBe(404);
    expect(res.headers.get('cache-control'), path).toBe('no-store');
  }
  expect(vi.mocked(buildUserReading)).not.toHaveBeenCalled();
  expect(vi.mocked(buildCompatReading)).not.toHaveBeenCalled();
});

test('not-found and blocked → 404; unavailable → 503; none of them cached', async () => {
  for (const status of ['not-found', 'blocked', 'invalid'] as const) {
    vi.mocked(buildUserReading).mockResolvedValue({ status });
    const res = await get('natal/ko/jiseoup.png');
    expect(res.status, status).toBe(404);
    expect(res.headers.get('cache-control')).toBe('no-store');
  }
  vi.mocked(buildUserReading).mockResolvedValue({ status: 'unavailable' });
  const res = await get('daily/ko/jiseoup.png');
  expect(res.status).toBe(503);
  expect(res.headers.get('cache-control')).toBe('no-store');

  vi.mocked(buildCompatReading).mockResolvedValue({ status: 'unavailable', which: 'b' });
  expect((await get('compat/ko/a/b.png')).status).toBe(503);
  vi.mocked(buildCompatReading).mockResolvedValue({ status: 'not-found', which: 'a' });
  expect((await get('compat/ko/a/b.png')).status).toBe(404);
});

test('card copy uses the same variant seeds as the pages', async () => {
  const { createT } = await import('@/i18n/messages');
  const r = okReading({ withActivity: true });
  const natal = cardText(((await get('natal/ko/jiseoup.png')) as Rendered).element);
  expect(natal).toContain(createT('ko', 'jiseoup|natal')(`natal.archetype.${r.chart.dayMaster}.name`));

  const daily = cardText(((await get('daily/ko/jiseoup.png')) as Rendered).element);
  expect(daily).toContain(createT('ko', r.daily.variantSeed)(`daily.tenGod.${r.daily.tenGod}`, { name: 'Ji Seoup' }));

  const yearly = cardText(((await get('yearly/ko/jiseoup.png')) as Rendered).element);
  expect(yearly).toContain(createT('ko', 'jiseoup|2026')(`yearly.theme.${r.yearly.tenGod}`));

  const c = okCompat();
  const compat = cardText(((await get('compat/ko/torvalds/jiseoup.png')) as Rendered).element);
  const tc = createT('ko', 'jiseoup|torvalds');
  const giver = c.result.giver === 'a' ? 'Ji Seoup' : 'Torvalds';
  const receiver = c.result.giver === 'a' ? 'Torvalds' : 'Ji Seoup';
  const vars: Record<string, string> = c.result.flow === 'same' ? { a: 'Ji Seoup', b: 'Torvalds' } : { giver, receiver };
  expect(compat).toContain(tc(`compat.flow.${c.result.flow}`, vars));
});

test('?theme= picks the card theme; an unknown theme falls back to the default', async () => {
  const themeOf = async (path: string) => (((await get(path)) as Rendered).element.props as { theme?: string }).theme;
  expect(await themeOf('natal/ko/jiseoup.png?theme=github-dark')).toBe('github-dark');
  expect(await themeOf('daily/en/jiseoup.png?theme=dark')).toBe('dark');
  expect(await themeOf('compat/ko/a/b.png?theme=github-light')).toBe('github-light');
  expect(await themeOf('natal/ko/jiseoup.png?theme=neon')).toBe('light');
  expect(await themeOf('natal/ko/jiseoup.png')).toBe('light');
});
