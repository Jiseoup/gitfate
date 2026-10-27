import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserPage, { generateMetadata } from '@/app/[locale]/[user]/page';
import { buildUserReading } from '@/reading/user';
import { okReading } from '../fixtures/user-reading';

vi.mock('@/reading/user', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/reading/user')>()),
  buildUserReading: vi.fn(),
}));
const push = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));

beforeEach(() => {
  vi.mocked(buildUserReading).mockReset().mockResolvedValue(okReading({ withActivity: true }));
  push.mockReset();
});
afterEach(cleanup);

type Props = Parameters<typeof UserPage>[0];

function props(locale: string, user: string, search: Record<string, string> = {}): Props {
  return { params: Promise.resolve({ locale, user }), searchParams: Promise.resolve(search) } as Props;
}

async function renderPage(locale: string, user = 'jiseoup', search: Record<string, string> = {}) {
  render(await UserPage(props(locale, user, search)));
}

const text = () => document.body.textContent ?? '';

test('ko page renders every section in order, with the disclaimer', async () => {
  await renderPage('ko');
  const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
  expect(headings).toEqual(['타고난 사주', '오늘의 운세', '올해 운세', '개발 궁합']);
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Ji Seoup');
  expect(text()).toContain('개발자 탄생: 2015년 3월 4일 14:06 (UTC+9) · 깃허브 나이 11살');
  expect(text()).toContain('가입 무렵 첫 커밋들의 시간대(UTC+9)로 풀이했어요');
  expect(text()).toContain('프로필 위치는 Berlin.');
  expect(text()).toMatch(/2월 \(2\/4~3\/\d\)흰 호랑이/);
  expect(text()).toContain('2026년, 태양의 해 (2월 4일 입춘부터)붉은 말');
  expect(text()).not.toMatch(/\p{Script=Han}/u);
  expect(text()).toContain('Ji Seoup님은 「텃밭」 개발자');
  expect(text()).toContain('고대 달력 가라사대');
  expect(text()).toContain('2026년 10월 27일');
  expect(text()).toMatch(/행운의 색(빨강|초록|노랑|흰색|검정) · /);
  expect(text()).toContain('실제 기여');
  expect(text()).toContain('작년 이맘때보다 40% 늘었어요');
  expect(text()).toContain('재미로 보는 운세입니다. 개발 실력과는 아무 관련이 없어요.');
  expect(text()).not.toContain('활동 기록을 불러오지 못해서');
  const card = screen.getByRole('link', { name: '카드 이미지 저장' });
  expect(card.getAttribute('href')).toBe('/api/card/natal/ko/JiSeoup.png');
  expect(text()).not.toMatch(/\b(ui|natal|daily|yearly|terms)\.[a-zA-Z]/);
});

test('en page renders in English', async () => {
  await renderPage('en');
  const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
  expect(headings).toEqual(['Birth chart', "Today's fortune", 'This year', 'Dev compatibility']);
  expect(text()).toContain('Developer born: March 4, 2015 at 14:06 (UTC+9)');
  expect(text()).toContain('2026: Year of The Sun (from Feb 4)Red Horse');
  expect(text()).toContain('(UTC+9) · GitHub age 11');
  expect(text()).toContain('Ji Seoup is The Garden');
  expect(text()).toContain("This year's role");
  expect(text()).toContain('October 27, 2026');
  expect(text()).toContain('Just for fun. It says nothing about your skills as a developer.');
  expect(text()).not.toMatch(/\b(ui|natal|daily|yearly|terms)\.[a-zA-Z]/);
});

test('activity null hides contribution overlay and reality line, keeps natal and daily', async () => {
  vi.mocked(buildUserReading).mockResolvedValue(okReading({ withActivity: false }));
  await renderPage('ko');
  expect(text()).toContain('활동 기록을 불러오지 못해서 일부 내용은 숨겼어요');
  expect(text()).not.toContain('실제 기여');
  expect(text()).not.toContain('작년 이맘때');
  expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(4);
  expect(screen.getByText('배포운')).toBeTruthy();
});

test('page passes the raw login and tz to the reading and 404s for missing users', async () => {
  await renderPage('ko', 'JISEOUP', { tz: 'Mars/Base' });
  expect(vi.mocked(buildUserReading).mock.calls[0][0]).toBe('JISEOUP');
  expect(vi.mocked(buildUserReading).mock.calls[0][1].tzParam).toBe('Mars/Base');
  for (const status of ['invalid', 'not-found', 'blocked'] as const) {
    vi.mocked(buildUserReading).mockResolvedValueOnce({ status });
    await expect(UserPage(props('ko', 'ghosty'))).rejects.toThrow('NEXT_NOT_FOUND');
  }
  await expect(UserPage(props('fr', 'jiseoup'))).rejects.toThrow('NEXT_NOT_FOUND');
});

