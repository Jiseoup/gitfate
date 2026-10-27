import { beforeEach, expect, test, vi } from 'vitest';
import { GitHubRateLimitError, GitHubUnavailableError } from '@/github/client';
import { fetchActivity, type Activity } from '@/github/activity';
import { isBlocked } from '@/lib/blocklist';
import { fetchProfile, type Profile } from '@/github/profile';
import { fetchTimezoneSignals } from '@/github/timezone-signals';
import { buildUserReading, isValidLogin } from '@/reading/user';
import { userProfile } from '../github/helpers';

vi.mock('@/github/profile');
vi.mock('@/github/timezone-signals');
vi.mock('@/github/activity');
vi.mock('@/lib/blocklist');

const now = new Date('2026-10-27T03:25:41.123Z');

const orgProfile: Profile = {
  ...userProfile,
  id: 'O_kgDOorg',
  login: 'some-org',
  name: 'Some Org',
  isOrganization: true,
  location: null,
};

const activity: Activity = {
  languages: [
    { name: 'TypeScript', color: '#3178c6', bytes: 7000 },
    { name: 'Rust', color: '#dea584', bytes: 3000 },
  ],
  calendar: [
    { date: '2026-02-10', count: 3 },
    { date: '2026-03-10', count: 5 },
    { date: '2026-10-26', count: 2 },
  ],
  thisYearTotal: 140,
  lastYearTotal: 100,
};

beforeEach(() => {
  vi.mocked(fetchProfile).mockReset().mockResolvedValue({ ...userProfile });
  vi.mocked(fetchTimezoneSignals).mockReset().mockResolvedValue({ early: [540], recent: [], degraded: false });
  vi.mocked(fetchActivity).mockReset().mockResolvedValue(activity);
  vi.mocked(isBlocked).mockReset().mockReturnValue(false);
});

test('isValidLogin follows the GitHub login rule, case-insensitively', () => {
  for (const ok of ['jiseoup', 'JiSeoup', 'a', 'some-org', 'a1-b2-c3', 'x'.repeat(39)]) {
    expect(isValidLogin(ok)).toBe(true);
  }
  for (const bad of ['', '-bad', 'bad-', 'bad--name', 'under_score', 'x'.repeat(40), 'dot.name', '한글']) {
    expect(isValidLogin(bad)).toBe(false);
  }
});

test('invalid login short-circuits without API calls', async () => {
  expect(await buildUserReading('-bad--name', { now })).toEqual({ status: 'invalid' });
  expect(fetchProfile).not.toHaveBeenCalled();
});

test('case-insensitive: same reading for JISEOUP and jiseoup', async () => {
  const a = await buildUserReading('JISEOUP', { now }),
    b = await buildUserReading('jiseoup', { now });
  expect(a).toEqual(b);
  // Both spellings hit the same (cache-keyed) profile request.
  expect(vi.mocked(fetchProfile).mock.calls).toEqual([['jiseoup'], ['jiseoup']]);
});

test('garbage tz param equals no param', async () => {
  expect(await buildUserReading('jiseoup', { now, tzParam: 'Mars/Base' })).toEqual(
    await buildUserReading('jiseoup', { now }),
  );
});

test('a valid tz param wins over commit signals', async () => {
  const r = await buildUserReading('jiseoup', { now, tzParam: 'Europe/Berlin' });
  expect(r.status === 'ok' && r.tz).toEqual({
    tz: { kind: 'iana', name: 'Europe/Berlin' },
    source: 'param',
    suggestion: null,
  });
});

test('activity failure keeps natal and daily', async () => {
  vi.mocked(fetchActivity).mockRejectedValueOnce(new GitHubRateLimitError());
  const r = await buildUserReading('jiseoup', { now });
  expect(r.status).toBe('ok');
  if (r.status === 'ok') {
    expect(r.activity).toBeNull();
    expect(r.diagnosis).toBeNull();
    expect(r.daily.score).toBeGreaterThan(0);
  }
});

test('GitHub failures in timezone signals and activity degrade silently', async () => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(fetchTimezoneSignals).mockRejectedValueOnce(new GitHubUnavailableError('status 502'));
  vi.mocked(fetchActivity).mockRejectedValueOnce(new GitHubUnavailableError('status 502'));
  const r = await buildUserReading('jiseoup', { now });
  expect(r.status === 'ok' && r.tz.source).toBe('location');
  expect(r.status === 'ok' && r.activity).toBeNull();
  expect(log).not.toHaveBeenCalled();
  log.mockRestore();
});

test('unexpected errors in timezone signals and activity are logged and still degrade', async () => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(fetchTimezoneSignals).mockRejectedValueOnce(new TypeError('bad shape'));
  vi.mocked(fetchActivity).mockRejectedValueOnce(new TypeError('cannot read nodes'));
  const r = await buildUserReading('jiseoup', { now });
  expect(r.status === 'ok' && r.tz.source).toBe('location');
  expect(r.status === 'ok' && r.activity).toBeNull();
  expect(log.mock.calls.map((c) => c[0])).toEqual([
    '[gitfate] timezone signals failed for jiseoup: TypeError: bad shape',
    '[gitfate] activity failed for jiseoup: TypeError: cannot read nodes',
  ]);
  log.mockRestore();
});

