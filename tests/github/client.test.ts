import { expect, test, vi } from 'vitest';
import {
  GitHubRateLimitError,
  GitHubUnavailableError,
  githubGraphql,
  githubRestHeader,
} from '@/github/client';
import { graphqlResponse, lastRequestInit, lastRequestUrl, mockFetch, installGithubMocks } from './helpers';

installGithubMocks();

test('missing GITHUB_TOKEN is a GitHubUnavailableError with a clear message, logged once', async () => {
  delete process.env.GITHUB_TOKEN;
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  const err = await githubGraphql('query { x }', {}, 60).catch((e: unknown) => e);
  expect(err).toBeInstanceOf(GitHubUnavailableError);
  expect((err as Error).message).toContain('GITHUB_TOKEN');
  await expect(githubRestHeader('/repos/a/b/commits/c', 'x')).rejects.toBeInstanceOf(GitHubUnavailableError);
  expect(log).toHaveBeenCalledTimes(1);
  expect(String(log.mock.calls[0][0])).toContain('GITHUB_TOKEN');
  log.mockRestore();
});

test('graphql posts query and variables with token and revalidate', async () => {
  mockFetch(graphqlResponse({ data: { ok: true } }));
  expect(await githubGraphql('query { x }', { a: 1 }, 123)).toEqual({ ok: true });
  const init = lastRequestInit();
  expect(lastRequestUrl()).toBe('https://api.github.com/graphql');
  expect(init.method).toBe('POST');
  expect(JSON.parse(init.body as string)).toEqual({ query: 'query { x }', variables: { a: 1 } });
  expect(init.headers.authorization).toBe('Bearer test-token');
  expect(init.next.revalidate).toBe(123);
  mockFetch(graphqlResponse({ data: { ok: true } }));
  await githubGraphql('query { x }', {});
  expect(lastRequestInit().cache).toBe('no-store');
  expect((lastRequestInit() as { next?: unknown }).next).toBeUndefined();
});

test('every request carries an 8 s timeout; an abort becomes GitHubUnavailableError', async () => {
  const timeout = vi.spyOn(AbortSignal, 'timeout');
  mockFetch(graphqlResponse({ data: { ok: true } }));
  await githubGraphql('q', {}, 1);
  expect(timeout).toHaveBeenCalledWith(8000);
  expect(lastRequestInit().signal).toBeInstanceOf(AbortSignal);
  mockFetch(() => {
    throw new DOMException('The operation was aborted due to timeout', 'TimeoutError');
  });
  await expect(githubGraphql('q', {}, 1)).rejects.toBeInstanceOf(GitHubUnavailableError);
  await expect(githubRestHeader('/repos/a/b/commits/c', 'x')).rejects.toBeInstanceOf(GitHubUnavailableError);
  timeout.mockRestore();
});

test('primary and secondary rate limits become GitHubRateLimitError', async () => {
  mockFetch(new Response('{}', { status: 403, headers: { 'x-ratelimit-remaining': '0' } }));
  await expect(githubGraphql('q', {}, 1)).rejects.toBeInstanceOf(GitHubRateLimitError);
  mockFetch(new Response('{}', { status: 429 }));
  await expect(githubGraphql('q', {}, 1)).rejects.toBeInstanceOf(GitHubRateLimitError);
  mockFetch(new Response('{}', { status: 403, headers: { 'retry-after': '30' } }));
  await expect(githubRestHeader('/repos/a/b/commits/c', 'x')).rejects.toBeInstanceOf(GitHubRateLimitError);
});

test('graphql RATE_LIMITED error type becomes GitHubRateLimitError', async () => {
  mockFetch(graphqlResponse({ data: null, errors: [{ type: 'RATE_LIMITED', message: 'slow down' }] }));
  await expect(githubGraphql('q', {}, 1)).rejects.toBeInstanceOf(GitHubRateLimitError);
});

