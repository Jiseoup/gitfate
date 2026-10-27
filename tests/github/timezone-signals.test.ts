import { beforeEach, expect, test, vi } from 'vitest';

const cacheCalls = vi.hoisted(() => ({
  created: [] as { keyParts: string[]; options: { revalidate?: number } }[],
  invoked: [] as unknown[][],
  /** Results the cached function returned (what Next would store); a throw stores nothing. */
  stored: [] as unknown[],
}));

vi.mock('next/cache', () => ({
  unstable_cache: (
    fn: (...args: unknown[]) => unknown,
    keyParts: string[],
    options: { revalidate?: number },
  ) => {
    cacheCalls.created.push({ keyParts, options });
    return async (...args: unknown[]) => {
      cacheCalls.invoked.push(args);
      const result = await fn(...args);
      cacheCalls.stored.push(result);
      return result;
    };
  },
}));

import { GitHubRateLimitError } from '@/github/client';
import { fetchTimezoneSignals } from '@/github/timezone-signals';
import {
  fetchCalls,
  graphqlReposWithCommits,
  graphqlResponse,
  lastRequestHeaders,
  lastRequestInit,
  mockSequence,
  patchText,
  requestUrls,
  installGithubMocks,
  userProfile,
} from './helpers';

installGithubMocks();

beforeEach(() => {
  cacheCalls.invoked.length = 0;
  cacheCalls.stored.length = 0;
});

const patchUrl = (oid: string) => `https://api.github.com/repos/jiseoup/repo/commits/${oid}`;

test('timezone signals return only numbers and never keep the patch text', async () => {
  mockSequence([
    graphqlReposWithCommits(['a1', 'a2']),
    patchText('+0900', 'secret@example.com'),
    patchText('+0900', 'secret@example.com'),
  ]);
  const s = await fetchTimezoneSignals(userProfile);
  expect(s).toEqual({ early: [540, 540], recent: [], degraded: false });
  expect(JSON.stringify(s)).not.toContain('secret');
  expect(JSON.stringify(cacheCalls.stored)).not.toContain('secret');
  expect(lastRequestHeaders().get('accept')).toBe('application/vnd.github.patch');
  const patchInit = lastRequestInit() as RequestInit & { next?: unknown };
  expect(patchInit.cache).toBe('no-store');
  expect(patchInit.next).toBeUndefined();
  expect(requestUrls().slice(1)).toEqual([patchUrl('a1'), patchUrl('a2')]);
});

test('recent commits are looked up only when the early commits give no offset', async () => {
  // Early commits found: one GraphQL query, no recent lookup.
  mockSequence([graphqlReposWithCommits(['a1']), patchText('+0900', 'a@b.c')]);
  expect(await fetchTimezoneSignals(userProfile)).toEqual({ early: [540], recent: [], degraded: false });
  expect(fetchCalls()).toBe(2);

  // No early commits: the recent query runs.
  mockSequence([graphqlReposWithCommits([]), graphqlReposWithCommits(['r1']), patchText('+0100', 'a@b.c')]);
  expect(await fetchTimezoneSignals(userProfile)).toEqual({ early: [], recent: [60], degraded: false });
  const [earlyCall, recentCall] = vi.mocked(fetch).mock.calls.slice(2);
  const earlyVars = JSON.parse(String(earlyCall[1]?.body)).variables;
  const recentVars = JSON.parse(String(recentCall[1]?.body)).variables;
  expect(earlyVars).toMatchObject({ field: 'CREATED_AT', direction: 'ASC', since: userProfile.createdAt.replace('Z', '.000Z') });
  expect(recentVars).toMatchObject({ field: 'PUSHED_AT', direction: 'DESC', since: null, until: null });
  expect(requestUrls()[4]).toBe(patchUrl('r1'));
});

test('the candidate GraphQL query bypasses the fetch cache (caching happens in unstable_cache)', async () => {
  mockSequence([graphqlReposWithCommits([]), graphqlReposWithCommits([])]);
  await fetchTimezoneSignals(userProfile);
  const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit & { next?: unknown };
  expect(init.cache).toBe('no-store');
  expect(init.next).toBeUndefined();
});

test('organization skips commit signals and contributions', async () => {
  expect(await fetchTimezoneSignals({ ...userProfile, isOrganization: true })).toEqual({
    early: [],
    recent: [],
    degraded: false,
  });
  expect(fetchCalls()).toBe(0);
});

