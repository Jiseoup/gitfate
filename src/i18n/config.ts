import index from '../../locales/index.json';

export const LOCALES = index as { code: string; name: string; status: 'stable' | 'partial' }[];

export const DEFAULT_LOCALE = 'en';

export function isSupportedLocale(x: string): boolean {
  return LOCALES.some((l) => l.code === x);
}

/** Pick the best supported locale from an Accept-Language header; falls back to DEFAULT_LOCALE. */
export function negotiateLocale(acceptLanguage: string | null): string {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const ranked = acceptLanguage
    .split(',')
    .map((part, order) => {
      const [tag, ...params] = part.trim().split(';');
      const q = params.map((p) => /^\s*q=([\d.]+)\s*$/.exec(p)?.[1]).find(Boolean);
      return { tag: tag.trim().toLowerCase(), q: q === undefined ? 1 : Number(q), order };
    })
    .filter((x) => x.tag && x.tag !== '*' && x.q > 0)
    .sort((a, b) => b.q - a.q || a.order - b.order);

  for (const { tag } of ranked) {
    const exact = LOCALES.find((l) => l.code.toLowerCase() === tag);
    if (exact) return exact.code;
    const primary = tag.split('-')[0];
    const match = LOCALES.find((l) => l.code.toLowerCase() === primary);
    if (match) return match.code;
  }
  return DEFAULT_LOCALE;
}
