import { unstable_cache } from 'next/cache';
import { parsePatchDateOffset } from '@/core/timezone';
import { GitHubUnavailableError, githubGraphql, githubRestHeader } from './client';
import type { Profile } from './profile';

// The requests themselves are no-store; the derived offsets are cached once, by unstable_cache below.
const SIGNALS_REVALIDATE = 2592000;
const WINDOW_DAYS = 90;
const MAX_COMMITS = 5;

const QUERY = `
query Signals($login: String!, $id: ID!, $since: GitTimestamp, $until: GitTimestamp, $field: RepositoryOrderField!, $direction: OrderDirection!) {
  repositoryOwner(login: $login) {
    repositories(first: 20, ownerAffiliations: OWNER, privacy: PUBLIC, isFork: false, orderBy: { field: $field, direction: $direction }) {
      nodes {
        name
        owner { login }
        defaultBranchRef {
          target {
            ... on Commit {
              history(first: 5, author: { id: $id }, since: $since, until: $until) {
                nodes { oid }
              }
            }
          }
        }
      }
    }
  }
}`;

/** Offsets (minutes) from commits made within 90 days of signup, and from recent commits (README time zone rules 2 and 3). */
export interface TimezoneSignals {
  early: number[];
  recent: number[];
}

interface CommitRef {
  owner: string;
  repo: string;
  oid: string;
}

interface SignalsData {
  repositoryOwner: {
    repositories: {
      nodes: ({
        name: string;
        owner: { login: string };
        defaultBranchRef: { target: { history?: { nodes: { oid: string }[] } } | null } | null;
      } | null)[];
    };
  } | null;
}

async function listCommits(
  profile: Pick<Profile, 'login' | 'id'>,
  variables: Record<string, unknown>,
): Promise<CommitRef[]> {
  const data = await githubGraphql<SignalsData>(QUERY, {
    login: profile.login,
    id: profile.id,
    since: null,
    until: null,
    ...variables,
  });
  const refs: CommitRef[] = [];
  for (const repo of data.repositoryOwner?.repositories.nodes ?? []) {
    for (const c of repo?.defaultBranchRef?.target?.history?.nodes ?? []) {
      refs.push({ owner: repo!.owner.login, repo: repo!.name, oid: c.oid });
    }
  }
  return refs.slice(0, MAX_COMMITS);
}

/**
 * Fetches one commit as a patch and keeps only the UTC offset from its Date header. Only the header block is
 * read (the rest of the stream is cancelled), and the request is `no-store` so Next's data cache never holds
 * the patch (it carries emails and messages). A commit GitHub cannot serve (diff too large, 5xx, 451, 409,
 * timeout) is `failed`; rate limits still throw.
 */
async function commitOffset(ref: CommitRef): Promise<{ offset: number | null; failed: boolean }> {
  try {
    const header = await githubRestHeader(
      `/repos/${encodeURIComponent(ref.owner)}/${encodeURIComponent(ref.repo)}/commits/${encodeURIComponent(ref.oid)}`,
      'application/vnd.github.patch',
    );
    return { offset: header === null ? null : parsePatchDateOffset(header), failed: false };
  } catch (e) {
    if (e instanceof GitHubUnavailableError) return { offset: null, failed: true };
    throw e;
  }
}

/**
 * One time zone rule: the offsets of the commits a candidate query finds. `settled` is false when the answer
 * may be an outage artifact: the query failed, or every commit it found failed. A step that found offsets
 * despite some failed commits is settled (those commits are usually too large to ever serve).
 */
async function stepOffsets(
  profile: Pick<Profile, 'login' | 'id'>,
  variables: Record<string, unknown>,
): Promise<{ offsets: number[]; settled: boolean }> {
  let refs: CommitRef[];
  try {
    refs = await listCommits(profile, variables);
  } catch (e) {
    if (e instanceof GitHubUnavailableError) return { offsets: [], settled: false };
    throw e;
  }
  const results = await Promise.all(refs.map(commitOffset));
  const offsets = results.flatMap((r) => (r.offset === null ? [] : [r.offset]));
  return { offsets, settled: offsets.length > 0 || !results.some((r) => r.failed) };
}

/** Thrown out of the cached function so an unsettled answer is used for this request but never cached. */
class UnsettledSignals extends Error {
  constructor(readonly signals: TimezoneSignals) {
    super('timezone signals unsettled');
    this.name = 'UnsettledSignals';
  }
}

async function computeSignals(login: string, id: string, createdAt: string): Promise<TimezoneSignals> {
  const profile = { login, id };
  const since = new Date(createdAt);
  const until = new Date(since.getTime() + WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const early = await stepOffsets(profile, {
    field: 'CREATED_AT',
    direction: 'ASC',
    since: since.toISOString(),
    until: until.toISOString(),
  });
  if (early.offsets.length > 0) return { early: early.offsets, recent: [] };
  // Rule 3: recent commits only when the early ones give no offset.
  const recent = await stepOffsets(profile, { field: 'PUSHED_AT', direction: 'DESC' });
  const signals = { early: [], recent: recent.offsets };
  if (!early.settled || !recent.settled) throw new UnsettledSignals(signals);
  return signals;
}

// Only the derived offsets are cached; arguments (lowercased login, id, signup time) form the cache key.
const cachedSignals = unstable_cache(computeSignals, ['timezone-signals'], {
  revalidate: SIGNALS_REVALIDATE,
});

/** `degraded` when GitHub could not answer fully: the result is a best effort for this request only. */
export async function fetchTimezoneSignals(profile: Profile): Promise<TimezoneSignals & { degraded: boolean }> {
  if (profile.isOrganization) return { early: [], recent: [], degraded: false };
  try {
    const signals = await cachedSignals(profile.login.toLowerCase(), profile.id, profile.createdAt);
    return { ...signals, degraded: false };
  } catch (e) {
    if (e instanceof UnsettledSignals) return { ...e.signals, degraded: true };
    throw e;
  }
}
