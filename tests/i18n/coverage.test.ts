import { test, expect } from 'vitest';
import { createT } from '@/i18n/messages';
import { MESSAGES } from '@/i18n/generated';
import { BRANCHES, STEMS, branchZodiac } from '@/core/ganzhi';
import { ELEMENTS, type BranchRelation, type TenGod } from '@/core/types';
import { SUPPORTED_YIJI, type StarKey } from '@/core/daily';
import type { TzSource } from '@/core/timezone';
import type { LanguageDiagnosis } from '@/core/language';
import type { RealityKind } from '@/core/yearly';

const LOCALES = ['ko', 'en'];

const DISCLAIMER: Record<string, string> = {
  ko: '재미로 보는 운세입니다. 개발 실력과는 아무 관련이 없어요.',
  en: 'Just for fun. It says nothing about your skills as a developer.',
};

// `satisfies Record<Union, true>` makes the compiler reject a missing or misspelled member.
const TEN_GODS = Object.keys({
  bijian: true, jiecai: true, shishen: true, shangguan: true, piancai: true,
  zhengcai: true, qisha: true, zhengguan: true, pianyin: true, zhengyin: true,
} satisfies Record<TenGod, true>);
const RELATIONS = Object.keys({
  liuhe: true, sanhe: true, chong: true, xing: true, none: true,
} satisfies Record<BranchRelation, true>);
const STAR_KEYS = Object.keys({
  deploy: true, debug: true, review: true, merge: true,
} satisfies Record<StarKey, true>);
const TZ_SOURCES = Object.keys({
  param: true, 'early-commits': true, 'recent-commits': true, location: true, default: true,
} satisfies Record<TzSource, true>);
const DIAGNOSES = Object.keys({
  compensating: true, alsoMissing: true, noData: true,
} satisfies Record<LanguageDiagnosis, true>);
const REALITY_KINDS = Object.keys({
  up: true, down: true, flat: true, none: true,
} satisfies Record<RealityKind, true>);
const ZODIACS = BRANCHES.map(branchZodiac);
const BANDS = ['0', '1', '2', '3', '4'];

/** One schema key: a plain string (no `min`) or a variant list with at least `min` entries. */
interface Spec {
  key: string;
  min?: number;
  vars?: string[];
}

const one = (key: string, vars: string[] = []): Spec => ({ key, vars });
const many = (key: string, min: number, vars: string[] = []): Spec => ({ key, min, vars });

