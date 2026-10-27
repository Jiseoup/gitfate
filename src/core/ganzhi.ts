import { ELEMENTS } from './types';
import type { Branch, BranchRelation, Element, Pillar, Stem, TenGod, Zodiac } from './types';

export const STEMS: Stem[] = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

export const BRANCHES: Branch[] = [
  '子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥',
];

const BRANCH_ELEMENTS: Record<Branch, Element> = {
  子: 'water',
  丑: 'earth',
  寅: 'wood',
  卯: 'wood',
  辰: 'earth',
  巳: 'fire',
  午: 'fire',
  未: 'earth',
  申: 'metal',
  酉: 'metal',
  戌: 'earth',
  亥: 'water',
};

const BRANCH_ZODIACS: Record<Branch, Zodiac> = {
  子: 'rat',
  丑: 'ox',
  寅: 'tiger',
  卯: 'rabbit',
  辰: 'dragon',
  巳: 'snake',
  午: 'horse',
  未: 'goat',
  申: 'monkey',
  酉: 'rooster',
  戌: 'dog',
  亥: 'pig',
};

export function stemElement(s: Stem): Element {
  return ELEMENTS[Math.floor(STEMS.indexOf(s) / 2)];
}

export function stemIsYang(s: Stem): boolean {
  return STEMS.indexOf(s) % 2 === 0;
}

export function branchElement(b: Branch): Element {
  return BRANCH_ELEMENTS[b];
}

export function branchZodiac(b: Branch): Zodiac {
  return BRANCH_ZODIACS[b];
}

/** a generates b (木→火→土→金→水→木). */
export function generates(a: Element, b: Element): boolean {
  return ELEMENTS[(ELEMENTS.indexOf(a) + 1) % 5] === b;
}

/** a controls b (木→土→水→火→金→木). */
export function controls(a: Element, b: Element): boolean {
  return ELEMENTS[(ELEMENTS.indexOf(a) + 2) % 5] === b;
}

export function tenGod(dayStem: Stem, other: Stem): TenGod {
  const day = stemElement(dayStem);
  const oth = stemElement(other);
  const same = stemIsYang(dayStem) === stemIsYang(other);
  if (day === oth) return same ? 'bijian' : 'jiecai';
  if (generates(day, oth)) return same ? 'shishen' : 'shangguan';
  if (controls(day, oth)) return same ? 'piancai' : 'zhengcai';
  if (controls(oth, day)) return same ? 'qisha' : 'zhengguan';
  return same ? 'pianyin' : 'zhengyin';
}

const LIUHE: Branch[][] = [
  ['子', '丑'], ['寅', '亥'], ['卯', '戌'], ['辰', '酉'], ['巳', '申'], ['午', '未'],
];
const SANHE: Branch[][] = [
  ['申', '子', '辰'], ['亥', '卯', '未'], ['寅', '午', '戌'], ['巳', '酉', '丑'],
];
const CHONG: Branch[][] = [
  ['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥'],
];
const XING: Branch[][] = [
  ['寅', '巳'], ['巳', '申'], ['寅', '申'], ['丑', '戌'], ['戌', '未'], ['丑', '未'], ['子', '卯'],
  ['辰', '辰'], ['午', '午'], ['酉', '酉'], ['亥', '亥'],
];

function inPair(pairs: Branch[][], a: Branch, b: Branch): boolean {
  return pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

/** Priority: liuhe > sanhe > chong > xing. Symmetric in a and b. */
export function branchRelation(a: Branch, b: Branch): BranchRelation {
  if (inPair(LIUHE, a, b)) return 'liuhe';
  if (a !== b && SANHE.some((g) => g.includes(a) && g.includes(b))) return 'sanhe';
  if (inPair(CHONG, a, b)) return 'chong';
  if (inPair(XING, a, b)) return 'xing';
  return 'none';
}

export function parsePillar(s: string): Pillar {
  const chars = [...s];
  const stem = chars[0] as Stem;
  const branch = chars[1] as Branch;
  if (chars.length !== 2 || !STEMS.includes(stem) || !BRANCHES.includes(branch)) {
    throw new Error(`Invalid pillar: ${JSON.stringify(s)}`);
  }
  return { stem, branch };
}

export const TEN_GOD_BASE: Record<TenGod, number> = {
  shishen: 75,
  zhengyin: 72,
  zhengcai: 70,
  zhengguan: 68,
  piancai: 65,
  bijian: 60,
  pianyin: 58,
  shangguan: 55,
  jiecai: 50,
  qisha: 48,
};

export const BRANCH_MOD: Record<BranchRelation, number> = {
  liuhe: 10,
  sanhe: 6,
  chong: -12,
  xing: -6,
  none: 0,
};
