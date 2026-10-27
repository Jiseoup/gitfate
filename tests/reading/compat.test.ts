import { beforeEach, expect, test, vi } from 'vitest';
import { GitHubRateLimitError, GitHubUnavailableError } from '@/github/client';
import { fetchActivity, type Activity } from '@/github/activity';
import { isBlocked } from '@/lib/blocklist';
import { fetchProfile, type Profile } from '@/github/profile';
import { fetchTimezoneSignals } from '@/github/timezone-signals';
import { buildCompatReading } from '@/reading/compat';
import { userProfile } from '../github/helpers';

vi.mock('@/github/profile');
vi.mock('@/github/timezone-signals');
vi.mock('@/github/activity');
vi.mock('@/lib/blocklist');

const now = new Date('2026-10-27T03:25:41.123Z');

const otherProfile: Profile = {
  ...userProfile,
  id: 'U_kgDOother',
  login: 'other',
  name: null,
  createdAt: '2019-11-20T21:30:00Z',
  location: null,
};

const activity: Activity = {
  languages: [
    { name: 'TypeScript', color: '#3178c6', bytes: 7000 },
    { name: 'Rust', color: '#dea584', bytes: 3000 },
    { name: 'Go', color: '#00ADD8', bytes: 2000 },
    { name: 'Python', color: '#3572A5', bytes: 1000 },
    { name: 'HTML', color: '#e34c26', bytes: 99999 },
  ],
  calendar: [],
  thisYearTotal: 1,
  lastYearTotal: 1,
};

beforeEach(() => {
  vi.mocked(fetchProfile)
    .mockReset()
    .mockImplementation(async (l) => (l.toLowerCase() === 'other' ? { ...otherProfile } : { ...userProfile }));
  vi.mocked(fetchTimezoneSignals).mockReset().mockResolvedValue({ early: [540], recent: [], degraded: false });
  vi.mocked(fetchActivity).mockReset().mockResolvedValue(activity);
  vi.mocked(isBlocked).mockReset().mockReturnValue(false);
});

test('self compatibility works', async () => {
  const r = await buildCompatReading('jiseoup', 'Jiseoup', { now });
  expect(r.status).toBe('ok');
  if (r.status === 'ok') expect(r.result.flow).toBe('same');
});

test('reports which side is missing', async () => {
  vi.mocked(fetchProfile).mockImplementation(async (l) => (l.toLowerCase() === 'ghosty' ? null : { ...userProfile }));
  expect(await buildCompatReading('jiseoup', 'ghosty', { now })).toEqual({ status: 'not-found', which: 'b' });
  expect(await buildCompatReading('ghosty', 'jiseoup', { now })).toEqual({ status: 'not-found', which: 'a' });
});

test('reports invalid, blocked and unavailable sides', async () => {
  expect(await buildCompatReading('-bad--', 'other', { now })).toEqual({ status: 'invalid', which: 'a' });
  expect(await buildCompatReading('other', 'bad name', { now })).toEqual({ status: 'invalid', which: 'b' });
  vi.mocked(isBlocked).mockImplementation((l) => l === 'hidden-one');
  expect(await buildCompatReading('other', 'hidden-one', { now })).toEqual({ status: 'blocked', which: 'b' });
  vi.mocked(fetchProfile).mockRejectedValue(new GitHubRateLimitError());
  expect(await buildCompatReading('jiseoup', 'other', { now })).toEqual({ status: 'unavailable', which: 'a' });
});

test('per-person tz params', async () => {
  const r = await buildCompatReading('jiseoup', 'other', { now, tzA: 'Europe/Berlin' });
  expect(r.status === 'ok' && r.a.tz.source).toBe('param');
  expect(r.status === 'ok' && r.b.tz.source).not.toBe('param');
});

test('language fetch failure leaves shared empty but keeps the score', async () => {
  vi.mocked(fetchActivity).mockRejectedValue(new GitHubUnavailableError('status 502'));
  const r = await buildCompatReading('jiseoup', 'other', { now });
  expect(r.status === 'ok' && r.shared).toEqual([]);
  expect(r.status === 'ok' && r.a.topLanguages).toEqual([]);
  expect(r.status === 'ok' && r.result.score).toBeGreaterThan(0);
});

test('top languages are the top 3 of the language profile, shared in a-order', async () => {
  vi.mocked(fetchActivity).mockImplementation(async (p) =>
    p.login === 'other'
      ? { ...activity, languages: [{ name: 'go', color: null, bytes: 10 }, { name: 'Ruby', color: null, bytes: 9 }] }
      : activity,
  );
  const r = await buildCompatReading('jiseoup', 'other', { now });
  if (r.status !== 'ok') throw new Error('expected ok');
  expect(r.a.topLanguages).toEqual(['TypeScript', 'Rust', 'Go']);
  expect(r.b.topLanguages).toEqual(['go', 'Ruby']);
  expect(r.shared).toEqual(['Go']);
});

test('score is symmetric and giver follows URL order', async () => {
  const ab = await buildCompatReading('jiseoup', 'other', { now });
  const ba = await buildCompatReading('other', 'jiseoup', { now });
  if (ab.status !== 'ok' || ba.status !== 'ok') throw new Error('expected ok');
  expect(ba.result.score).toBe(ab.result.score);
  expect(ab.a.profile.login).toBe('jiseoup');
  expect(ba.a.profile.login).toBe('other');
  if (ab.result.giver) expect(ba.result.giver).toBe(ab.result.giver === 'a' ? 'b' : 'a');
});

test('activity is fetched with the same ranges as the user page (hour-rounded)', async () => {
  await buildCompatReading('jiseoup', 'other', { now });
  const ranges = vi.mocked(fetchActivity).mock.calls[0][1];
  expect(ranges.thisTo).toEqual(new Date('2026-10-27T03:00:00.000Z'));
});

test('degraded when either side could not read its signals or languages', async () => {
  const ok = await buildCompatReading('jiseoup', 'other', { now });
  expect(ok.status === 'ok' && ok.degraded).toBe(false);
  vi.mocked(fetchTimezoneSignals).mockImplementation(async (p) => ({
    early: [540],
    recent: [],
    degraded: p.login === 'other',
  }));
  const r = await buildCompatReading('jiseoup', 'other', { now });
  expect(r.status === 'ok' && r.degraded).toBe(true);
  vi.mocked(fetchTimezoneSignals).mockResolvedValue({ early: [540], recent: [], degraded: false });
  vi.mocked(fetchActivity).mockImplementation(async (p) => {
    if (p.login === 'jiseoup') throw new GitHubUnavailableError('timeout');
    return activity;
  });
  const r2 = await buildCompatReading('jiseoup', 'other', { now });
  expect(r2.status === 'ok' && r2.degraded).toBe(true);
});

test('each side fetches languages in parallel with its timezone signals', async () => {
  vi.mocked(fetchTimezoneSignals).mockReturnValue(new Promise(() => {}));
  void buildCompatReading('jiseoup', 'other', { now });
  await vi.waitFor(() => expect(fetchActivity).toHaveBeenCalledTimes(2));
});
