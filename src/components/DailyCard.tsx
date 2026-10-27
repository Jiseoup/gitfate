import type { DailyFortune, StarKey } from '@/core/daily';
import { BRANCHES, branchZodiac } from '@/core/ganzhi';
import type { Branch } from '@/core/types';
import { ElementIcon } from '@/icons/elements';
import type { T } from '@/i18n/messages';
import { ELEMENT_STYLE } from './element-style';
import { formatLongDate } from './format';
import { RoleTag } from './RoleTag';
import { PillarChip } from './PillarChip';
import { pillarName, pillarTitle } from './sign-text';

const STAR_KEYS: StarKey[] = ['deploy', 'debug', 'review', 'merge'];

/** Score bands of `daily.band.*`: <40, <55, <70, <85, ≥85. */
export function dailyBand(score: number): number {
  return [40, 55, 70, 85].filter((limit) => score >= limit).length;
}

/** Traditional two-hour slot of a branch: 子 23:00–01:00, 丑 01:00–03:00, … */
export function hourRange(branch: Branch): string {
  const i = BRANCHES.indexOf(branch);
  const hh = (h: number) => `${String((h + 24) % 24).padStart(2, '0')}:00`;
  return `${hh(2 * i - 1)}–${hh(2 * i + 1)}`;
}

function Stars({ count }: { count: number }) {
  return (
    <span aria-label={`${count}/5`} className="tracking-widest text-amber-500">
      {'★'.repeat(count)}
      <span className="text-stone-300">{'★'.repeat(5 - count)}</span>
    </span>
  );
}

/** 宜 or 忌 from the almanac, translated into dev activities. */
function YiJiList({ title, items, t, tone }: { title: string; items: string[]; t: T; tone: string }) {
  return (
    <div>
      <h4 className={`mb-1 text-sm font-semibold ${tone}`}>{title}</h4>
      <ul className="space-y-1 text-sm">
        {items.length === 0 && <li className="text-stone-400">—</li>}
        {items.map((key) => (
          <li key={key} className="text-stone-800">{t(`yiji.${key}`)}</li>
        ))}
      </ul>
    </div>
  );
}

export function DailyCard({ daily, t, locale, name, firstCommit }: {
  daily: DailyFortune;
  /** Created with `daily.variantSeed`. */
  t: T;
  locale: string;
  name: string;
  /** Show the "before the first commit" line (accounts with no contributions yet). */
  firstCommit: boolean;
}) {
  const { dayPillar, lucky } = daily;
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <time dateTime={daily.date} className="text-sm text-stone-500">{formatLongDate(locale, daily.date)}</time>
        <PillarChip text={pillarName(t, dayPillar)} title={pillarTitle(t, dayPillar)} />
        <p className="ml-auto text-4xl font-bold tabular-nums text-red-700">{daily.score}</p>
      </div>
      <p className="font-medium">{t(`daily.band.${dailyBand(daily.score)}`)}</p>
      <div className="space-y-2 text-stone-700">
        <p>
          <RoleTag
            label={t('ui.role.today')}
            role={t(`terms.tenGod.${daily.tenGod}`)}
            saju={t(`terms.tenGodSaju.${daily.tenGod}`)}
          />
          {t(`daily.tenGod.${daily.tenGod}`, { name })}
        </p>
        <p className="text-xs text-stone-500">{t('terms.tooltip.tenGod')}</p>
        <p>{t(`daily.branch.${daily.branchRelation}`)}</p>
        {firstCommit && <p>{t('daily.firstCommit')}</p>}
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        {STAR_KEYS.map((k) => (
          <div key={k} className="flex items-center justify-between gap-2">
            <dt className="text-stone-600">{t(`ui.stars.${k}`)}</dt>
            <dd><Stars count={daily.stars[k]} /></dd>
          </div>
        ))}
      </dl>
      <section className="rounded-xl border border-stone-200 p-4">
        <h3 className="mb-3 text-sm font-semibold text-stone-700">{t('ui.almanac.header')}</h3>
        <div className="grid grid-cols-2 gap-4">
          <YiJiList title={t('ui.yiji.do')} items={daily.yi} t={t} tone="text-green-700" />
          <YiJiList title={t('ui.yiji.dont')} items={daily.ji} t={t} tone="text-red-700" />
        </div>
      </section>
      <dl className="grid grid-cols-2 gap-3 rounded-xl bg-stone-100 p-4 text-sm">
        <div>
          <dt className="text-stone-500">{t('ui.lucky.color')}</dt>
          <dd className="flex items-center gap-2 font-medium">
            <span className={`inline-block h-3 w-3 rounded-full ${ELEMENT_STYLE[lucky.element].chip}`} />
            {`${t(`terms.color.${lucky.element}`)} · `}
            <span className={ELEMENT_STYLE[lucky.element].ink}>
              <ElementIcon element={lucky.element} size={16} />
            </span>
            {t(`terms.element.${lucky.element}`)}
          </dd>
        </div>
        <div>
          <dt className="text-stone-500">{t('ui.lucky.language')}</dt>
          <dd className="font-medium">{lucky.language}</dd>
        </div>
        <div>
          <dt className="text-stone-500">{t('ui.lucky.hour')}</dt>
          <dd className="font-medium" title={t(`terms.branch.${lucky.hourBranch}`)}>
            {`${hourRange(lucky.hourBranch)} · ${t('ui.lucky.hourName', { animal: t(`terms.animal.${branchZodiac(lucky.hourBranch)}`) })}`}
          </dd>
        </div>
        <div>
          <dt className="text-stone-500">{t('ui.lucky.item')}</dt>
          <dd className="font-medium">{t('daily.meme')}</dd>
        </div>
      </dl>
    </div>
  );
}
