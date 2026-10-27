import { computeChart } from '@/core/chart';
import { compatibility, sharedLanguages } from '@/core/compat';
import type { ResolvedTz } from '@/core/timezone';
import type { Profile } from '@/github/profile';
import type { CompatReading, CompatSide } from '@/reading/compat';
import { fixtureProfile } from './user-reading';

export const otherFixtureProfile: Profile = {
  id: 'U_kgDOother',
  login: 'Torvalds',
  name: null,
  avatarUrl: 'https://avatars.githubusercontent.com/u/2?v=4',
  createdAt: '2011-09-03T15:26:22Z',
  isOrganization: false,
  location: null,
};

const tzSeoul: ResolvedTz = { tz: { kind: 'offset', minutes: 540 }, source: 'early-commits', suggestion: null };
const tzDefault: ResolvedTz = { tz: { kind: 'offset', minutes: 0 }, source: 'default', suggestion: null };

function side(profile: Profile, tz: ResolvedTz, topLanguages: string[]): CompatSide {
  return { profile, tz, chart: computeChart(new Date(profile.createdAt), tz.tz), topLanguages };
}

export function okCompat(opts: { sharedLang: boolean } = { sharedLang: true }): Extract<CompatReading, { status: 'ok' }> {
  const a = side(fixtureProfile, tzSeoul, ['TypeScript', 'Rust', 'Go']);
  const b = side(otherFixtureProfile, tzDefault, opts.sharedLang ? ['C', 'rust'] : ['C', 'Perl']);
  return {
    status: 'ok',
    a,
    b,
    result: compatibility(a.chart, b.chart),
    shared: sharedLanguages(a.topLanguages, b.topLanguages),
    degraded: false,
  };
}
