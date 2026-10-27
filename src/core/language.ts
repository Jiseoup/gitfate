import overridesData from '../../data/language-element-overrides.json';
import type { NatalChart } from './chart';
import { hashSeed } from './seed';
import { ELEMENTS, type Element } from './types';

export interface LanguageBytes {
  name: string;
  color: string | null;
  bytes: number;
}

export const EXCLUDED_LANGUAGES: readonly string[] = [
  'HTML',
  'CSS',
  'SCSS',
  'Sass',
  'Less',
  'Stylus',
  'Markdown',
  'MDX',
  'JSON',
  'JSON5',
  'YAML',
  'TOML',
  'XML',
  'CSV',
  'Text',
];

export const REPRESENTATIVE_LANGUAGE: Record<Element, string> = {
  wood: 'C#',
  fire: 'Rust',
  earth: 'JavaScript',
  metal: 'C',
  water: 'Python',
};

const DEFAULT_OVERRIDES = overridesData as Record<string, Element>;

/** Maps a `#RRGGBB` / `#RGB` color to an element by its hue. Throws on unparseable input. */
export function colorToElement(hex: string): Element {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`Invalid color: ${hex}`);
  const digits = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1];
  const r = parseInt(digits.slice(0, 2), 16) / 255;
  const g = parseInt(digits.slice(2, 4), 16) / 255;
  const b = parseInt(digits.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }

  if (s < 0.2 || l > 0.9) return 'metal';
  if (l < 0.15) return 'water';
  if (h >= 300 || h < 25) return 'fire';
  if (h < 70) return 'earth';
  if (h < 170) return 'wood';
  if (h < 260) return 'water';
  return 'metal';
}

export function languageElement(
  name: string,
  color: string | null,
  overrides: Record<string, Element> = DEFAULT_OVERRIDES,
): Element {
  const override = overrides[name];
  if (override) return override;
  if (color) {
    try {
      return colorToElement(color);
    } catch {
      // fall through to the hash fallback
    }
  }
  return ELEMENTS[hashSeed('lang', name) % 5];
}

export interface LanguageProfile {
  total: number;
  shares: Record<Element, number>;
  topLanguages: { name: string; element: Element; share: number }[];
}

export function languageProfile(
  langs: LanguageBytes[],
  overrides: Record<string, Element> = DEFAULT_OVERRIDES,
): LanguageProfile {
  const merged = new Map<string, { color: string | null; bytes: number }>();
  for (const { name, color, bytes } of langs) {
    if (EXCLUDED_LANGUAGES.includes(name)) continue;
    const entry = merged.get(name);
    if (entry) {
      entry.bytes += bytes;
      entry.color ??= color;
    } else {
      merged.set(name, { color, bytes });
    }
  }

  const total = [...merged.values()].reduce((sum, l) => sum + l.bytes, 0);
  const shares: Record<Element, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  const topLanguages = [...merged.entries()]
    .map(([name, { color, bytes }]) => ({
      name,
      element: languageElement(name, color, overrides),
      bytes,
    }))
    .sort((a, b) => b.bytes - a.bytes)
    .map(({ name, element, bytes }) => ({ name, element, share: total > 0 ? bytes / total : 0 }));

  for (const l of topLanguages) shares[l.element] += l.share;
  return { total, shares, topLanguages };
}

export type LanguageDiagnosis = 'compensating' | 'alsoMissing' | 'noData';

export function diagnoseLanguages(
  chart: NatalChart,
  profile: LanguageProfile,
): { diagnosis: LanguageDiagnosis; targetElement: Element; luckyLanguage: string } {
  const targetElement = chart.weakest[0];
  const representative = REPRESENTATIVE_LANGUAGE[targetElement];
  if (profile.total === 0) {
    return { diagnosis: 'noData', targetElement, luckyLanguage: representative };
  }
  if (profile.shares[targetElement] >= 0.15) {
    const top = profile.topLanguages.find((l) => l.element === targetElement);
    return { diagnosis: 'compensating', targetElement, luckyLanguage: top?.name ?? representative };
  }
  return { diagnosis: 'alsoMissing', targetElement, luckyLanguage: representative };
}
