import { hashSeed } from '@/core/seed';
import { DEFAULT_LOCALE } from './config';
import { MESSAGES } from './generated';

export type Vars = Record<string, string | number>;

export interface T {
  (key: string, vars?: Vars): string;
  has(key: string): boolean;
  list(key: string): string[];
}

function lookup(locale: string, key: string): unknown {
  let node: unknown = MESSAGES[locale];
  for (const part of key.split('.')) {
    if (node === null || typeof node !== 'object') return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return node;
}

function isText(v: unknown): v is string | string[] {
  if (typeof v === 'string') return true;
  return Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === 'string');
}

function pluralCategory(locale: string, count: number): string {
  try {
    return new Intl.PluralRules(locale).select(count);
  } catch {
    return new Intl.PluralRules(DEFAULT_LOCALE).select(count);
  }
}

/** Find the raw message (string or variant list) for one locale, honoring plural forms. */
function resolve(locale: string, key: string, vars?: Vars): string | string[] | undefined {
  const count = vars?.count;
  if (typeof count === 'number') {
    for (const k of [`${key}_${pluralCategory(locale, count)}`, `${key}_other`]) {
      const v = lookup(locale, k);
      if (isText(v)) return v;
    }
  }
  const v = lookup(locale, key);
  return isText(v) ? v : undefined;
}

function chain(locale: string): string[] {
  return locale === DEFAULT_LOCALE ? [locale] : [locale, DEFAULT_LOCALE];
}

function interpolate(text: string, vars?: Vars): string {
  if (!vars) return text;
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (whole, name: string) =>
    name in vars ? String(vars[name]) : whole,
  );
}

export function createT(locale: string, variantSeed?: string): T {
  const find = (key: string, vars?: Vars) => {
    for (const l of chain(locale)) {
      const v = resolve(l, key, vars);
      if (v !== undefined) return v;
    }
    return undefined;
  };

  const t = ((key: string, vars?: Vars) => {
    const raw = find(key, vars);
    if (raw === undefined) return key;
    const text = Array.isArray(raw) ? raw[hashSeed(variantSeed ?? '', key) % raw.length] : raw;
    return interpolate(text, vars);
  }) as T;

  t.has = (key) => find(key) !== undefined || find(key, { count: 0 }) !== undefined;
  t.list = (key) => {
    const raw = find(key);
    if (raw === undefined) return [];
    return Array.isArray(raw) ? [...raw] : [raw];
  };
  return t;
}
