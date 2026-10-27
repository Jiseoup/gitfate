import { expect, test } from 'vitest';
import { fetchActivity } from '@/github/activity';
import {
  fetchCalls,
  lastRequestInit,
  mockGraphql,
  installGithubMocks,
  userProfile,
} from './helpers';

installGithubMocks();

const ranges = {
  thisFrom: new Date('2026-01-01T00:00:00Z'),
  thisTo: new Date('2026-10-27T00:00:00Z'),
  lastFrom: new Date('2025-01-01T00:00:00Z'),
  lastTo: new Date('2025-12-31T23:59:59Z'),
};

const lang = (name: string, color: string | null, size: number) => ({ size, node: { name, color } });
const calendar = (days: [string, number][], total: number) => ({
  contributionCalendar: {
    totalContributions: total,
    weeks: [{ contributionDays: days.map(([date, contributionCount]) => ({ date, contributionCount })) }],
  },
});

test('aggregates languages across repos and reads both contribution years', async () => {
  mockGraphql({
    data: {
      repositoryOwner: {
        repositories: {
          nodes: [
            { languages: { edges: [lang('TypeScript', '#3178c6', 100), lang('Go', '#00ADD8', 30)] } },
            { languages: { edges: [lang('Go', '#00ADD8', 80), lang('Shell', null, 5)] } },
            { languages: null },
          ],
        },
        thisYear: calendar([['2026-01-01', 2], ['2026-01-02', 0]], 2),
        lastYear: calendar([['2025-01-01', 7]], 7),
      },
    },
  });
  const a = await fetchActivity(userProfile, ranges);
  expect(a.languages).toEqual([
    { name: 'Go', color: '#00ADD8', bytes: 110 },
    { name: 'TypeScript', color: '#3178c6', bytes: 100 },
    { name: 'Shell', color: null, bytes: 5 },
  ]);
  expect(a.calendar).toEqual([
    { date: '2026-01-01', count: 2 },
    { date: '2026-01-02', count: 0 },
  ]);
  expect(a.thisYearTotal).toBe(2);
  expect(a.lastYearTotal).toBe(7);
  expect(lastRequestInit().next.revalidate).toBe(43200);
  const vars = JSON.parse(lastRequestInit().body as string).variables;
  expect(vars).toMatchObject({
    login: 'jiseoup',
    thisFrom: '2026-01-01T00:00:00.000Z',
    thisTo: '2026-10-27T00:00:00.000Z',
    lastFrom: '2025-01-01T00:00:00.000Z',
    lastTo: '2025-12-31T23:59:59.000Z',
  });
});

test('organization has null contribution values', async () => {
  mockGraphql({
    data: {
      repositoryOwner: {
        repositories: { nodes: [{ languages: { edges: [lang('Rust', '#dea584', 9)] } }] },
      },
    },
  });
  const a = await fetchActivity({ ...userProfile, isOrganization: true }, ranges);
  expect(a).toEqual({
    languages: [{ name: 'Rust', color: '#dea584', bytes: 9 }],
    calendar: null,
    thisYearTotal: null,
    lastYearTotal: null,
  });
  expect(fetchCalls()).toBe(1);
});

test('missing owner yields an empty activity', async () => {
  mockGraphql({ data: { repositoryOwner: null } });
  expect(await fetchActivity(userProfile, ranges)).toEqual({
    languages: [],
    calendar: null,
    thisYearTotal: null,
    lastYearTotal: null,
  });
});
