import type { MESSAGES } from '../src/i18n/generated';

const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/;
const PLACEHOLDER = /\{\{\s*(\w+)\s*\}\}/g;

type Entry = { vars: Set<string> };

function varsOf(text: string): string[] {
  return [...text.matchAll(PLACEHOLDER)].map((m) => m[1]);
}

/** Flatten a namespace tree into `ns.path` -> placeholder names. Plural forms share one stem. */
function flatten(node: unknown, prefix: string, out: Map<string, Entry>): void {
  if (typeof node === 'string' || Array.isArray(node)) {
    const stem = prefix.replace(PLURAL_SUFFIX, '');
    const entry = out.get(stem) ?? { vars: new Set<string>() };
    const texts = Array.isArray(node) ? node : [node];
    for (const text of texts) {
      if (typeof text === 'string') varsOf(text).forEach((v) => entry.vars.add(v));
    }
    out.set(stem, entry);
    return;
  }
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      flatten(v, prefix ? `${prefix}.${k}` : k, out);
    }
  }
}

function flattenLocale(messages: unknown): Map<string, Entry> {
  const out = new Map<string, Entry>();
  flatten(messages, '', out);
  return out;
}

export function checkLocales(
  messages: typeof MESSAGES,
  base = 'ko',
): { warnings: string[]; errors: string[] } {
  const warnings: string[] = [];
  const errors: string[] = [];
  const baseKeys = flattenLocale(messages[base]);

  for (const locale of Object.keys(messages)) {
    if (locale === base) continue;
    const keys = flattenLocale(messages[locale]);
    for (const [key, entry] of keys) {
      const baseEntry = baseKeys.get(key);
      if (!baseEntry) {
        warnings.push(`${locale}: unused ${key}`);
        continue;
      }
      for (const v of entry.vars) {
        if (!baseEntry.vars.has(v)) errors.push(`${locale}: ${key} uses {{${v}}} not in base`);
      }
    }
    for (const key of baseKeys.keys()) {
      if (!keys.has(key)) warnings.push(`${locale}: missing ${key}`);
    }
  }
  return { warnings, errors };
}

async function main(): Promise<void> {
  const { MESSAGES: messages } = await import('../src/i18n/generated');
  const { warnings, errors } = checkLocales(messages);
  for (const w of warnings) console.warn(`warning: ${w}`);
  for (const e of errors) console.error(`error: ${e}`);
  console.log(`check:locales: ${errors.length} error(s), ${warnings.length} warning(s)`);
  if (errors.length > 0) process.exit(1);
}

if (/check-locales\.[cm]?[jt]s$/.test(process.argv[1] ?? '')) {
  void main();
}
