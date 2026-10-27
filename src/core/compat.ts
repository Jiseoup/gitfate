import type { NatalChart } from './chart';
import { branchRelation, controls, generates, stemElement } from './ganzhi';
import { ELEMENTS, type BranchRelation } from './types';

export interface Compatibility {
  score: number;
  sub: { pair: number; review: number; incident: number };
  flow: 'generate' | 'same' | 'control';
  giver: 'a' | 'b' | null;
  dayBranch: BranchRelation;
  zodiac: BranchRelation;
}

const DAY_BRANCH: Record<BranchRelation, number> = {
  liuhe: 15,
  sanhe: 10,
  chong: -15,
  xing: -8,
  none: 0,
};

const clamp = (v: number) => Math.round(Math.min(99, Math.max(10, v)));

/** Symmetric in a and b: score and sub-scores match when swapped; only `giver` flips. */
export function compatibility(a: NatalChart, b: NatalChart): Compatibility {
  const ea = stemElement(a.dayMaster);
  const eb = stemElement(b.dayMaster);

  let flow: Compatibility['flow'] = 'same';
  let giver: Compatibility['giver'] = null;
  let stem = 8;
  if (ea !== eb) {
    if (generates(ea, eb)) {
      flow = 'generate';
      giver = 'a';
      stem = 15;
    } else if (generates(eb, ea)) {
      flow = 'generate';
      giver = 'b';
      stem = 15;
    } else if (controls(ea, eb)) {
      flow = 'control';
      giver = 'a';
      stem = -10;
    } else {
      flow = 'control';
      giver = 'b';
      stem = -10;
    }
  }

  const dayBranch = branchRelation(a.pillars.day.branch, b.pillars.day.branch);
  const zodiac = branchRelation(a.pillars.year.branch, b.pillars.year.branch);

  const day = DAY_BRANCH[dayBranch];
  const comp = Math.min(
    15,
    5 *
      ELEMENTS.filter((e) => {
        const x = a.elementCounts[e];
        const y = b.elementCounts[e];
        return (x === 0 && y >= 2) || (y === 0 && x >= 2);
      }).length,
  );
  const zod = zodiac === 'liuhe' || zodiac === 'sanhe' ? 8 : zodiac === 'chong' ? -8 : 0;

  return {
    score: clamp(60 + stem + day + comp + zod),
    sub: {
      pair: clamp(60 + 2 * stem + day / 2),
      review: clamp(60 + 2 * comp + stem / 2),
      incident: clamp(60 + day + 2 * zod),
    },
    flow,
    giver,
    dayBranch,
    zodiac,
  };
}

/** Languages in both lists, in a's order and spelling, compared case-insensitively. */
export function sharedLanguages(a: string[], b: string[]): string[] {
  const inB = new Set(b.map((l) => l.toLowerCase()));
  return a.filter((l) => inB.has(l.toLowerCase()));
}
