import { test, expect } from 'vitest';
import { checkLocales } from '../../scripts/check-locales';

test('missing keys warn, placeholder mismatch errors', () => {
  const r = checkLocales({
    ko: { ui: { a: '{{x}}', b: 'b' }, daily: { v: ['{{n}}', '{{n}}!'] } },
    en: { ui: { a: '{{y}}', c: 'c' }, daily: { v: ['{{n}}'] } },
  } as never);
  expect(r.errors).toEqual(['en: ui.a uses {{y}} not in base']);
  expect(r.warnings).toEqual(expect.arrayContaining(['en: missing ui.b', 'en: unused ui.c']));
});

test('plural forms count as the same key', () => {
  const r = checkLocales({
    ko: { ui: { count_other: '{{count}}개' } },
    en: { ui: { count_one: '{{count}} item', count_other: '{{count}} items' } },
  } as never);
  expect(r.errors).toEqual([]);
  expect(r.warnings).toEqual([]);
});