test('organization and brand-new accounts render', async () => {
  vi.mocked(fetchProfile).mockResolvedValueOnce({ ...orgProfile });
  vi.mocked(fetchActivity).mockResolvedValueOnce({
    languages: activity.languages,
    calendar: null,
    thisYearTotal: null,
    lastYearTotal: null,
  });
  const org = await buildUserReading('some-org', { now });
  expect(org.status).toBe('ok');
  if (org.status === 'ok') {
    expect(org.activity?.reality).toBeNull();
    expect(org.activity?.monthly.every((m) => m === null)).toBe(true);
    expect(org.diagnosis).not.toBeNull();
  }
  vi.mocked(fetchActivity).mockResolvedValueOnce({ languages: [], calendar: [], thisYearTotal: 0, lastYearTotal: 0 });
  const r = await buildUserReading('newbie', { now });
  expect(r.status === 'ok' && r.activity?.reality?.kind).toBe('none');
  expect(r.status === 'ok' && r.diagnosis?.diagnosis).toBe('noData');
});

test('blocked and missing', async () => {
  vi.mocked(isBlocked).mockReturnValueOnce(true);
  expect(await buildUserReading('hidden-one', { now })).toEqual({ status: 'blocked' });
  expect(fetchProfile).not.toHaveBeenCalled();
  vi.mocked(fetchProfile).mockResolvedValueOnce(null);
  expect(await buildUserReading('ghosty', { now })).toEqual({ status: 'not-found' });
});

test('a missing GITHUB_TOKEN (reported by the client) is unavailable, not a crash', async () => {
  vi.mocked(fetchProfile).mockRejectedValueOnce(new GitHubUnavailableError('GITHUB_TOKEN is not set'));
  expect(await buildUserReading('jiseoup', { now })).toEqual({ status: 'unavailable' });
});

test('degraded is set when timezone signals or activity could not be read fully', async () => {
  const ok = await buildUserReading('jiseoup', { now });
  expect(ok.status === 'ok' && ok.degraded).toBe(false);

  vi.mocked(fetchTimezoneSignals).mockResolvedValueOnce({ early: [], recent: [], degraded: true });
  const partial = await buildUserReading('jiseoup', { now });
  expect(partial.status === 'ok' && partial.degraded).toBe(true);

  vi.mocked(fetchTimezoneSignals).mockRejectedValueOnce(new GitHubRateLimitError());
  const noSignals = await buildUserReading('jiseoup', { now });
  expect(noSignals.status === 'ok' && noSignals.degraded).toBe(true);

  vi.mocked(fetchActivity).mockRejectedValueOnce(new GitHubUnavailableError('status 502'));
  const noActivity = await buildUserReading('jiseoup', { now });
  expect(noActivity.status === 'ok' && noActivity.degraded).toBe(true);
});

test('a ?tz= the reading uses makes missing signals irrelevant', async () => {
  vi.mocked(fetchTimezoneSignals).mockRejectedValueOnce(new GitHubRateLimitError());
  const r = await buildUserReading('jiseoup', { now, tzParam: 'Europe/Berlin' });
  expect(r.status === 'ok' && r.degraded).toBe(false);
});

test('activity is fetched in parallel with the timezone signals', async () => {
  let release: (v: { early: number[]; recent: number[]; degraded: boolean }) => void = () => {};
  vi.mocked(fetchTimezoneSignals).mockReturnValueOnce(new Promise((resolve) => (release = resolve)));
  const pending = buildUserReading('jiseoup', { now });
  await vi.waitFor(() => expect(fetchActivity).toHaveBeenCalled());
  release({ early: [540], recent: [], degraded: false });
  expect((await pending).status).toBe('ok');
});

test('profile fetch failure is unavailable', async () => {
  vi.mocked(fetchProfile).mockRejectedValueOnce(new GitHubRateLimitError());
  expect(await buildUserReading('jiseoup', { now })).toEqual({ status: 'unavailable' });
  vi.mocked(fetchProfile).mockRejectedValueOnce(new GitHubUnavailableError('network error'));
  expect(await buildUserReading('jiseoup', { now })).toEqual({ status: 'unavailable' });
});

test('activity ranges start at the saju year and end at the current UTC hour', async () => {
  const r = await buildUserReading('jiseoup', { now });
  if (r.status !== 'ok') throw new Error('expected ok');
  const [profileArg, ranges] = vi.mocked(fetchActivity).mock.calls[0];
  expect(profileArg.login).toBe('jiseoup');
  expect(ranges.thisFrom).toEqual(r.yearly.year.start);
  expect(ranges.thisTo).toEqual(new Date('2026-10-27T03:00:00.000Z'));
  expect(ranges.lastTo).toEqual(new Date('2025-10-27T03:00:00.000Z'));
  const lastFrom = new Date(r.yearly.year.start);
  lastFrom.setUTCFullYear(lastFrom.getUTCFullYear() - 1);
  expect(ranges.lastFrom).toEqual(lastFrom);
});

test('assembles chart, daily, yearly and activity in the resolved timezone', async () => {
  const r = await buildUserReading('JiSeoup', { now });
  if (r.status !== 'ok') throw new Error('expected ok');
  expect(r.tz.tz).toEqual({ kind: 'offset', minutes: 540 });
  expect(r.tz.source).toBe('early-commits');
  // createdAt 2015-03-04T05:06:07Z in UTC+9
  expect(r.bornAt).toBe('2015-03-04T14:06:07');
  expect(r.daily.date).toBe('2026-10-27');
  expect(r.daily.variantSeed).toBe('jiseoup|2026-10-27');
  expect(r.yearly.year.startYear).toBe(2026);
  expect(r.activity?.reality).toEqual({ kind: 'up', pct: 40 });
  expect(r.activity?.monthly).toHaveLength(12);
  expect(r.activity?.monthly[0]).toBe(3);
  expect(r.activity?.monthly[11]).toBeNull();
  expect(r.activity?.profile.topLanguages[0].name).toBe('TypeScript');
  expect(r.diagnosis).not.toBeNull();
});
