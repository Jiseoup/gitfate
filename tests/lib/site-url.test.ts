import { afterEach, expect, test, vi } from 'vitest';
import { siteUrl } from '@/lib/site-url';

afterEach(() => {
  vi.unstubAllEnvs();
});

test('SITE_URL wins, then the Vercel production host, then localhost', () => {
  vi.stubEnv('SITE_URL', 'https://gitfate.example');
  vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'gitfate.vercel.app');
  expect(siteUrl().href).toBe('https://gitfate.example/');
  vi.stubEnv('SITE_URL', '');
  expect(siteUrl().href).toBe('https://gitfate.vercel.app/');
  vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', '');
  expect(siteUrl().href).toBe('http://localhost:3000/');
});

test('SITE_URL without a scheme gets https://', () => {
  vi.stubEnv('SITE_URL', 'gitfate.example');
  expect(siteUrl().href).toBe('https://gitfate.example/');
  vi.stubEnv('SITE_URL', 'http://localhost:4000');
  expect(siteUrl().href).toBe('http://localhost:4000/');
});

test('an invalid SITE_URL warns once and falls back to the next rule instead of throwing', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.stubEnv('SITE_URL', 'not a url');
  vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'gitfate.vercel.app');
  expect(siteUrl().href).toBe('https://gitfate.vercel.app/');
  vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', '');
  expect(siteUrl().href).toBe('http://localhost:3000/');
  expect(warn).toHaveBeenCalledTimes(1);
  expect(String(warn.mock.calls[0][0])).toContain('SITE_URL');
  warn.mockRestore();
});

test('the locale layout sets metadataBase so relative OG image URLs resolve', async () => {
  vi.stubEnv('SITE_URL', 'https://gitfate.example');
  const { generateMetadata } = await import('@/app/[locale]/layout');
  const meta = await generateMetadata({ params: Promise.resolve({ locale: 'ko' }) } as Parameters<typeof generateMetadata>[0]);
  expect(String(meta.metadataBase)).toBe('https://gitfate.example/');
});
