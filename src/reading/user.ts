import { computeChart, type NatalChart } from '@/core/chart';
import { dailyFortune, type DailyFortune } from '@/core/daily';
import { diagnoseLanguages, languageProfile, type LanguageProfile } from '@/core/language';
import { localDateKey, toWallClock } from '@/core/time';
import { resolveTimezone, type ResolvedTz } from '@/core/timezone';
import {
  realityCheck,
  sajuYearAt,
  sumByMonths,
  yearlyFortune,
  type RealityKind,
  type YearlyFortune,
} from '@/core/yearly';
import { fetchActivity, type Activity } from '@/github/activity';
import { isBlocked } from '@/lib/blocklist';
import { GitHubRateLimitError, GitHubUnavailableError } from '@/github/client';
import { fetchProfile, type Profile } from '@/github/profile';
import { fetchTimezoneSignals } from '@/github/timezone-signals';
import { isValidLogin } from '@/lib/login';

export { isValidLogin };

export interface UserActivity {
  profile: LanguageProfile;
  /** Contributions per saju month; `null` for months not started yet or accounts without a calendar. */
  monthly: (number | null)[];
  /** `null` when the account has no contribution calendar (organizations). */
  reality: { kind: RealityKind; pct: number } | null;
}

export type UserReading =
  | {
      status: 'ok';
      profile: Profile;
      tz: ResolvedTz;
      /** Signup instant as a local wall clock in the resolved timezone, `YYYY-MM-DDTHH:mm:ss`. */
      bornAt: string;
      chart: NatalChart;
      daily: DailyFortune;
      yearly: YearlyFortune;
      activity: UserActivity | null;
      diagnosis: ReturnType<typeof diagnoseLanguages> | null;
      /** GitHub could not answer fully (timezone signals or activity): the reading may change once it can. */
      degraded: boolean;
    }
  | { status: 'invalid' | 'not-found' | 'blocked' | 'unavailable' };

const HOUR_MS = 3600 * 1000;

function floorToUtcHour(d: Date): Date {
  return new Date(Math.floor(d.getTime() / HOUR_MS) * HOUR_MS);
}

function yearBefore(d: Date): Date {
  const out = new Date(d);
  out.setUTCFullYear(out.getUTCFullYear() - 1);
  return out;
}

function isGitHubError(e: unknown): boolean {
  return e instanceof GitHubRateLimitError || e instanceof GitHubUnavailableError;
}

/**
 * For optional enrichments: GitHub outages degrade silently; anything else is likely a bug, so it is
 * logged (error name and message only, never response bodies) and the page still degrades.
 */
export function degrade<T>(step: string, login: string, fallback: T): (e: unknown) => T {
  return (e) => {
    if (!isGitHubError(e)) {
      const err = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
      console.error(`[gitfate] ${step} failed for ${login}: ${err}`);
    }
    return fallback;
  };
}

function wallClockString(instant: Date, tz: ResolvedTz['tz']): string {
  const w = toWallClock(instant, tz);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${String(w.year).padStart(4, '0')}-${p(w.month)}-${p(w.day)}T${p(w.hour)}:${p(w.minute)}:${p(w.second)}`;
}

type Failure = { status: 'invalid' | 'not-found' | 'blocked' | 'unavailable' };

interface Natal {
  tz: ResolvedTz;
  chart: NatalChart;
  /** Timezone signals were unreadable and the reading did not come from `?tz=`. */
  degraded: boolean;
}

/** Rounded to the hour: the ranges are part of the activity fetch cache key. */
export function activityRanges(yearStart: Date, now: Date) {
  const thisTo = new Date(Math.max(floorToUtcHour(now).getTime(), yearStart.getTime()));
  return {
    thisFrom: yearStart,
    thisTo,
    lastFrom: yearBefore(yearStart),
    lastTo: yearBefore(thisTo),
  };
}

/** Login checks and profile lookup; the cheap front of every reading. */
export async function lookupProfile(login: string): Promise<{ status: 'ok'; profile: Profile } | Failure> {
  if (!isValidLogin(login)) return { status: 'invalid' };
  if (isBlocked(login)) return { status: 'blocked' };
  let profile: Profile | null;
  try {
    profile = await fetchProfile(login.toLowerCase());
  } catch (e) {
    if (isGitHubError(e)) return { status: 'unavailable' };
    throw e;
  }
  return profile ? { status: 'ok', profile } : { status: 'not-found' };
}

const NO_SIGNALS: { early: number[]; recent: number[]; degraded: boolean } = { early: [], recent: [], degraded: true };

/** Timezone and natal chart for a looked-up profile: the part of a reading that every page shares. */
async function resolveNatal(profile: Profile, tzParam: string | null | undefined, now: Date): Promise<Natal> {
  const signals = await fetchTimezoneSignals(profile).catch(degrade('timezone signals', profile.login, NO_SIGNALS));
  const tz = resolveTimezone({
    tzParam,
    earlyOffsets: signals.early,
    recentOffsets: signals.recent,
    location: profile.location,
    at: now,
  });
  const chart = computeChart(new Date(profile.createdAt), tz.tz);
  return { tz, chart, degraded: signals.degraded && tz.source !== 'param' };
}

/**
 * Natal chart and activity, fetched in parallel (the activity ranges depend only on `now`).
 * `activity` is `null` when it could not be read.
 */
export async function resolveNatalWithActivity(
  profile: Profile,
  tzParam: string | null | undefined,
  now: Date,
): Promise<Natal & { activity: Activity | null }> {
  const [natal, activity] = await Promise.all([
    resolveNatal(profile, tzParam, now),
    fetchActivity(profile, activityRanges(sajuYearAt(now).start, now)).catch(degrade('activity', profile.login, null)),
  ]);
  return { ...natal, activity, degraded: natal.degraded || activity === null };
}

export async function buildUserReading(
  login: string,
  opts: { tzParam?: string | null; now: Date },
): Promise<UserReading> {
  const { tzParam, now } = opts;
  const found = await lookupProfile(login);
  if (found.status !== 'ok') return found;
  const { profile } = found;
  const { tz, chart, activity: raw, degraded } = await resolveNatalWithActivity(profile, tzParam, now);

  const birth = new Date(profile.createdAt);
  const daily = dailyFortune(chart, profile.login, localDateKey(now, tz.tz));
  // Same saju year as the activity ranges: both come from sajuYearAt(now).
  const yearly = yearlyFortune(chart, now);

  let activity: UserActivity | null = null;
  let diagnosis: ReturnType<typeof diagnoseLanguages> | null = null;
  if (raw) {
    const langs = languageProfile(raw.languages);
    const { calendar, thisYearTotal, lastYearTotal } = raw;
    activity = {
      profile: langs,
      monthly: calendar ? sumByMonths(calendar, yearly.months, daily.date) : yearly.months.map(() => null),
      reality:
        thisYearTotal !== null && lastYearTotal !== null ? realityCheck(thisYearTotal, lastYearTotal) : null,
    };
    diagnosis = diagnoseLanguages(chart, langs);
  }

  return {
    status: 'ok',
    profile,
    tz,
    bornAt: wallClockString(birth, tz.tz),
    chart,
    daily,
    yearly,
    activity,
    diagnosis,
    degraded,
  };
}