test('unavailable shows the rate-limit screen', async () => {
  vi.mocked(buildUserReading).mockResolvedValue({ status: 'unavailable' });
  await renderPage('en');
  expect(text()).toContain('GitHub asked us to take a breather');
});

test('canonical uses the canonical login and keeps only a used ?tz', async () => {
  const meta = await generateMetadata(props('ko', 'jiseoup', { tz: 'Mars/Base' }));
  expect(meta.alternates?.canonical).toBe('/ko/JiSeoup');
  vi.mocked(buildUserReading).mockResolvedValue({
    ...okReading({ withActivity: true }),
    tz: { tz: { kind: 'iana', name: 'Asia/Seoul' }, source: 'param', suggestion: null },
  });
  const withTz = await generateMetadata(props('en', 'jiseoup', { tz: 'Asia/Seoul' }));
  expect(withTz.alternates?.canonical).toBe('/en/JiSeoup?tz=Asia%2FSeoul');
});

test('metadata uses the natal card as the Open Graph image, with the tz the reading used', async () => {
  const meta = await generateMetadata(props('ko', 'jiseoup'));
  const og = meta.openGraph as { images: { url: string; width: number; height: number }[]; title: string };
  expect(og.images[0]).toMatchObject({ url: '/api/card/natal/ko/JiSeoup.png', width: 1200, height: 630 });
  expect(og.title).toContain('JiSeoup');
  expect(meta.twitter).toMatchObject({ card: 'summary_large_image' });
  vi.mocked(buildUserReading).mockResolvedValue({
    ...okReading({ withActivity: true }),
    tz: { tz: { kind: 'iana', name: 'Asia/Seoul' }, source: 'param', suggestion: null },
  });
  const withTz = await generateMetadata(props('en', 'jiseoup', { tz: 'Asia/Seoul' }));
  expect((withTz.openGraph as { images: { url: string }[] }).images[0].url).toBe(
    '/api/card/natal/en/JiSeoup.png?tz=Asia%2FSeoul',
  );
});

test('the avatar is a sized GitHub URL served directly, not through image optimization', async () => {
  await renderPage('ko');
  const img = document.querySelector('header img');
  expect(img?.getAttribute('src')).toBe('https://avatars.githubusercontent.com/u/1?v=4&s=144');
  expect(img?.getAttribute('srcset')).toBeNull();
});

test('the compat input keeps a ?tz= the reading used as ?tzA=', async () => {
  vi.mocked(buildUserReading).mockResolvedValue({
    ...okReading({ withActivity: true }),
    tz: { tz: { kind: 'iana', name: 'Asia/Seoul' }, source: 'param', suggestion: null },
  });
  await renderPage('ko', 'jiseoup', { tz: 'Asia/Seoul' });
  await userEvent.type(screen.getByLabelText('상대 GitHub 아이디'), 'torvalds{enter}');
  expect(push).toHaveBeenCalledWith('/ko/JiSeoup/vs/torvalds?tzA=Asia%2FSeoul');
  cleanup();
  push.mockReset();
  vi.mocked(buildUserReading).mockResolvedValue(okReading({ withActivity: true }));
  await renderPage('ko');
  await userEvent.type(screen.getByLabelText('상대 GitHub 아이디'), 'torvalds{enter}');
  expect(push).toHaveBeenCalledWith('/ko/JiSeoup/vs/torvalds');
});

test('an unsupported locale 404s before any GitHub lookup', async () => {
  await expect(UserPage(props('fr', 'jiseoup'))).rejects.toThrow('NEXT_NOT_FOUND');
  expect(await generateMetadata(props('fr', 'jiseoup'))).toEqual({});
  expect(vi.mocked(buildUserReading)).not.toHaveBeenCalled();
});

test('share text and Open Graph description lead with the Sign name and its one-liner', async () => {
  const meta = await generateMetadata(props('ko', 'jiseoup'));
  expect(meta.description).toBe('텃밭 — 무엇이든 길러내는 메인테이너 · 깃허브 가입 시각으로 보는 개발자 사주');
  const en = await generateMetadata(props('en', 'jiseoup'));
  expect(en.description).toBe('The Garden — Grows anything, maintains everything · Your dev destiny, read from your GitHub birthday.');
  await renderPage('en');
  const x = new URL(screen.getByRole('link', { name: 'Share on X' }).getAttribute('href')!);
  expect(x.searchParams.get('text')).toBe('gitfate · JiSeoup · The Garden — Grows anything, maintains everything');
});

test('element ties read naturally: "·" in Korean, a list in English; the role help line is shown', async () => {
  await renderPage('ko');
  expect(text()).toContain('화·수 기운');
  expect(text()).not.toContain(' 및 ');
  expect(text()).toContain('사주에서는 십신이라고 불러요.');
  cleanup();
  await renderPage('en');
  expect(text()).toMatch(/Your chart (runs lightest|is quiet) on Fire and Water\./);
  expect(text()).toContain('Saju calls them the Ten Gods.');
});
