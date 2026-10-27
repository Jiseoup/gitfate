import { compatibility, sharedLanguages, type Compatibility } from '@/core/compat';
import type { NatalChart } from '@/core/chart';
import { languageProfile } from '@/core/language';
import type { ResolvedTz } from '@/core/timezone';
import type { Profile } from '@/github/profile';
import { lookupProfile, resolveNatalWithActivity } from './user';

export interface CompatSide {
  profile: Profile;
  tz: ResolvedTz;
  chart: NatalChart;
  /** Names of the top 3 languages; empty when activity could not be loaded. */
  topLanguages: string[];
}

export type CompatReading =
  | {
      status: 'ok';
      a: CompatSide;
      b: CompatSide;
      result: Compatibility;
      shared: string[];
      /** Either side's timezone signals or languages could not be read fully. */
      degraded: boolean;
    }
  | { status: 'invalid' | 'not-found' | 'blocked' | 'unavailable'; which: 'a' | 'b' };

const TOP_LANGUAGES = 3;

async function buildSide(login: string, tzParam: string | null | undefined, now: Date) {
  const found = await lookupProfile(login);
  if (found.status !== 'ok') return found;
  const { profile } = found;
  // Same activity request (and ranges) as the user page, so both pages share the cached response.
  const { tz, chart, activity: raw, degraded } = await resolveNatalWithActivity(profile, tzParam, now);
  const topLanguages = raw
    ? languageProfile(raw.languages).topLanguages.slice(0, TOP_LANGUAGES).map((l) => l.name)
    : [];
  return { status: 'ok' as const, side: { profile, tz, chart, topLanguages } satisfies CompatSide, degraded };
}

export async function buildCompatReading(
  a: string,
  b: string,
  opts: { tzA?: string | null; tzB?: string | null; now: Date },
): Promise<CompatReading> {
  const { tzA, tzB, now } = opts;
  const [sa, sb] = await Promise.all([buildSide(a, tzA, now), buildSide(b, tzB, now)]);
  if (sa.status !== 'ok') return { status: sa.status, which: 'a' };
  if (sb.status !== 'ok') return { status: sb.status, which: 'b' };
  return {
    status: 'ok',
    a: sa.side,
    b: sb.side,
    result: compatibility(sa.side.chart, sb.side.chart),
    shared: sharedLanguages(sa.side.topLanguages, sb.side.topLanguages),
    degraded: sa.degraded || sb.degraded,
  };
}
