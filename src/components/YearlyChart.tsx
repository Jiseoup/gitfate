import type { YearlyFortune } from '@/core/yearly';
import type { T } from '@/i18n/messages';
import { PillarChip } from './PillarChip';
import { pillarName, pillarTitle } from './sign-text';

/** `2026-02-04` → `2/4`. */
export function shortDate(key: string): string {
  const [, m, d] = key.split('-');
  return `${Number(m)}/${Number(d)}`;
}

/**
 * Monthly luck bars for the saju year. `actual` overlays real contributions for months that have
 * started; pass `null` to hide it (activity unavailable).
 */
export function YearlyChart({ months, actual, t }: {
  months: YearlyFortune['months'];
  actual: (number | null)[] | null;
  t: T;
}) {
  const shown = actual?.some((n) => n !== null) ? actual : null;
  const maxActual = Math.max(1, ...(shown ?? []).map((n) => n ?? 0));
  return (
    <div>
      <p className="mb-3 flex gap-4 text-xs text-stone-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-4 rounded bg-red-600" /> {t('ui.chart.luck')}
        </span>
        {shown && (
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-4 rounded bg-green-600" /> {t('ui.chart.commits')}
          </span>
        )}
      </p>
      <ol className="space-y-2">
        {months.map((m, i) => {
          const count = shown?.[i] ?? null;
          return (
            <li key={m.index} className="text-sm">
              <div className="flex items-baseline justify-between gap-2">
                <span className="flex items-center gap-1.5 text-stone-700">
                  {t('ui.month.label', { month: m.labelMonth, start: shortDate(m.startDate), end: shortDate(m.endDate) })}
                  <PillarChip text={pillarName(t, m.pillar)} title={pillarTitle(t, m.pillar)} />
                </span>
                <span className="tabular-nums text-stone-500">
                  {m.score}
                  {count !== null && <span className="text-green-700"> · {count}</span>}
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-stone-200">
                <div className="h-full rounded-full bg-red-600" style={{ width: `${m.score}%` }} />
              </div>
              {count !== null && (
                <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-stone-100">
                  <div
                    className="h-full rounded-full bg-green-600"
                    style={{ width: `${(count / maxActual) * 100}%` }}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