const SPECS: Spec[] = [
  one('meta.serviceName'),
  one('meta.tagline'),

  ...STEMS.map((s) => one(`terms.stem.${s}`)),
  ...STEMS.map((s) => one(`terms.sign.${s}`)),
  ...BRANCHES.map((b) => one(`terms.branch.${b}`)),
  ...ELEMENTS.map((e) => one(`terms.element.${e}`)),
  ...TEN_GODS.map((g) => one(`terms.tenGod.${g}`)),
  ...TEN_GODS.map((g) => one(`terms.tenGodSaju.${g}`)),
  ...ZODIACS.map((z) => one(`terms.zodiac.${z}`)),
  ...ELEMENTS.map((e) => one(`terms.zodiacColor.${e}`)),
  ...ZODIACS.map((z) => one(`terms.animal.${z}`)),
  one('terms.pillarName', ['color', 'animal']),
  ...['year', 'month', 'day', 'hour'].map((p) => one(`terms.pillar.${p}`)),
  ...['saju', 'sign', 'tenGod', 'elements', 'ipchun'].map((k) => one(`terms.tooltip.${k}`)),

  one('ui.nav.home'),
  one('ui.home.inputLabel'),
  one('ui.home.submit'),
  ...['natal', 'daily', 'yearly', 'compat'].map((s) => one(`ui.section.${s}`)),
  ...TZ_SOURCES.map((s) => one(`ui.tz.source.${s}`, ['label'])),
  one('ui.tz.change'),
  one('ui.tz.suggest', ['location']),
  ...['copy', 'copied', 'download', 'x'].map((k) => one(`ui.share.${k}`)),
  ...['notFound', 'blocked', 'rateLimited', 'activityUnavailable', 'invalidLogin'].map((k) =>
    one(`ui.error.${k}`),
  ),
  one('ui.compat.placeholder'),
  one('ui.compat.cta'),
  ...STAR_KEYS.map((k) => one(`ui.stars.${k}`)),
  one('ui.yiji.do'),
  one('ui.yiji.dont'),
  one('ui.almanac.header'),
  one('ui.role.today'),
  one('ui.role.year'),
  ...['color', 'language', 'hour', 'item'].map((k) => one(`ui.lucky.${k}`)),
  one('ui.lucky.hourName', ['animal']),
  one('ui.month.label', ['month', 'start', 'end']),
  one('ui.disclaimer'),
  one('ui.born', ['datetime', 'label']),
  one('ui.joined', ['date']),
  one('ui.githubAge', ['age']),

  one('natal.headline', ['name', 'sign']),
  ...STEMS.flatMap((s) => [
    one(`natal.archetype.${s}.name`),
    many(`natal.archetype.${s}.desc`, 3, ['name']),
  ]),
  many('natal.elements.strongest', 2, ['element']),
  many('natal.elements.missing', 2, ['element']),
  ...DIAGNOSES.map((d) => many(`natal.language.${d}`, 3, ['element', 'language'])),

  ...TEN_GODS.map((g) => many(`daily.tenGod.${g}`, 5, ['name'])),
  ...RELATIONS.map((r) => many(`daily.branch.${r}`, 2)),
  ...BANDS.map((b) => many(`daily.band.${b}`, 2)),
  many('daily.meme', 20),
  many('daily.firstCommit', 2),

  one('yearly.title', ['year', 'sign', 'start']),
  ...TEN_GODS.map((g) => many(`yearly.theme.${g}`, 3)),
  ...RELATIONS.map((r) => many(`yearly.branch.${r}`, 2)),
  ...REALITY_KINDS.map((k) => many(`yearly.reality.${k}`, 2, ['pct'])),

  ...BANDS.map((b) => many(`compat.band.${b}`, 3, ['a', 'b', 'score'])),
  many('compat.flow.generate', 2, ['giver', 'receiver']),
  many('compat.flow.control', 2, ['giver', 'receiver']),
  many('compat.flow.same', 2, ['a', 'b']),
  ...['pair', 'review', 'incident'].map((k) => one(`compat.sub.${k}`)),
  one('compat.shared.some', ['languages']),
  one('compat.shared.none'),

  ...SUPPORTED_YIJI.map((y) => one(`yiji.${y}`)),
];

/** The raw value in this locale only — no fallback to another language. */
function own(locale: string, key: string): unknown {
  let node: unknown = MESSAGES[locale];
  for (const part of key.split('.')) {
    if (node === null || typeof node !== 'object') return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return node;
}

function placeholders(text: string): string[] {
  return [...text.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1]);
}

test('the schema covers every yiji original and union member', () => {
  expect(SUPPORTED_YIJI.length).toBeGreaterThanOrEqual(40);
  expect(ZODIACS).toHaveLength(12);
});

for (const locale of LOCALES) {
  test(`${locale}: every schema key exists in the locale itself`, () => {
    const t = createT(locale);
    const missing = SPECS.filter(({ key }) => !t.has(key) || own(locale, key) === undefined);
    expect(missing.map((s) => s.key)).toEqual([]);
  });

  test(`${locale}: strings are strings, variant lists meet their minimum`, () => {
    const t = createT(locale);
    const wrong = SPECS.filter(({ key, min }) => {
      const raw = own(locale, key);
      if (min === undefined) return typeof raw !== 'string' || raw.trim() === '';
      return !Array.isArray(raw) || t.list(key).length < min;
    });
    expect(wrong.map((s) => s.key)).toEqual([]);
  });

  test(`${locale}: texts use only the variables the schema allows`, () => {
    const t = createT(locale);
    const bad = SPECS.flatMap(({ key, vars = [] }) =>
      t
        .list(key)
        .flatMap(placeholders)
        .filter((v) => !vars.includes(v))
        .map((v) => `${key} {{${v}}}`),
    );
    expect(bad).toEqual([]);
  });

  test(`${locale}: disclaimer is the exact global-constraints sentence`, () => {
    expect(createT(locale)('ui.disclaimer')).toBe(DISCLAIMER[locale]);
  });
}

