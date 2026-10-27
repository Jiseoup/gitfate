import { cardPath, type CardThemeName } from './card-url';

export type EmbedCardType = 'natal' | 'daily' | 'yearly';
/** A card theme, or `auto`: GitHub light or dark, following the README reader's color scheme. */
export type EmbedTheme = CardThemeName | 'auto';

export const EMBED_CARD_TYPES: readonly EmbedCardType[] = ['natal', 'daily', 'yearly'];
export const EMBED_THEMES: readonly EmbedTheme[] = ['auto', 'light', 'dark', 'github-light', 'github-dark'];

/** Absolute card URL for a README; the default theme is left out of the query. */
export function embedCardUrl(origin: string, type: EmbedCardType, locale: string, login: string, theme: CardThemeName, tz?: string): string {
  const query: Record<string, string> = {};
  if (tz) query.tz = tz;
  if (theme !== 'light') query.theme = theme;
  return origin + cardPath(type, locale, [login], Object.keys(query).length > 0 ? query : undefined);
}

/**
 * README code that shows the card and links to the reading page. `auto` uses `<picture>`, which GitHub
 * renders with the reader's light or dark scheme; a fixed theme is plain Markdown.
 */
export function embedSnippet(opts: {
  origin: string;
  type: EmbedCardType;
  locale: string;
  login: string;
  theme: EmbedTheme;
  tz?: string;
}): string {
  const { origin, type, locale, login, theme, tz } = opts;
  const page = `${origin}/${locale}/${login}${tz ? `?${new URLSearchParams({ tz })}` : ''}`;
  const url = (th: CardThemeName) => embedCardUrl(origin, type, locale, login, th, tz);
  if (theme !== 'auto') return `[![gitfate](${url(theme)})](${page})`;
  return [
    `<a href="${page}">`,
    '  <picture>',
    `    <source media="(prefers-color-scheme: dark)" srcset="${url('github-dark')}">`,
    `    <img alt="gitfate" src="${url('github-light')}">`,
    '  </picture>',
    '</a>',
  ].join('\n');
}