test('5xx, other failures, bad json and network errors become GitHubUnavailableError without leaking bodies', async () => {
  mockFetch(new Response('SECRET-BODY', { status: 502 }));
  const err = await githubGraphql('q', {}, 1).catch((e: unknown) => e);
  expect(err).toBeInstanceOf(GitHubUnavailableError);
  expect(String((err as Error).message)).not.toContain('SECRET-BODY');
  mockFetch(new Response('SECRET-BODY', { status: 401 }));
  await expect(githubGraphql('q', {}, 1)).rejects.toBeInstanceOf(GitHubUnavailableError);
  mockFetch(new Response('not json', { status: 200 }));
  await expect(githubGraphql('q', {}, 1)).rejects.toBeInstanceOf(GitHubUnavailableError);
  mockFetch(() => {
    throw new TypeError('fetch failed');
  });
  await expect(githubGraphql('q', {}, 1)).rejects.toBeInstanceOf(GitHubUnavailableError);
  mockFetch(graphqlResponse({ data: null, errors: [{ type: 'INTERNAL', message: 'SECRET-BODY' }] }));
  const gqlErr = await githubGraphql('q', {}, 1).catch((e: unknown) => e);
  expect(gqlErr).toBeInstanceOf(GitHubUnavailableError);
  expect(String((gqlErr as Error).message)).not.toContain('SECRET-BODY');
});

test('rest header read sends accept, is no-store, returns only the header block, and maps 404 to null', async () => {
  mockFetch(new Response('From x\nDate: Mon, 5 Jan 2015 10:00:00 +0900\n\nSECRET-BODY', { status: 200 }));
  expect(await githubRestHeader('/repos/a/b/commits/c', 'application/vnd.github.patch')).toBe(
    'From x\nDate: Mon, 5 Jan 2015 10:00:00 +0900',
  );
  expect(lastRequestUrl()).toBe('https://api.github.com/repos/a/b/commits/c');
  expect(lastRequestInit().headers.accept).toBe('application/vnd.github.patch');
  expect(lastRequestInit().cache).toBe('no-store');
  expect((lastRequestInit() as { next?: unknown }).next).toBeUndefined();
  mockFetch(new Response('Not Found', { status: 404 }));
  expect(await githubRestHeader('/repos/a/b/commits/c', 'x')).toBeNull();
  mockFetch(new Response('SECRET-BODY', { status: 422 }));
  const err = await githubRestHeader('/repos/a/b/commits/c', 'x').catch((e: unknown) => e);
  expect(err).toBeInstanceOf(GitHubUnavailableError);
  expect(String((err as Error).message)).not.toContain('SECRET-BODY');
});

test('rest header read stops at the blank line (or a byte cap) and cancels the rest of the stream', async () => {
  const encoder = new TextEncoder();
  let pulled = 0;
  let cancelled = false;
  const endless = (chunks: string[]) =>
    new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(encoder.encode(chunks[pulled] ?? 'x'.repeat(1024)));
        pulled++;
      },
      cancel() {
        cancelled = true;
      },
    });
  mockFetch(() => new Response(endless(['From x\r\nDate: Mon, 5 Jan 2015 10:00:00 -0500\r\n', '\r\nbody', 'more']), { status: 200 }));
  expect(await githubRestHeader('/repos/a/b/commits/c', 'x')).toBe('From x\r\nDate: Mon, 5 Jan 2015 10:00:00 -0500');
  expect(pulled).toBeLessThanOrEqual(3);
  expect(cancelled).toBe(true);

  pulled = 0;
  cancelled = false;
  mockFetch(() => new Response(endless([]), { status: 200 }));
  const capped = await githubRestHeader('/repos/a/b/commits/c', 'x');
  expect(capped!.length).toBeLessThanOrEqual(8192);
  expect(pulled).toBeLessThanOrEqual(9);
  expect(cancelled).toBe(true);
});
