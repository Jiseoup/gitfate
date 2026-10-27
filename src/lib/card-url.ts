export type CardType = 'natal' | 'daily' | 'yearly' | 'compat';

/** `/api/card/{type}/{locale}/{login}.png` (compat: `/{a}/{b}.png`), plus the query string when given. */
export function cardPath(
  type: CardType,
  locale: string,
  logins: string[],
  query?: Record<string, string>,
): string {
  const parts = logins.map(encodeURIComponent).join('/');
  const qs = query ? new URLSearchParams(query).toString() : '';
  return `/api/card/${type}/${encodeURIComponent(locale)}/${parts}.png${qs ? `?${qs}` : ''}`;
}

/** Share card color themes, picked with `?theme=`. `light` is the default and the Open Graph image. */
export const CARD_THEME_NAMES = ['light', 'dark', 'github-light', 'github-dark'] as const;
export type CardThemeName = (typeof CARD_THEME_NAMES)[number];
export const DEFAULT_CARD_THEME: CardThemeName = 'light';

/** `?theme=` value → a theme name; anything unknown (or missing) is the default. */
export function parseCardTheme(value: string | null | undefined): CardThemeName {
  return (CARD_THEME_NAMES as readonly string[]).includes(value ?? '') ? (value as CardThemeName) : DEFAULT_CARD_THEME;
}
