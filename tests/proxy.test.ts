import { describe, expect, test } from 'vitest';
import { NextRequest } from 'next/server';
import { getRedirectUrl, unstable_doesMiddlewareMatch } from 'next/experimental/testing/server';
// The docs name this unstable_doesProxyMatch, but the installed next only exports the Middleware name.
import { config, proxy } from '@/proxy';

function call(path: string, acceptLanguage?: string) {
  const headers = acceptLanguage ? { 'accept-language': acceptLanguage } : undefined;
  return proxy(new NextRequest(`http://localhost:3000${path}`, { headers }));
}

describe('proxy redirects', () => {
  test('/ goes to the negotiated locale (307)', () => {
    const res = call('/', 'ko-KR,ko;q=0.9');
    expect(res.status).toBe(307);
    expect(getRedirectUrl(res)).toBe('http://localhost:3000/ko');
  });

  test('/ without Accept-Language falls back to en', () => {
    expect(getRedirectUrl(call('/'))).toBe('http://localhost:3000/en');
  });

  test('/ keeps the query string', () => {
    expect(getRedirectUrl(call('/?utm=x', 'ko'))).toBe('http://localhost:3000/ko?utm=x');
  });

  test('unsupported locale-shaped first segment becomes en (307), keeping path and query', () => {
    const res = call('/fr/jiseoup?tz=Asia/Seoul', 'ko');
    expect(res.status).toBe(307);
    expect(getRedirectUrl(res)).toBe('http://localhost:3000/en/jiseoup?tz=Asia/Seoul');
    expect(getRedirectUrl(call('/en-US/a/vs/b'))).toBe('http://localhost:3000/en/a/vs/b');
    expect(getRedirectUrl(call('/fr'))).toBe('http://localhost:3000/en');
  });

  test.each(['/ko', '/en/torvalds', '/ko/a/vs/b', '/torvalds', '/api/card/natal/ko/x.png', '/_next/static/a.js', '/favicon.ico'])(
    'passes %s through',
    (path) => {
      const res = call(path);
      expect(res.headers.get('location')).toBeNull();
      expect(res.headers.get('x-middleware-next')).toBe('1');
    },
  );
});

describe('proxy matcher', () => {
  const runs = (url: string) => unstable_doesMiddlewareMatch({ config, url });

  test('runs on pages', () => {
    for (const url of ['/', '/ko', '/fr/jiseoup', '/en/a/vs/b']) expect(runs(url), url).toBe(true);
  });

  test('skips the card API, _next and files with an extension', () => {
    for (const url of ['/api/card/natal/ko/x.png', '/api/anything', '/_next/static/chunk.js', '/_next/image', '/favicon.ico', '/robots.txt']) {
      expect(runs(url), url).toBe(false);
    }
  });

  test('does not skip look-alike page paths', () => {
    expect(runs('/apple')).toBe(true);
    expect(runs('/ko/apiary')).toBe(true);
  });
});
