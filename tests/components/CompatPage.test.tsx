import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import CompatPage, { generateMetadata } from '@/app/[locale]/[user]/vs/[other]/page';
import { buildCompatReading } from '@/reading/compat';
import { okCompat } from '../fixtures/compat-reading';

vi.mock('@/reading/compat', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/reading/compat')>()),
  buildCompatReading: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));

beforeEach(() => {
  vi.mocked(buildCompatReading).mockReset().mockResolvedValue(okCompat());
});
afterEach(cleanup);

type Props = Parameters<typeof CompatPage>[0];

function props(locale: string, user: string, other: string, search: Record<string, string> = {}): Props {
  return { params: Promise.resolve({ locale, user, other }), searchParams: Promise.resolve(search) } as Props;
}

async function renderPage(locale: string, user = 'jiseoup', other = 'torvalds') {
  render(await CompatPage(props(locale, user, other)));
}

const text = () => document.body.textContent ?? '';

test('ko page shows both people, score, details, flow, shared languages and disclaimer', async () => {
  await renderPage('ko');
  const { result } = okCompat();
  expect(text()).toContain('Ji Seoup');
  expect(text()).toContain('@JiSeoup');
  expect(text()).toContain('@Torvalds');
  expect(text()).toContain(String(result.score));
  expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('개발 궁합');
  for (const label of ['페어 프로그래밍', '코드 리뷰', '장애 대응 함께하기']) expect(text()).toContain(label);
  // display names, URL order: the profile name, else the login
  expect(text()).toMatch(/Ji Seoup님/);
  expect(text()).toMatch(/Torvalds님/);
  expect(text()).toContain('공통 언어: Rust.');
  expect(text()).toContain('TypeScript · Rust · Go');
  // each person's join date, then their Dev Sign: icon, name and one-liner
  expect(text()).toContain('@JiSeoup2015년 3월 4일 가입텃밭무엇이든 길러내는 메인테이너');
  expect(text()).toContain('@Torvalds2011년 9월 3일 가입보석아무도 못 본 오타를 찾아내는 세공사');
  expect(screen.getByRole('img', { name: '텃밭 · 기토' })).toBeTruthy();
  expect(text()).not.toMatch(/\p{Script=Han}/u);
  expect(text()).toContain('재미로 보는 운세입니다. 개발 실력과는 아무 관련이 없어요.');
  expect(screen.getByRole('link', { name: '카드 이미지 저장' }).getAttribute('href')).toBe(
    '/api/card/compat/ko/JiSeoup/Torvalds.png',
  );
  expect(screen.getByRole('link', { name: '@Torvalds' }).getAttribute('href')).toBe('/ko/Torvalds');
  expect(text()).not.toMatch(/\b(ui|compat|natal|terms)\.[a-zA-Z]/);
  expect(text()).not.toMatch(/\{\{/);
});

test('en page renders in English, with no shared language line variant', async () => {
  vi.mocked(buildCompatReading).mockResolvedValue(okCompat({ sharedLang: false }));
  await renderPage('en');
  expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Dev compatibility');
  expect(text()).toContain('Pair programming');
  expect(text()).toContain('No languages in common.');
  expect(text()).toContain('Joined March 4, 2015The GardenGrows anything, maintains everything');
  expect(text()).toContain('Joined September 3, 2011The JewelPolishes until it sparkles');
  expect(text()).toContain('Just for fun. It says nothing about your skills as a developer.');
  expect(text()).not.toMatch(/\b(ui|compat|natal|terms)\.[a-zA-Z]/);
  expect(text()).not.toMatch(/\{\{/);
});

test('band copy variant is the same for both URL orders', async () => {
  await renderPage('ko');
  const first = screen.getByText(/점/, { selector: 'p.font-medium' }).textContent;
  cleanup();
  const swapped = okCompat();
  vi.mocked(buildCompatReading).mockResolvedValue({
    ...swapped,
    a: swapped.b,
    b: swapped.a,
    result: { ...swapped.result, giver: swapped.result.giver === 'a' ? 'b' : swapped.result.giver === 'b' ? 'a' : null },
  });
  await renderPage('ko', 'torvalds', 'jiseoup');
  const second = screen.getByText(/점/, { selector: 'p.font-medium' }).textContent;
  // Same variant seed for both URL orders => same sentence once names are normalized
  expect(first!.replace(/Ji Seoup|Torvalds/g, 'X')).toBe(second!.replace(/Ji Seoup|Torvalds/g, 'X'));
});

test('flow names the giver and receiver in the right direction', async () => {
  const r = okCompat();
  vi.mocked(buildCompatReading).mockResolvedValue({ ...r, result: { ...r.result, flow: 'generate', giver: 'b' } });
  await renderPage('ko');
  // every generate variant opens with the giver's name
  expect(text()).toMatch(/Torvalds님(이 밑그림|의 기운이)/);
});

test('page passes raw logins and tz params, and 404s per status', async () => {
  render(await CompatPage(props('ko', 'JISEOUP', 'Torvalds')));
  expect(vi.mocked(buildCompatReading).mock.calls[0].slice(0, 2)).toEqual(['JISEOUP', 'Torvalds']);
  cleanup();
  await CompatPage(props('ko', 'a', 'b', { tzA: 'Europe/Berlin', tzB: 'Mars/Base' }));
  expect(vi.mocked(buildCompatReading).mock.calls[1][2]).toMatchObject({ tzA: 'Europe/Berlin', tzB: 'Mars/Base' });
  for (const status of ['invalid', 'not-found', 'blocked'] as const) {
    vi.mocked(buildCompatReading).mockResolvedValueOnce({ status, which: 'b' });
    await expect(CompatPage(props('ko', 'jiseoup', 'ghosty'))).rejects.toThrow('NEXT_NOT_FOUND');
  }
  await expect(CompatPage(props('fr', 'a', 'b'))).rejects.toThrow('NEXT_NOT_FOUND');
});

test('unavailable shows the rate-limit screen', async () => {
  vi.mocked(buildCompatReading).mockResolvedValue({ status: 'unavailable', which: 'a' });
  await renderPage('en');
  expect(text()).toContain('GitHub asked us to take a breather');
});

test('canonical uses canonical logins and only the tz params actually used', async () => {
  const meta = await generateMetadata(props('ko', 'jiseoup', 'torvalds', { tzA: 'Mars/Base' }));
  expect(meta.alternates?.canonical).toBe('/ko/JiSeoup/vs/Torvalds');
  expect(String(meta.title)).toBe('JiSeoup × Torvalds');
  const r = okCompat();
  vi.mocked(buildCompatReading).mockResolvedValue({
    ...r,
    a: { ...r.a, tz: { tz: { kind: 'iana', name: 'Asia/Seoul' }, source: 'param', suggestion: null } },
  });
  const withTz = await generateMetadata(props('en', 'jiseoup', 'torvalds', { tzA: 'Asia/Seoul' }));
  expect(withTz.alternates?.canonical).toBe('/en/JiSeoup/vs/Torvalds?tzA=Asia%2FSeoul');
  render(await CompatPage(props('en', 'jiseoup', 'torvalds', { tzA: 'Asia/Seoul' })));
  expect(screen.getByRole('link', { name: 'Save card image' }).getAttribute('href')).toBe(
    '/api/card/compat/en/JiSeoup/Torvalds.png?tzA=Asia%2FSeoul',
  );
});

test('metadata uses the compat card as the Open Graph image, with tzA/tzB the reading used', async () => {
  const meta = await generateMetadata(props('ko', 'jiseoup', 'torvalds'));
  const og = meta.openGraph as { images: { url: string; width: number; height: number }[] };
  expect(meta.description).toMatch(/^텃밭 × 보석 · /);
  expect(og.images[0]).toMatchObject({ url: '/api/card/compat/ko/JiSeoup/Torvalds.png', width: 1200, height: 630 });
  expect(meta.twitter).toMatchObject({ card: 'summary_large_image' });
  const r = okCompat();
  vi.mocked(buildCompatReading).mockResolvedValue({
    ...r,
    b: { ...r.b, tz: { tz: { kind: 'iana', name: 'Europe/Berlin' }, source: 'param', suggestion: null } },
  });
  const withTz = await generateMetadata(props('en', 'jiseoup', 'torvalds', { tzB: 'Europe/Berlin' }));
  expect((withTz.openGraph as { images: { url: string }[] }).images[0].url).toBe(
    '/api/card/compat/en/JiSeoup/Torvalds.png?tzB=Europe%2FBerlin',
  );
});

test('avatars are sized GitHub URLs served directly, not through image optimization', async () => {
  await renderPage('ko');
  const srcs = [...document.querySelectorAll('img')].map((img) => img.getAttribute('src'));
  expect(srcs).toEqual([
    'https://avatars.githubusercontent.com/u/1?v=4&s=144',
    'https://avatars.githubusercontent.com/u/2?v=4&s=144',
  ]);
  expect([...document.querySelectorAll('img')].every((img) => img.getAttribute('srcset') === null)).toBe(true);
});

test('an unsupported locale 404s before any GitHub lookup', async () => {
  await expect(CompatPage(props('fr', 'a', 'b'))).rejects.toThrow('NEXT_NOT_FOUND');
  expect(await generateMetadata(props('fr', 'a', 'b'))).toEqual({});
  expect(vi.mocked(buildCompatReading)).not.toHaveBeenCalled();
});
