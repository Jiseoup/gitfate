import { locationToIana } from './location';
import { isValidIana, tzOffsetMinutes, UTC, type TzSpec } from './time';

export type TzSource = 'param' | 'early-commits' | 'recent-commits' | 'location' | 'default';

export interface ResolvedTz {
  tz: TzSpec;
  source: TzSource;
  suggestion: { iana: string; location: string } | null;
}

const DATE_LINE = /^Date: .* ([+-])(\d{2})(\d{2})$/;

/** Reads only the header (up to the first blank line) and returns just the UTC offset in minutes. */
export function parsePatchDateOffset(patch: string): number | null {
  for (const raw of patch.split('\n')) {
    const line = raw.replace(/\r$/, '');
    if (line === '') return null;
    const m = DATE_LINE.exec(line);
    if (m) {
      const hours = Number(m[2]);
      const mins = Number(m[3]);
      if (hours > 14 || mins >= 60) return null;
      const minutes = hours * 60 + mins;
      return m[1] === '-' ? -minutes : minutes;
    }
  }
  return null;
}

export function majorityOffset(offsets: number[]): number | null {
  const counts = new Map<number, number>();
  for (const o of offsets) counts.set(o, (counts.get(o) ?? 0) + 1);
  let best: number | null = null;
  let bestCount = 0;
  for (const [offset, count] of counts) {
    if (count > bestCount) {
      best = offset;
      bestCount = count;
    }
  }
  return best;
}

export function resolveTimezone(input: {
  tzParam?: string | null;
  earlyOffsets: number[];
  recentOffsets: number[];
  location: string | null;
  at: Date;
}): ResolvedTz {
  const { tzParam, earlyOffsets, recentOffsets, location, at } = input;

  if (tzParam && isValidIana(tzParam)) {
    return { tz: { kind: 'iana', name: tzParam }, source: 'param', suggestion: null };
  }

  const locationIana = locationToIana(location);

  const early = majorityOffset(earlyOffsets);
  const recent = early === null ? majorityOffset(recentOffsets) : null;
  const commitOffset = early ?? recent;
  if (commitOffset !== null) {
    const tz: TzSpec = { kind: 'offset', minutes: commitOffset };
    const disagrees =
      locationIana !== null &&
      location !== null &&
      tzOffsetMinutes({ kind: 'iana', name: locationIana }, at) !== commitOffset;
    return {
      tz,
      source: early !== null ? 'early-commits' : 'recent-commits',
      suggestion: disagrees ? { iana: locationIana, location } : null,
    };
  }

  if (locationIana !== null) {
    return { tz: { kind: 'iana', name: locationIana }, source: 'location', suggestion: null };
  }
  return { tz: UTC, source: 'default', suggestion: null };
}
