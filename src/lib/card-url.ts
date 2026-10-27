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
