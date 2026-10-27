import { NextResponse, type NextRequest } from 'next/server';
import { DEFAULT_LOCALE, isSupportedLocale, negotiateLocale } from '@/i18n/config';

const LOCALE_SHAPE = /^[a-z]{2}(-[A-Z]{2})?$/;

/** `/` -> `/{negotiated locale}`; an unsupported locale-shaped first segment -> `en`. Everything else passes through. */
export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const [, first = '', ...rest] = url.pathname.split('/');

  if (first === '') {
    url.pathname = `/${negotiateLocale(request.headers.get('accept-language'))}`;
    const res = NextResponse.redirect(url, 307);
    res.headers.set('vary', 'accept-language');
    return res;
  }

  if (LOCALE_SHAPE.test(first) && !isSupportedLocale(first)) {
    url.pathname = `/${[DEFAULT_LOCALE, ...rest].join('/')}`;
    return NextResponse.redirect(url, 307);
  }

  return NextResponse.next();
}

// Skip /api (card images), /_next and anything with a file extension (favicon, static files).
export const config = {
  matcher: ['/((?!api(?:/|$)|_next(?:/|$)|.*\\..*).*)'],
};
