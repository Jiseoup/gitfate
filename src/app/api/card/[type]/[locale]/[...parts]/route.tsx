import { ImageResponse } from 'next/og';
import type { ReactElement } from 'react';
import { loadAvatar } from '@/cards/avatar';
import { CompatCard } from '@/cards/CompatCard';
import { DailyCard } from '@/cards/DailyCard';
import { cardText, loadCardFonts } from '@/cards/fonts';
import { CARD_SIZE } from '@/cards/Frame';
import { NatalCard } from '@/cards/NatalCard';
import { YearlyCard } from '@/cards/YearlyCard';
import { secondsUntilNextMidnight, type TzSpec } from '@/core/time';
import { isSupportedLocale } from '@/i18n/config';
import type { CardType } from '@/lib/card-url';
import { isValidLogin } from '@/lib/login';
import { buildCompatReading } from '@/reading/compat';
import { buildUserReading } from '@/reading/user';

// CJK fonts and the PNG encoder need the Node.js runtime.
export const runtime = 'nodejs';

const CARD_TYPES: readonly CardType[] = ['natal', 'daily', 'yearly', 'compat'];
const AVATAR_SIZE = 160;
const MIN_MAX_AGE = 60;
const DEGRADED_MAX_AGE = 60;

type Failure = 'invalid' | 'not-found' | 'blocked' | 'unavailable';

function error(status: 404 | 503): Response {
  return new Response(status === 404 ? 'Not found' : 'Service unavailable', {
    status,
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function failure(status: Failure): Response {
  return error(status === 'unavailable' ? 503 : 404);
}

function isCardType(x: string): x is CardType {
  return (CARD_TYPES as readonly string[]).includes(x);
}

/** `[login].png` (compat: `[a]/[b].png`) → the logins, or `null` for any other shape. */
function parseLogins(type: CardType, parts: string[]): string[] | null {
  const count = type === 'compat' ? 2 : 1;
  if (parts.length !== count || !parts[count - 1].endsWith('.png')) return null;
  const logins = [...parts.slice(0, -1), parts[count - 1].slice(0, -'.png'.length)];
  return logins.every(isValidLogin) ? logins : null;
}

/**
 * CDN-cache until the card's date changes: the next midnight in the reading's time zone (the earliest of two).
 * Daily cards expire exactly then (no stale-while-revalidate). A degraded reading (GitHub could not answer
 * fully) may differ from the page once GitHub recovers, so it is cached only briefly.
 */
function cacheControl(now: Date, zones: TzSpec[], opts: { type: CardType; degraded: boolean }): string {
  if (opts.degraded) return `public, s-maxage=${DEGRADED_MAX_AGE}`;
  const seconds = Math.max(MIN_MAX_AGE, Math.min(...zones.map((tz) => secondsUntilNextMidnight(now, tz))));
  return opts.type === 'daily' ? `public, s-maxage=${seconds}` : `public, s-maxage=${seconds}, stale-while-revalidate=3600`;
}

async function png(element: ReactElement, cache: string): Promise<Response> {
  const fonts = await loadCardFonts(cardText(element));
  return new ImageResponse(element, {
    ...CARD_SIZE,
    // With no fonts loaded, leave `fonts` unset so the renderer falls back to its own fonts.
    fonts: fonts.length > 0 ? fonts.map((f) => ({ ...f, style: 'normal' as const })) : undefined,
    headers: { 'cache-control': cache },
  });
}

export async function GET(request: Request, ctx: RouteContext<'/api/card/[type]/[locale]/[...parts]'>) {
  const { type, locale, parts } = await ctx.params;
  if (!isCardType(type) || !isSupportedLocale(locale)) return error(404);
  const logins = parseLogins(type, parts);
  if (!logins) return error(404);
  const query = new URL(request.url).searchParams;
  const now = new Date();

  if (type === 'compat') {
    const r = await buildCompatReading(logins[0], logins[1], { tzA: query.get('tzA'), tzB: query.get('tzB'), now });
    if (r.status !== 'ok') return failure(r.status);
    const avatars = await Promise.all([
      loadAvatar(r.a.profile.avatarUrl, AVATAR_SIZE),
      loadAvatar(r.b.profile.avatarUrl, AVATAR_SIZE),
    ]);
    return png(
      <CompatCard r={r} locale={locale} avatars={avatars} />,
      cacheControl(now, [r.a.tz.tz, r.b.tz.tz], { type, degraded: r.degraded }),
    );
  }

  const r = await buildUserReading(logins[0], { tzParam: query.get('tz'), now });
  if (r.status !== 'ok') return failure(r.status);
  const avatar = await loadAvatar(r.profile.avatarUrl, AVATAR_SIZE);
  const Card = { natal: NatalCard, daily: DailyCard, yearly: YearlyCard }[type];
  return png(<Card r={r} locale={locale} avatar={avatar} />, cacheControl(now, [r.tz.tz], { type, degraded: r.degraded }));
}
