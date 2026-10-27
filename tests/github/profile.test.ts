import { expect, test } from 'vitest';
import { GitHubRateLimitError } from '@/github/client';
import { fetchProfile } from '@/github/profile';
import { lastRequestInit, mockFetch, mockGraphql, installGithubMocks, userNode } from './helpers';

installGithubMocks();

test('profile not found → null; rate limit → GitHubRateLimitError', async () => {
  mockGraphql({ data: { repositoryOwner: null } });
  expect(await fetchProfile('nobody-here')).toBeNull();
  mockFetch(new Response('{}', { status: 403, headers: { 'x-ratelimit-remaining': '0' } }));
  await expect(fetchProfile('x')).rejects.toBeInstanceOf(GitHubRateLimitError);
});

test('requests carry the token and revalidate values', async () => {
  mockGraphql({ data: { repositoryOwner: userNode } });
  await fetchProfile('jiseoup');
  expect(lastRequestInit().headers.authorization).toBe('Bearer test-token');
  expect(lastRequestInit().next.revalidate).toBe(604800);
});

test('maps a user and returns the canonical login', async () => {
  mockGraphql({ data: { repositoryOwner: { ...userNode, login: 'JiSeoup' } } });
  expect(await fetchProfile('jiseoup')).toEqual({
    id: 'U_kgDOtest',
    login: 'JiSeoup',
    name: 'Ji Seoup',
    avatarUrl: 'https://avatars.githubusercontent.com/u/1',
    createdAt: '2015-03-04T05:06:07Z',
    isOrganization: false,
    location: 'Seoul, South Korea',
  });
});

test('maps an organization and normalizes empty name/location to null', async () => {
  mockGraphql({
    data: { repositoryOwner: { ...userNode, __typename: 'Organization', name: '', location: null } },
  });
  const p = await fetchProfile('some-org');
  expect(p?.isOrganization).toBe(true);
  expect(p?.name).toBeNull();
  expect(p?.location).toBeNull();
});
