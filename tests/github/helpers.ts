import { afterEach, beforeEach, vi } from 'vitest';
import type { Profile } from '@/github/profile';

type FetchInit = RequestInit & {
  headers: Record<string, string>;
  next: { revalidate: number };
};

export const userNode = {
  id: 'U_kgDOtest',
  login: 'jiseoup',
  name: 'Ji Seoup',
  avatarUrl: 'https://avatars.githubusercontent.com/u/1',
  createdAt: '2015-03-04T05:06:07Z',
  location: 'Seoul, South Korea',
  __typename: 'User',
};

export const userProfile: Profile = {
  id: 'U_kgDOtest',
  login: 'jiseoup',
  name: 'Ji Seoup',
  avatarUrl: 'https://avatars.githubusercontent.com/u/1',
  createdAt: '2015-03-04T05:06:07Z',
  isOrganization: false,
  location: 'Seoul, South Korea',
};

let fetchMock = vi.fn();

/** Installs a fresh fetch stub and a test token; restores both after each test. */
export function installGithubMocks(): void {
  beforeEach(() => {
    fetchMock = vi.fn(async () => {
      throw new Error('unexpected fetch call');
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('GITHUB_TOKEN', 'test-token');
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });
}

export function fetchCalls(): number {
  return fetchMock.mock.calls.length;
}

/** Every call returns a copy of `response`, or whatever `fn` returns. */
export function mockFetch(response: Response | (() => Response | Promise<Response>)): void {
  fetchMock.mockImplementation(async () =>
    typeof response === 'function' ? response() : response.clone(),
  );
}

/** Call n returns the n-th response; calling beyond the list fails the test. */
export function mockSequence(responses: Response[]): void {
  let i = 0;
  fetchMock.mockImplementation(async () => {
    const next = responses[i++];
    if (!next) throw new Error(`unexpected fetch call #${i}`);
    return next;
  });
}

export function graphqlResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  });
}

export function mockGraphql(body: unknown): void {
  mockFetch(graphqlResponse(body));
}

export function graphqlReposWithCommits(oids: string[]): Response {
  return graphqlResponse({
    data: {
      repositoryOwner: {
        repositories: {
          nodes: [
            {
              name: 'repo',
              owner: { login: 'jiseoup' },
              defaultBranchRef: {
                target: { history: { nodes: oids.map((oid) => ({ oid })) } },
              },
            },
          ],
        },
      },
    },
  });
}

export function patchText(offset: string, email: string): Response {
  return new Response(
    [
      'From 0123456789abcdef0123456789abcdef01234567 Mon Sep 17 00:00:00 2001',
      `From: Dev <${email}>`,
      `Date: Mon, 5 Jan 2015 10:00:00 ${offset}`,
      'Subject: [PATCH] add a thing',
      '',
      '---',
      ' file.txt | 1 +',
      '',
    ].join('\n'),
    { status: 200 },
  );
}

export function lastRequestInit(): FetchInit {
  const call = fetchMock.mock.calls.at(-1);
  if (!call) throw new Error('fetch was not called');
  return call[1] as FetchInit;
}

export function lastRequestUrl(): string {
  const call = fetchMock.mock.calls.at(-1);
  if (!call) throw new Error('fetch was not called');
  return String(call[0]);
}

export function lastRequestHeaders(): Headers {
  return new Headers(lastRequestInit().headers);
}

export function requestUrls(): string[] {
  return fetchMock.mock.calls.map((c) => String(c[0]));
}
