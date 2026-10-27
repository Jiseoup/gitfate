import { Solar } from 'lunar-typescript';
import yijiData from '../../data/yiji.json';
import type { NatalChart } from './chart';
import {
  BRANCH_MOD,
  BRANCHES,
  TEN_GOD_BASE,
  branchElement,
  branchRelation,
  generates,
  parsePillar,
  stemElement,
  tenGod,
} from './ganzhi';
import { REPRESENTATIVE_LANGUAGE, type LanguageProfile } from './language';
import { seededInt } from './seed';
import { ELEMENTS } from './types';
import type { Branch, BranchRelation, Element, Pillar, TenGod } from './types';

export type StarKey = 'deploy' | 'debug' | 'review' | 'merge';

export interface DailyFortune {
  date: string;
  dayPillar: Pillar;
  tenGod: TenGod;
  branchRelation: BranchRelation;
  score: number;
  stars: Record<StarKey, number>;
  yi: string[];
  ji: string[];
  lucky: { element: Element; hourBranch: Branch; language: string };
  variantSeed: string;
}

export const SUPPORTED_YIJI: readonly string[] = yijiData;

const STAR_KEYS: StarKey[] = ['deploy', 'debug', 'review', 'merge'];

const STAR_BASE: Record<TenGod, [number, number, number, number]> = {
  bijian: [3, 3, 4, 4],
  jiecai: [3, 3, 3, 1],
  shishen: [4, 3, 4, 4],
  shangguan: [3, 4, 5, 2],
  piancai: [4, 3, 3, 3],
  zhengcai: [4, 4, 3, 4],
  qisha: [1, 5, 3, 2],
  zhengguan: [3, 3, 4, 4],
  pianyin: [2, 4, 3, 3],
  zhengyin: [3, 4, 4, 3],
};

const PRESSURE_DAYS: readonly TenGod[] = ['qisha', 'zhengguan', 'shangguan', 'jiecai'];

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function supportedOnly(items: string[]): string[] {
  return items.filter((s) => SUPPORTED_YIJI.includes(s)).slice(0, 3);
}

/** `date` is a `YYYY-MM-DD` key in the already-decided timezone. */
export function dailyFortune(
  chart: NatalChart,
  login: string,
  date: string,
  profile?: LanguageProfile,
): DailyFortune {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) throw new Error(`Invalid date: ${JSON.stringify(date)}`);
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const check = new Date(Date.UTC(y, mo - 1, d));
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) {
    throw new Error(`Invalid date: ${JSON.stringify(date)}`);
  }

  const l = login.toLowerCase();
  const lunar = Solar.fromYmd(y, mo, d).getLunar();
  const dayPillar = parsePillar(lunar.getDayGan() + lunar.getDayZhi());

  const god = tenGod(chart.dayMaster, dayPillar.stem);
  const relation = branchRelation(chart.pillars.day.branch, dayPillar.branch);
  const score = clamp(
    TEN_GOD_BASE[god] + BRANCH_MOD[relation] + seededInt(-18, 18, l, date, 'score'),
    20,
    99,
  );

  const base = STAR_BASE[god];
  const stars = {} as Record<StarKey, number>;
  STAR_KEYS.forEach((key, i) => {
    stars[key] = clamp(base[i] + seededInt(-1, 1, l, date, 'star:' + key), 1, 5);
  });

  const element: Element = PRESSURE_DAYS.includes(god)
    ? ELEMENTS.find((e) => generates(e, stemElement(chart.dayMaster)))!
    : chart.weakest[seededInt(0, chart.weakest.length - 1, l, date, 'lucky')];
  const hours = BRANCHES.filter((b) => branchElement(b) === element);
  const hourBranch = hours[seededInt(0, hours.length - 1, l, date, 'hour')];
  const language =
    profile?.topLanguages.find((t) => t.element === element)?.name ??
    REPRESENTATIVE_LANGUAGE[element];

  return {
    date,
    dayPillar,
    tenGod: god,
    branchRelation: relation,
    score,
    stars,
    yi: supportedOnly(lunar.getDayYi()),
    ji: supportedOnly(lunar.getDayJi()),
    lucky: { element, hourBranch, language },
    variantSeed: `${l}|${date}`,
  };
}
