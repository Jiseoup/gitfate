/**
 * Deterministic seeding. Every bit of "randomness" in the app comes from here,
 * so the same input always gives the same result.
 */

const SEPARATOR = '\u001f';

/** FNV-1a 32-bit over UTF-16 code units of the parts joined by U+001F. */
export function hashSeed(...parts: string[]): number {
  const text = parts.join(SEPARATOR);
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** First value of mulberry32 seeded with `seed`, in [0, 1). */
function mulberry32First(seed: number): number {
  let t = (seed + 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Integer in [min, max] (both ends inclusive), fixed by `parts`. */
export function seededInt(min: number, max: number, ...parts: string[]): number {
  const u = mulberry32First(hashSeed(...parts));
  return min + Math.floor(u * (max - min + 1));
}
