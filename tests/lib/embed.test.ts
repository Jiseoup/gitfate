import { expect, test } from 'vitest';
import { embedSnippet } from '@/lib/embed';

const base = { origin: 'https://gitfate.vercel.app', type: 'daily', locale: 'ko', login: 'Jiseoup' } as const;

test('a fixed theme is a Markdown image linking to the reading page; the default theme adds no query', () => {
  expect(embedSnippet({ ...base, theme: 'light' })).toBe(
    '[![gitfate](https://gitfate.vercel.app/api/card/daily/ko/Jiseoup.png)](https://gitfate.vercel.app/ko/Jiseoup)',
  );
  expect(embedSnippet({ ...base, theme: 'dark' })).toBe(
    '[![gitfate](https://gitfate.vercel.app/api/card/daily/ko/Jiseoup.png?theme=dark)](https://gitfate.vercel.app/ko/Jiseoup)',
  );
});

test('auto switches between the GitHub light and dark cards with <picture>', () => {
  expect(embedSnippet({ ...base, type: 'natal', locale: 'en', theme: 'auto' })).toBe(
    [
      '<a href="https://gitfate.vercel.app/en/Jiseoup">',
      '  <picture>',
      '    <source media="(prefers-color-scheme: dark)" srcset="https://gitfate.vercel.app/api/card/natal/en/Jiseoup.png?theme=github-dark">',
      '    <img alt="gitfate" src="https://gitfate.vercel.app/api/card/natal/en/Jiseoup.png?theme=github-light">',
      '  </picture>',
      '</a>',
    ].join('\n'),
  );
});

test('a chosen time zone carries over to both the card and the page link', () => {
  expect(embedSnippet({ ...base, theme: 'github-dark', tz: 'Europe/Berlin' })).toBe(
    '[![gitfate](https://gitfate.vercel.app/api/card/daily/ko/Jiseoup.png?tz=Europe%2FBerlin&theme=github-dark)](https://gitfate.vercel.app/ko/Jiseoup?tz=Europe%2FBerlin)',
  );
});
