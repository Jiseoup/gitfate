import { test, expect, vi } from 'vitest';

vi.mock('@/i18n/generated', () => ({
  MESSAGES: {
    ko: {
      ui: { hello: '안녕 {{name}}', only: '한국어만' },
      daily: { pick: ['A {{n}}', 'B {{n}}', 'C {{n}}'] },
    },
    en: {
      ui: {
        hello: 'Hi {{name}}',
        count_one: '{{count}} commit',
        count_other: '{{count}} commits',
      },
    },
  },
}));

import { createT } from '@/i18n/messages';
import { negotiateLocale, isSupportedLocale } from '@/i18n/config';

test('interpolation and fallback chain', () => {
  const t = createT('ko');
  expect(t('ui.hello', { name: '지섭' })).toBe('안녕 지섭');
  expect(t('ui.count', { count: 1 })).toBe('1 commit');
  expect(t('ui.missing')).toBe('ui.missing');
  expect(createT('ja')('ui.hello', { name: 'x' })).toBe('Hi x');
});

test('plural and deterministic variant', () => {
  expect(createT('en')('ui.count', { count: 3 })).toBe('3 commits');
  const a = createT('ko', 'jiseoup|2026-10-27')('daily.pick', { n: 1 });
  expect(createT('ko', 'jiseoup|2026-10-27')('daily.pick', { n: 1 })).toBe(a);
  expect(['A 1', 'B 1', 'C 1']).toContain(a);
});

test('has and list', () => {
  const t = createT('ko');
  expect(t.has('ui.only')).toBe(true);
  expect(t.has('ui.count')).toBe(true); // plural forms exist in en
  expect(t.has('ui.nope')).toBe(false);
  expect(t.list('daily.pick')).toEqual(['A {{n}}', 'B {{n}}', 'C {{n}}']);
  expect(t.list('ui.only')).toEqual(['한국어만']);
  expect(t.list('ui.nope')).toEqual([]);
});

test('unknown vars keep their placeholder', () => {
  expect(createT('ko')('ui.hello')).toBe('안녕 {{name}}');
});

test('negotiate', () => {
  expect(negotiateLocale('ko-KR,ko;q=0.9,en;q=0.8')).toBe('ko');
  expect(negotiateLocale('fr-FR,fr;q=0.9')).toBe('en');
  expect(negotiateLocale(null)).toBe('en');
  expect(negotiateLocale('en;q=0.5,ko;q=0.9')).toBe('ko');
  expect(isSupportedLocale('ko')).toBe(true);
  expect(isSupportedLocale('xx')).toBe(false);
});
