import type { Compatibility } from '@/core/compat';
import { createT } from '@/i18n/messages';
import type { CompatSide } from '@/reading/compat';
import { dailyBand } from './DailyCard';

/** Both canonical logins, lowercased, sorted and joined, so both URL orders show the same variants. */
export function compatVariantSeed(a: CompatSide, b: CompatSide): string {
  return [a.profile.login, b.profile.login].map((l) => l.toLowerCase()).sort().join('|');
}

export function displayName(side: CompatSide): string {
  return side.profile.name ?? side.profile.login;
}

/** `compat.band.*` text with the score and both display names (URL order). */
export function compatBandText(locale: string, a: CompatSide, b: CompatSide, result: Compatibility): string {
  const t = createT(locale, compatVariantSeed(a, b));
  return t(`compat.band.${dailyBand(result.score)}`, { a: displayName(a), b: displayName(b), score: result.score });
}

/** `compat.flow.*` text: who writes and who reviews (or both names for a same-element pair). */
export function compatFlowText(locale: string, a: CompatSide, b: CompatSide, result: Compatibility): string {
  const t = createT(locale, compatVariantSeed(a, b));
  const names = { a: displayName(a), b: displayName(b) };
  const giver = result.giver === 'a' ? names.a : names.b;
  const receiver = result.giver === 'a' ? names.b : names.a;
  return t(`compat.flow.${result.flow}`, result.flow === 'same' ? names : { giver, receiver });
}
