import { isValidElement, type ReactNode } from 'react';

export interface CardFont {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 700;
}

const FONT_REVALIDATE = 2592000;
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

/** Satori draws this when it clamps a line, so it must be in the subset even though no text contains it. */
const ELLIPSIS = '\u2026';

/** Distinct characters, sorted, so the same glyph set always makes the same (cached) request. */
function glyphSet(text: string): string {
  return [...new Set(Array.from(`${text.replace(/\s+/g, ' ')}${ELLIPSIS}`))].sort().join('');
}

async function fetchFont(family: string, weight: number, text: string): Promise<ArrayBuffer> {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=${family.replaceAll(' ', '+')}:wght@${weight}&text=${encodeURIComponent(text)}`,
    { next: { revalidate: FONT_REVALIDATE } },
  );
  if (!css.ok) throw new Error(`CSS ${css.status}`);
  const src = /src: url\(([^)]+)\) format\('(?:opentype|truetype)'\)/.exec(await css.text())?.[1];
  if (!src) throw new Error('no TrueType source in CSS');
  const font = await fetch(src, { next: { revalidate: FONT_REVALIDATE } });
  if (!font.ok) throw new Error(`font ${font.status}`);
  return font.arrayBuffer();
}

/**
 * Subset fonts with only the glyphs in `text`: Noto Sans KR 400 and 700. A font that fails to load is logged and left out; the card still renders with
 * whatever loaded (or, with nothing, the renderer's own fallback fonts).
 */
export async function loadCardFonts(text: string): Promise<CardFont[]> {
  const glyphs = glyphSet(text);
  const wanted: { name: string; weight: 400 | 700; text: string }[] = [
    { name: KR, weight: 400, text: glyphs },
    { name: KR, weight: 700, text: glyphs },
  ];
  const settled = await Promise.allSettled(wanted.map((f) => fetchFont(f.name, f.weight, f.text)));
  const fonts: CardFont[] = [];
  settled.forEach((result, i) => {
    const { name, weight } = wanted[i];
    if (result.status === 'fulfilled') fonts.push({ name, weight, data: result.value });
    else {
      const e = result.reason;
      console.error(`[gitfate] card font ${name} ${weight} failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  });
  return fonts;
}
