import { Lunar, Solar } from 'lunar-typescript';
import type { NatalChart } from './chart';
import { BRANCH_MOD, TEN_GOD_BASE, branchRelation, parsePillar, tenGod } from './ganzhi';
import { CHINA_STANDARD, localDateKey, toWallClock, type WallClock } from './time';
import type { BranchRelation, Pillar, TenGod } from './types';

export interface SajuYear {
  pillar: Pillar;
  /** Gregorian year in which this saju year's 立春 falls. */
  startYear: number;
  start: Date;
  /** The next 立春 (exclusive). */
  end: Date;
}

export interface SajuMonth {
  index: number;
  pillar: Pillar;
  start: Date;
  end: Date;
  labelMonth: number;
  /** UTC+8 calendar date (YYYY-MM-DD) of `start`. */
  startDate: string;
  /** UTC+8 calendar date (YYYY-MM-DD) of `end`, i.e. the day the next month begins. */
  endDate: string;
}

export interface YearlyFortune {
  year: SajuYear;
  tenGod: TenGod;
  /** This year's branch against the natal year, month, day, hour branches, in that order. */
  branchRelations: BranchRelation[];
  months: (SajuMonth & { score: number })[];
}

export type RealityKind = 'up' | 'down' | 'flat' | 'none';

const CHINA_OFFSET_MS = 8 * 3600 * 1000;

// lunar-typescript solar terms are China Standard Time wall clocks.
function solarToDate(s: Solar): Date {
  return new Date(
    Date.UTC(s.getYear(), s.getMonth() - 1, s.getDay(), s.getHour(), s.getMinute(), s.getSecond()) -
      CHINA_OFFSET_MS,
  );
}

function solarAt(instant: Date): Solar {
  const w: WallClock = toWallClock(instant, CHINA_STANDARD);
  return Solar.fromYmdHms(w.year, w.month, w.day, w.hour, w.minute, w.second);
}

function liChun(year: number): Date {
  return solarToDate(Lunar.fromYmd(year, 1, 1).getJieQiTable()['立春']);
}

// The 節 strictly after `instant`; stepping one second forward avoids matching `instant` itself.
function nextJie(instant: Date): Date {
  return solarToDate(solarAt(new Date(instant.getTime() + 1000)).getLunar().getNextJie().getSolar());
}

export function sajuYearAt(instant: Date): SajuYear {
  const calendarYear = toWallClock(instant, CHINA_STANDARD).year;
  const thisLiChun = liChun(calendarYear);
  const before = instant.getTime() < thisLiChun.getTime();
  const startYear = before ? calendarYear - 1 : calendarYear;
  const start = before ? liChun(startYear) : thisLiChun;
  const end = before ? thisLiChun : liChun(startYear + 1);
  // Read the pillar at `start` (not `instant`) so it always agrees with startYear/start/end;
  // getYearInGanZhiByLiChun would flip at 00:00 of the 立春 day instead of the term instant.
  return {
    pillar: parsePillar(solarAt(start).getLunar().getYearInGanZhiExact()),
    startYear,
    start,
    end,
  };
}

export function sajuMonths(year: SajuYear): SajuMonth[] {
  const starts: Date[] = [year.start];
  for (let i = 0; i < 12; i++) starts.push(nextJie(starts[i]));
  return Array.from({ length: 12 }, (_, index) => {
    const start = starts[index];
    const end = starts[index + 1];
    return {
      index,
      pillar: parsePillar(solarAt(start).getLunar().getMonthInGanZhiExact()),
      start,
      end,
      labelMonth: toWallClock(start, CHINA_STANDARD).month,
      startDate: localDateKey(start, CHINA_STANDARD),
      endDate: localDateKey(end, CHINA_STANDARD),
    };
  });
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export function yearlyFortune(chart: NatalChart, now: Date): YearlyFortune {
  const year = sajuYearAt(now);
  const { dayMaster, pillars } = chart;
  const months = sajuMonths(year).map((m) => ({
    ...m,
    score: clamp(
      TEN_GOD_BASE[tenGod(dayMaster, m.pillar.stem)] +
        BRANCH_MOD[branchRelation(m.pillar.branch, pillars.day.branch)],
      20,
      99,
    ),
  }));
  return {
    year,
    tenGod: tenGod(dayMaster, year.pillar.stem),
    branchRelations: [pillars.year, pillars.month, pillars.day, pillars.hour].map((p) =>
      branchRelation(year.pillar.branch, p.branch),
    ),
    months,
  };
}

/** Sums calendar counts per saju month; months starting after `today` are `null`. */
export function sumByMonths(
  calendar: { date: string; count: number }[],
  months: SajuMonth[],
  today: string,
): (number | null)[] {
  return months.map((m) => {
    if (m.startDate > today) return null;
    return calendar
      .filter((c) => c.date >= m.startDate && c.date < m.endDate)
      .reduce((sum, c) => sum + c.count, 0);
  });
}

export function realityCheck(thisYear: number, lastYear: number): { kind: RealityKind; pct: number } {
  if (thisYear === 0 && lastYear === 0) return { kind: 'none', pct: 0 };
  if (lastYear === 0) return { kind: 'up', pct: 100 };
  const pct = Math.round(((thisYear - lastYear) / lastYear) * 100) + 0; // + 0 turns -0 into 0
  if (Math.abs(pct) < 10) return { kind: 'flat', pct };
  return { kind: pct > 0 ? 'up' : 'down', pct };
}
