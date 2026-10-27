import { branchZodiac, stemElement } from '@/core/ganzhi';
import type { Pillar, Stem } from '@/core/types';
import type { T } from '@/i18n/messages';

/** Hover text for a Sign: its name and the traditional stem term, e.g. "보석 · 신금". */
export function signTitle(t: T, stem: Stem): string {
  return `${t(`terms.sign.${stem}`)} · ${t(`terms.stem.${stem}`)}`;
}

/** A pillar as a color and a zodiac animal, the way years are named: 辛亥 → "흰 돼지" / "White Pig". */
export function pillarName(t: T, p: Pillar): string {
  return t('terms.pillarName', {
    color: t(`terms.zodiacColor.${stemElement(p.stem)}`),
    animal: t(`terms.animal.${branchZodiac(p.branch)}`),
  });
}

/** Hover text for a pillar name: the traditional names of both characters. */
export function pillarTitle(t: T, p: Pillar): string {
  return `${t(`terms.stem.${p.stem}`)} · ${t(`terms.branch.${p.branch}`)}`;
}
