import { Solar } from 'lunar-typescript';
import { branchElement, branchZodiac, parsePillar, stemElement } from './ganzhi';
import { CHINA_STANDARD, toWallClock, type TzSpec, type WallClock } from './time';
import { ELEMENTS, type Element, type Pillar, type Stem, type Zodiac } from './types';

export interface NatalChart {
  pillars: { year: Pillar; month: Pillar; day: Pillar; hour: Pillar };
  dayMaster: Stem;
  zodiac: { animal: Zodiac; element: Element };
  elementCounts: Record<Element, number>;
  strongest: Element[];
  weakest: Element[];
}

function eightChar(w: WallClock) {
  return Solar.fromYmdHms(w.year, w.month, w.day, w.hour, w.minute, w.second)
    .getLunar()
    .getEightChar();
}

// Solar terms in lunar-typescript are China Standard Time instants, so the year and
// month pillars come from the UTC+8 wall clock; day and hour pillars follow the local one.
export function computeChart(birth: Date, tz: TzSpec): NatalChart {
  const china = eightChar(toWallClock(birth, CHINA_STANDARD));
  const local = eightChar(toWallClock(birth, tz));
  const year = parsePillar(china.getYear());
  const month = parsePillar(china.getMonth());
  const day = parsePillar(local.getDay());
  const hour = parsePillar(local.getTime());

  const elementCounts: Record<Element, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  for (const pillar of [year, month, day, hour]) {
    elementCounts[stemElement(pillar.stem)] += 1;
    elementCounts[branchElement(pillar.branch)] += 1;
  }
  const counts = ELEMENTS.map((e) => elementCounts[e]);
  const max = Math.max(...counts);
  const min = Math.min(...counts);

  return {
    pillars: { year, month, day, hour },
    dayMaster: day.stem,
    zodiac: { animal: branchZodiac(year.branch), element: stemElement(year.stem) },
    elementCounts,
    strongest: ELEMENTS.filter((e) => elementCounts[e] === max),
    weakest: ELEMENTS.filter((e) => elementCounts[e] === min),
  };
}