test('keeps at most 5 commits per group', async () => {
  const ids = ['1', '2', '3', '4', '5', '6', '7'];
  mockSequence([graphqlReposWithCommits(ids), ...ids.slice(0, 5).map(() => patchText('+0900', 'a@b.c'))]);
  const s = await fetchTimezoneSignals(userProfile);
  expect(s.early).toHaveLength(5);
  expect(fetchCalls()).toBe(1 + 5);
});

test('404 commits are skipped silently and unparseable dates are dropped', async () => {
  mockSequence([
    graphqlReposWithCommits(['a1', 'a2', 'a3']),
    new Response('Not Found', { status: 404 }),
    new Response('no date here\n\nbody', { status: 200 }),
    patchText('-0500', 'a@b.c'),
  ]);
  expect(await fetchTimezoneSignals(userProfile)).toEqual({ early: [-300], recent: [], degraded: false });
});

test('a commit GitHub cannot serve (diff too large, 5xx, 451, 409) is skipped and the result is still cached', async () => {
  mockSequence([
    graphqlReposWithCommits(['a1', 'a2', 'a3', 'a4', 'a5']),
    new Response('diff too large', { status: 422 }),
    new Response('oops', { status: 502 }),
    new Response('gone', { status: 451 }),
    new Response('empty repo', { status: 409 }),
    patchText('+0900', 'a@b.c'),
  ]);
  expect(await fetchTimezoneSignals(userProfile)).toEqual({ early: [540], recent: [], degraded: false });
  expect(cacheCalls.stored).toEqual([{ early: [540], recent: [] }]);
});

test('rate limit while fetching a patch propagates', async () => {
  mockSequence([
    graphqlReposWithCommits(['a1']),
    new Response('{}', { status: 403, headers: { 'x-ratelimit-remaining': '0' } }),
  ]);
  await expect(fetchTimezoneSignals(userProfile)).rejects.toBeInstanceOf(GitHubRateLimitError);
});

test('a failed early query still uses the recent offsets, but that answer is not cached', async () => {
  mockSequence([
    new Response('oops', { status: 502 }),
    graphqlReposWithCommits(['r1']),
    patchText('+0100', 'a@b.c'),
  ]);
  expect(await fetchTimezoneSignals(userProfile)).toEqual({ early: [], recent: [60], degraded: true });
  expect(cacheCalls.stored).toEqual([]);
});

test('a GraphQL timeout on the recent query keeps an empty, uncached answer', async () => {
  mockSequence([graphqlReposWithCommits([]), graphqlResponse({ data: null, errors: [{ type: 'TIMEOUT' }] })]);
  expect(await fetchTimezoneSignals(userProfile)).toEqual({ early: [], recent: [], degraded: true });
  expect(cacheCalls.stored).toEqual([]);
});

test('when every patch request failed, the empty answer is not cached (likely an outage)', async () => {
  mockSequence([
    graphqlReposWithCommits(['a1', 'a2']),
    new Response('oops', { status: 503 }),
    new Response('oops', { status: 503 }),
    graphqlReposWithCommits([]),
  ]);
  expect(await fetchTimezoneSignals(userProfile)).toEqual({ early: [], recent: [], degraded: true });
  expect(cacheCalls.stored).toEqual([]);
});

test('empty or missing history yields empty signals, cached', async () => {
  mockSequence([
    new Response(
      JSON.stringify({
        data: { repositoryOwner: { repositories: { nodes: [{ name: 'e', owner: { login: 'x' }, defaultBranchRef: null }] } } },
      }),
    ),
    graphqlReposWithCommits([]),
  ]);
  expect(await fetchTimezoneSignals(userProfile)).toEqual({ early: [], recent: [], degraded: false });
  expect(cacheCalls.stored).toEqual([{ early: [], recent: [] }]);
});

test('only the derived offsets are cached, keyed by lowercased login and id for 30 days', async () => {
  mockSequence([graphqlReposWithCommits(['a1']), patchText('+0900', 'secret@example.com')]);
  const s = await fetchTimezoneSignals({ ...userProfile, login: 'JiSeoup' });
  expect(cacheCalls.created).toEqual([{ keyParts: ['timezone-signals'], options: { revalidate: 2592000 } }]);
  expect(cacheCalls.invoked.at(-1)).toEqual(['jiseoup', userProfile.id, userProfile.createdAt]);
  expect(cacheCalls.stored).toEqual([{ early: [540], recent: [] }]);
  expect([...s.early, ...s.recent].every((n) => typeof n === 'number')).toBe(true);
});
