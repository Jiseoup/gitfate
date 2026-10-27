import type { LanguageBytes } from '@/core/language';
import { githubGraphql } from './client';
import type { Profile } from './profile';

const ACTIVITY_REVALIDATE = 43200;

export interface Activity {
  languages: LanguageBytes[];
  calendar: { date: string; count: number }[] | null;
  thisYearTotal: number | null;
  lastYearTotal: number | null;
}

const CALENDAR = `contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } }`;

const QUERY = `
query Activity($login: String!, $thisFrom: DateTime!, $thisTo: DateTime!, $lastFrom: DateTime!, $lastTo: DateTime!) {
  repositoryOwner(login: $login) {
    repositories(first: 30, ownerAffiliations: OWNER, privacy: PUBLIC, isFork: false, orderBy: { field: PUSHED_AT, direction: DESC }) {
      nodes {
        languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
          edges { size node { name color } }
        }
      }
    }
    ... on User {
      thisYear: contributionsCollection(from: $thisFrom, to: $thisTo) { ${CALENDAR} }
      lastYear: contributionsCollection(from: $lastFrom, to: $lastTo) { ${CALENDAR} }
    }
  }
}`;

interface Collection {
  contributionCalendar: {
    totalContributions: number;
    weeks: { contributionDays: { date: string; contributionCount: number }[] }[];
  };
}

interface ActivityData {
  repositoryOwner: {
    repositories: {
      nodes: ({
        languages: { edges: { size: number; node: { name: string; color: string | null } }[] } | null;
      } | null)[];
    };
    thisYear?: Collection;
    lastYear?: Collection;
  } | null;
}

export async function fetchActivity(
  profile: Profile,
  ranges: { thisFrom: Date; thisTo: Date; lastFrom: Date; lastTo: Date },
): Promise<Activity> {
  const data = await githubGraphql<ActivityData>(
    QUERY,
    {
      login: profile.login,
      thisFrom: ranges.thisFrom.toISOString(),
      thisTo: ranges.thisTo.toISOString(),
      lastFrom: ranges.lastFrom.toISOString(),
      lastTo: ranges.lastTo.toISOString(),
    },
    ACTIVITY_REVALIDATE,
  );
  const owner = data.repositoryOwner;

  const byName = new Map<string, LanguageBytes>();
  for (const repo of owner?.repositories.nodes ?? []) {
    for (const edge of repo?.languages?.edges ?? []) {
      const existing = byName.get(edge.node.name);
      if (existing) existing.bytes += edge.size;
      else byName.set(edge.node.name, { name: edge.node.name, color: edge.node.color, bytes: edge.size });
    }
  }
  const languages = [...byName.values()].sort((a, b) => b.bytes - a.bytes);

  if (profile.isOrganization || !owner?.thisYear || !owner.lastYear) {
    return { languages, calendar: null, thisYearTotal: null, lastYearTotal: null };
  }
  return {
    languages,
    calendar: owner.thisYear.contributionCalendar.weeks.flatMap((w) =>
      w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount })),
    ),
    thisYearTotal: owner.thisYear.contributionCalendar.totalContributions,
    lastYearTotal: owner.lastYear.contributionCalendar.totalContributions,
  };
}
