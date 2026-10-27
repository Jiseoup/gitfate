import type { NatalChart } from '@/core/chart';
import type { T } from '@/i18n/messages';
import { SignTile } from './SignTile';
import { PillarChip } from './PillarChip';
import { pillarName, pillarTitle, signTitle } from './sign-text';

const ORDER = ['hour', 'day', 'month', 'year'] as const;

/**
 * The four pillars, laid out hour → year as on a traditional chart. Each pillar shows its stem's
 * Sign (icon and name) with its color-and-animal name as a small chip. The day pillar is yours.
 */
export function PillarTable({ chart, t }: { chart: NatalChart; t: T }) {
  return (
    <table className="w-full table-fixed border-separate border-spacing-x-1 text-center sm:border-spacing-x-3">
      <thead>
        <tr>
          {ORDER.map((k) => (
            <th
              key={k}
              scope="col"
              title={t('terms.tooltip.saju')}
              className="pb-2 text-xs font-medium text-stone-500 sm:text-sm"
            >
              {t(`terms.pillar.${k}`)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          {ORDER.map((k) => {
            const p = chart.pillars[k];
            return (
              <td key={k} className={`rounded-xl py-2 align-top ${k === 'day' ? 'bg-stone-100' : ''}`}>
                <div className="flex flex-col items-center gap-1.5">
                  <SignTile stem={p.stem} title={signTitle(t, p.stem)} />
                  <span className="text-sm font-semibold leading-tight text-stone-800">{t(`terms.sign.${p.stem}`)}</span>
                  <PillarChip text={pillarName(t, p)} title={pillarTitle(t, p)} />
                </div>
              </td>
            );
          })}
        </tr>
      </tbody>
    </table>
  );
}
