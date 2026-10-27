import { expect, test } from 'vitest';
import { cardPath, parseCardTheme } from '@/lib/card-url';

test('card paths for single-user and compat cards, with optional query', () => {
  expect(cardPath('natal', 'ko', ['JiSeoup'])).toBe('/api/card/natal/ko/JiSeoup.png');
  expect(cardPath('daily', 'en', ['jiseoup'], { tz: 'Asia/Seoul' })).toBe('/api/card/daily/en/jiseoup.png?tz=Asia%2FSeoul');
  expect(cardPath('compat', 'ko', ['a', 'b'], { tzA: 'Europe/Berlin', tzB: 'UTC' })).toBe(
    '/api/card/compat/ko/a/b.png?tzA=Europe%2FBerlin&tzB=UTC',
  );
  expect(cardPath('yearly', 'en', ['x'], {})).toBe('/api/card/yearly/en/x.png');
});

test('?theme= values: known names pass, anything else is the default', () => {
  expect(parseCardTheme('github-dark')).toBe('github-dark');
  expect(parseCardTheme('dark')).toBe('dark');
  expect(parseCardTheme('neon')).toBe('light');
  expect(parseCardTheme('')).toBe('light');
  expect(parseCardTheme(null)).toBe('light');
});
