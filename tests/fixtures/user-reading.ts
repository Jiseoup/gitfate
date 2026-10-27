import { computeChart } from '@/core/chart';
import { dailyFortune } from '@/core/daily';
import { diagnoseLanguages, languageProfile } from '@/core/language';
import { localDateKey } from '@/core/time';
import type { ResolvedTz } from '@/core/timezone';
import { realityCheck, sumByMonths, yearlyFortune } from '@/core/yearly';
import type { Profile } from '@/github/profile';
import type { UserReading } from '@/reading/user';

export const fixtureNow = new Date('2026-10-27T03:25:41Z');

export const fixtureProfile: Profile = {
  id: 'U_kgDOtest',
  login: 'JiSeoup',
  name: 'Ji Seoup',
  avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
  createdAt: '2015-03-04T05:06:07Z',
  isOrganization: false,
  location: 'Berlin',
};

/** A complete `ok` reading built from the real core functions (no GitHub access). */
export function okReading(opts: { withActivity: boolean }): Extract<UserReading, { status: 'ok' }> {
  const tz: ResolvedTz = {
    tz: { kind: 'offset', minutes: 540 },
    source: 'early-commits',
    suggestion: { iana: 'Europe/Berlin', location: 'Berlin' },
  };
  const chart = computeChart(new Date(fixtureProfile.createdAt), tz.tz);
  const daily = dailyFortune(chart, fixtureProfile.login, localDateKey(fixtureNow, tz.tz));
  const yearly = yearlyFortune(chart, fixtureNow);
  const langs = languageProfile([
    { name: 'TypeScript', color: '#3178c6', bytes: 7000 },
    { name: 'Rust', color: '#dea584', bytes: 3000 },
  ]);
  const calendar = [
    { date: '2026-02-10', count: 3 },
    { date: '2026-03-10', count: 5 },
  ];
  return {
    status: 'ok',
    profile: fixtureProfile,
    tz,
    bornAt: '2015-03-04T14:06:07',
    chart,
    daily,
    yearly,
    activity: opts.withActivity
      ? { profile: langs, monthly: sumByMonths(calendar, yearly.months, daily.date), reality: realityCheck(140, 100) }
      : null,
    diagnosis: opts.withActivity ? diagnoseLanguages(chart, langs) : null,
    degraded: !opts.withActivity,
  };
}