test('key terms and yiji examples keep their agreed wording', () => {
  const ko = createT('ko');
  const en = createT('en');
  expect(ko('meta.serviceName')).toBe('gitfate');
  expect(en('meta.serviceName')).toBe('gitfate');
  expect(ko('meta.tagline')).toBe('깃허브 가입 시각으로 보는 개발자 사주');
  expect(en('meta.tagline')).toBe('Your dev destiny, read from your GitHub birthday.');
  expect(ko('terms.stem.辛')).toBe('신금');
  expect(en('terms.stem.辛')).toBe('Yin Metal');
  expect(ko('terms.pillarName', { color: ko('terms.zodiacColor.metal'), animal: ko('terms.animal.pig') })).toBe('흰 돼지');
  expect(en('terms.pillarName', { color: en('terms.zodiacColor.metal'), animal: en('terms.animal.pig') })).toBe('White Pig');
  expect(ELEMENTS.map((e) => ko(`terms.zodiacColor.${e}`))).toEqual([
    '푸른', '붉은', '누런', '흰', '검은',
  ]);
  expect(ko('yiji.嫁娶')).toBe('머지하기');
  expect(en('yiji.嫁娶')).toBe('Merging');
  expect(ko('yiji.开市')).toBe('배포·런칭');
  expect(en('yiji.开市')).toBe('Launch & deploy');
  expect(ko('yiji.安葬')).toBe('레거시 코드 장례식');
  expect(en('yiji.安葬')).toBe('Burying legacy code');
  expect(ko('yiji.动土')).toBe('새 레포 파기');
  expect(en('yiji.动土')).toBe('Breaking ground on a new repo');
  expect(ko('yiji.馀事勿取')).toBe('그 외엔 아무것도 하지 마세요');
  expect(en('yiji.馀事勿取')).toBe('Do nothing else. Seriously.');
});

test('Dev Sign names, one-liners and roles keep their agreed wording', () => {
  const ko = createT('ko');
  const en = createT('en');
  expect(STEMS.map((s) => ko(`terms.sign.${s}`))).toEqual([
    '거목', '넝쿨', '태양', '촛불', '산', '텃밭', '칼날', '보석', '바다', '빗방울',
  ]);
  expect(STEMS.map((s) => en(`terms.sign.${s}`))).toEqual([
    'The Oak', 'The Vine', 'The Sun', 'The Candle', 'The Mountain',
    'The Garden', 'The Blade', 'The Jewel', 'The Ocean', 'The Rain',
  ]);
  expect(ko('natal.archetype.辛.name')).toBe('아무도 못 본 오타를 찾아내는 세공사');
  expect(en('natal.archetype.辛.name')).toBe('Polishes until it sparkles');
  expect(ko('natal.archetype.戊.name')).toBe('프로덕션의 모놀리스처럼 흔들림 없는 사람');
  expect(ko('natal.headline', { name: 'Linus', sign: ko('terms.sign.辛') })).toBe('Linus님은 「보석」 개발자');
  expect(en('natal.headline', { name: 'Linus', sign: en('terms.sign.辛') })).toBe('Linus is The Jewel');
  expect(TEN_GODS.map((g) => en(`terms.tenGod.${g}`))).toEqual([
    'The Pair Programmer', 'The Merge Conflict', 'The README Bard', 'The Sharp Reviewer',
    'The Side-Project Explorer', 'The Steady Committer', 'The Incident Commander',
    'The Test Guardian', 'The Tech Scout', 'The Lifelong Learner',
  ]);
  expect(ko('terms.tenGod.qisha')).toBe('장애 대응 사령관');
  // The traditional names survive only as hover/secondary text.
  expect(ko('terms.tenGodSaju.qisha')).toBe('편관');
  expect(en('terms.tenGodSaju.qisha')).toBe('Seven Killings');
  expect(ko('ui.almanac.header')).toBe('고대 달력 가라사대');
  expect(en('ui.almanac.header')).toBe('The ancient almanac says');
});

const HAN = /\p{Script=Han}/u;

function strings(node: unknown, prefix = ''): [string, string][] {
  if (typeof node === 'string') return [[prefix, node]];
  if (Array.isArray(node)) return node.flatMap((v, i) => strings(v, `${prefix}[${i}]`));
  if (node && typeof node === 'object') {
    return Object.entries(node).flatMap(([k, v]) => strings(v, prefix ? `${prefix}.${k}` : k));
  }
  return [];
}

for (const locale of LOCALES) {
  test(`${locale}: no value carries hanja (they live only in keys such as terms.sign.辛 and yiji.嫁娶)`, () => {
    const withHan = strings(MESSAGES[locale])
      .filter(([, text]) => HAN.test(text))
      .map(([key]) => key);
    expect(withHan).toEqual([]);
  });
}

test('en: no value says "saju" (English says horoscope or almanac)', () => {
  const withSaju = strings(MESSAGES.en)
    .filter(([, text]) => /saju/i.test(text))
    .map(([key]) => key);
  expect(withSaju).toEqual([]);
});
