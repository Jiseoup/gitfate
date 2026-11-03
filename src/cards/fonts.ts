import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { isValidElement, type ReactNode } from 'react';

export interface CardFont {
  name: string;
  data: Buffer;
  weight: 400 | 700;
  style: 'normal';
}

const KR = 'Noto Sans KR';

/** Every string a card renders, in order, walking through function components (cards use no hooks). */
export function cardText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number' || typeof node === 'bigint') return String(node);
  if (Array.isArray(node)) return node.map(cardText).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) {
    const { type, props } = node;
    if (typeof type === 'function') return cardText((type as (p: typeof props) => ReactNode)(props));
    return cardText(props.children);
  }
  return '';
}

async function readFonts(): Promise<CardFont[]> {
  // Literal paths so the build traces both files into the card function.
  const [regular, bold] = await Promise.all([
    readFile(join(process.cwd(), 'assets/fonts/NotoSansKR-400.ttf')),
    readFile(join(process.cwd(), 'assets/fonts/NotoSansKR-700.ttf')),
  ]);
  return [
    { name: KR, data: regular, weight: 400, style: 'normal' },
    { name: KR, data: bold, weight: 700, style: 'normal' },
  ];
}

let loaded: Promise<CardFont[]> | null = null;

/**
 * Noto Sans KR 400 and 700 from assets/fonts (built by scripts/build-card-fonts.py: common Hangul, Latin and every
 * character in locales/), read once per server instance. Every call returns the same array, because the renderer
 * caches parsed fonts by array identity. Characters outside the set (rare Hangul, hanja, kana) are fetched by the
 * renderer itself. If the files can't be read, this logs, returns [] and tries again on the next card.
 */
export async function loadCardFonts(): Promise<CardFont[]> {
  loaded ??= readFonts();
  try {
    return await loaded;
  } catch (e) {
    loaded = null;
    console.error(`[gitfate] card fonts failed: ${e instanceof Error ? e.message : String(e)}`);
    return [];
  }
}
