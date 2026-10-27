import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { cache, type ReactNode } from 'react';
import { CompatInput } from '@/components/CompatInput';
import { DailyCard } from '@/components/DailyCard';
import { Disclaimer } from '@/components/Disclaimer';
import { ElementBars } from '@/components/ElementBars';
import { formatShortDay, fullYears } from '@/components/format';
import { PillarChip } from '@/components/PillarChip';
import { PillarTable } from '@/components/PillarTable';
import { RoleTag } from '@/components/RoleTag';
import { ShareButtons } from '@/components/ShareButtons';
import { SignTile } from '@/components/SignTile';
import { pillarName, pillarTitle, signTitle } from '@/components/sign-text';
import { TimezoneBar } from '@/components/TimezoneBar';
import { YearlyChart } from '@/components/YearlyChart';
import { tzLabel } from '@/core/time';
import type { Element } from '@/core/types';
import { isSupportedLocale } from '@/i18n/config';
import { createT, type T } from '@/i18n/messages';
import { sizedAvatarUrl } from '@/lib/avatar-url';
import { cardPath } from '@/lib/card-url';
import { pickerCountries } from '@/reading/countries';
import { buildUserReading, type UserReading } from '@/reading/user';

type OkReading = Extract<UserReading, { status: 'ok' }>;

const AVATAR_PX = 72;

// One assembly per request, shared by generateMetadata and the page.
const getReading = cache((login: string, tzParam: string | null) =>
  buildUserReading(login, { tzParam, now: new Date() }),
);

function tzParamOf(searchParams: Record<string, string | string[] | undefined>): string | null {
  const tz = searchParams.tz;
  return typeof tz === 'string' ? tz : null;
}

/** Query that reproduces this reading: only a `?tz=` the reading actually used. */
function tzQuery(r: OkReading): Record<string, string> | undefined {
  return r.tz.source === 'param' && r.tz.tz.kind === 'iana' ? { tz: r.tz.tz.name } : undefined;
}

function canonicalPath(locale: string, r: OkReading): string {
  const query = tzQuery(r);
  return `/${locale}/${r.profile.login}${query ? `?${new URLSearchParams(query)}` : ''}`;
}

/** "Fire and Water" in English; Korean joins bare element names with "·" ("화·수 기운"), not "및". */
function elementList(locale: string, t: T, elements: Element[]): string {
  const names = elements.map((e) => t(`terms.element.${e}`));
  if (locale === 'ko') return names.join('·');
  return new Intl.ListFormat(locale, { type: 'conjunction' }).format(names);
}

/** "The Jewel — Polishes until it sparkles": the Sign name first, then its one-liner. */
function signLine(t: T, r: OkReading): string {
  return `${t(`terms.sign.${r.chart.dayMaster}`)} — ${t(`natal.archetype.${r.chart.dayMaster}.name`)}`;
}

function formatBornAt(locale: string, bornAt: string): string {
  // bornAt is already a local wall clock; format it as if it were UTC so no shift is applied.
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'long',
    timeStyle: 'short',
    hourCycle: 'h23',
    timeZone: 'UTC',
  }).format(
    new Date(`${bornAt}Z`),
  );
}

export async function generateMetadata({ params, searchParams }: PageProps<'/[locale]/[user]'>): Promise<Metadata> {
  const { locale, user } = await params;
  if (!isSupportedLocale(locale)) return {};
  const r = await getReading(user, tzParamOf(await searchParams));
  if (r.status !== 'ok') return {};
  const t = createT(locale, `${r.profile.login.toLowerCase()}|natal`);
  const login = r.profile.login;
  const description = `${signLine(t, r)} · ${t('meta.tagline')}`;
  const card = { url: cardPath('natal', locale, [login], tzQuery(r)), width: 1200, height: 630, alt: login };
  return {
    title: login,
    description,
    alternates: { canonical: canonicalPath(locale, r) },
    openGraph: {
      type: 'website',
      siteName: t('meta.serviceName'),
      title: `${login} · ${t('meta.serviceName')}`,
      description,
      url: canonicalPath(locale, r),
      images: [card],
    },
    twitter: { card: 'summary_large_image' },
  };
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200 sm:p-6">
      <h2 className="text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Header({ r, locale, t }: { r: OkReading; locale: string; t: T }) {
  const { profile } = r;
  return (
    <header className="flex items-center gap-4">
      {/* Served straight from GitHub at 2× size: no Vercel image optimization quota. */}
      <Image
        src={sizedAvatarUrl(profile.avatarUrl, AVATAR_PX * 2)}
        unoptimized
        alt=""
        width={AVATAR_PX}
        height={AVATAR_PX}
        className="h-16 w-16 rounded-full ring-2 ring-stone-200 sm:h-18 sm:w-18"
      />
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-bold">{profile.name ?? profile.login}</h1>
        <a
          href={`https://github.com/${profile.login}`}
          className="font-mono text-sm text-stone-500 hover:underline"
          rel="noopener noreferrer"
        >
          @{profile.login}
        </a>
        <p className="mt-1 text-sm text-stone-700">
          {t('ui.born', {
            datetime: formatBornAt(locale, r.bornAt),
            label: tzLabel(r.tz.tz, new Date(profile.createdAt)),
          })}
          {` · ${t('ui.githubAge', { age: fullYears(r.bornAt.slice(0, 10), r.daily.date) })}`}
        </p>
      </div>
    </header>
  );
}

function NatalSection({ r, locale, t, name }: { r: OkReading; locale: string; t: T; name: string }) {
  const { chart, diagnosis } = r;
  return (
    <Section title={t('ui.section.natal')}>
      <PillarTable chart={chart} t={t} />
      <p className="text-center font-medium">
        {t(`terms.zodiacColor.${chart.zodiac.element}`)} {t(`terms.zodiac.${chart.zodiac.animal}`)}
      </p>
      <div className="flex items-start gap-4 rounded-xl bg-stone-100 p-4">
        <SignTile stem={chart.dayMaster} title={signTitle(t, chart.dayMaster)} size="lg" />
        <div className="min-w-0 space-y-1">
          <h3 className="text-xl font-bold">{t('natal.headline', { name, sign: t(`terms.sign.${chart.dayMaster}`) })}</h3>
          <p className="font-medium text-stone-800">{t(`natal.archetype.${chart.dayMaster}.name`)}</p>
          <p className="text-sm text-stone-700">{t(`natal.archetype.${chart.dayMaster}.desc`, { name })}</p>
          <p className="text-xs text-stone-500">{t('terms.tooltip.sign')}</p>
        </div>
      </div>
      <ElementBars counts={chart.elementCounts} t={t} />
      <div className="space-y-2 text-sm text-stone-700">
        <p>{t('natal.elements.strongest', { element: elementList(locale, t, chart.strongest) })}</p>
        <p>{t('natal.elements.missing', { element: elementList(locale, t, chart.weakest) })}</p>
        {diagnosis && (
          <p>
            {t(`natal.language.${diagnosis.diagnosis}`, {
              element: t(`terms.element.${diagnosis.targetElement}`),
              language: diagnosis.luckyLanguage,
            })}
          </p>
        )}
        <p className="text-xs text-stone-500">{t('terms.tooltip.elements')}</p>
      </div>
    </Section>
  );
}

function YearlySection({ r, locale, t }: { r: OkReading; locale: string; t: T }) {
  const { yearly, activity } = r;
  const relation = yearly.branchRelations.find((b) => b !== 'none') ?? 'none';
  const { pillar } = yearly.year;
  return (
    <Section title={t('ui.section.yearly')}>
      <div className="flex items-start gap-3">
        <SignTile stem={pillar.stem} title={signTitle(t, pillar.stem)} size="sm" />
        <div className="min-w-0 space-y-1">
          <h3 className="flex flex-wrap items-center gap-2 font-bold">
            {t('yearly.title', {
              year: yearly.year.startYear,
              sign: t(`terms.sign.${pillar.stem}`),
              start: formatShortDay(locale, yearly.months[0].startDate),
            })}
            <PillarChip text={pillarName(t, pillar)} title={pillarTitle(t, pillar)} />
          </h3>
          <p className="text-xs text-stone-500">{t('terms.tooltip.ipchun')}</p>
        </div>
      </div>
      <div className="space-y-2 text-stone-700">
        <p>
          <RoleTag
            label={t('ui.role.year')}
            role={t(`terms.tenGod.${yearly.tenGod}`)}
            saju={t(`terms.tenGodSaju.${yearly.tenGod}`)}
          />
          {t(`yearly.theme.${yearly.tenGod}`)}
        </p>
        <p>{t(`yearly.branch.${relation}`)}</p>
        {activity?.reality && <p className="font-medium">{t(`yearly.reality.${activity.reality.kind}`, { pct: activity.reality.pct })}</p>}
      </div>
      <YearlyChart months={yearly.months} actual={activity?.monthly ?? null} t={t} />
    </Section>
  );
}

function Unavailable({ t }: { t: T }) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <p className="text-lg">{t('ui.error.rateLimited')}</p>
      <Disclaimer text={t('ui.disclaimer')} />
    </main>
  );
}

export default async function UserPage({ params, searchParams }: PageProps<'/[locale]/[user]'>) {
  const { locale, user } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const r = await getReading(user, tzParamOf(await searchParams));
  const t = createT(locale);
  if (r.status === 'unavailable') return <Unavailable t={t} />;
  if (r.status !== 'ok') notFound();

  const login = r.profile.login;
  const seedLogin = login.toLowerCase();
  const name = r.profile.name ?? login;
  const tNatal = createT(locale, `${seedLogin}|natal`);
  const tDaily = createT(locale, r.daily.variantSeed);
  const tYearly = createT(locale, `${seedLogin}|${r.yearly.year.startYear}`);
  const basePath = `/${locale}/${login}`;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-8 sm:px-6">
      <Header r={r} locale={locale} t={t} />
      <TimezoneBar
        basePath={basePath}
        sourceText={t(`ui.tz.source.${r.tz.source}`, { label: tzLabel(r.tz.tz, new Date(r.profile.createdAt)) })}
        changeLabel={t('ui.tz.change')}
        cityLabel={t('ui.tz.city')}
        suggestion={
          r.tz.suggestion && {
            text: t('ui.tz.suggest', { location: r.tz.suggestion.location }),
            iana: r.tz.suggestion.iana,
          }
        }
        countries={pickerCountries(locale)}
      />
      {r.activity === null && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
          {t('ui.error.activityUnavailable')}
        </p>
      )}
      <NatalSection r={r} locale={locale} t={tNatal} name={name} />
      <Section title={t('ui.section.daily')}>
        <DailyCard daily={r.daily} t={tDaily} locale={locale} name={name} firstCommit={r.activity?.reality?.kind === 'none'} />
      </Section>
      <YearlySection r={r} locale={locale} t={tYearly} />
      <Section title={t('ui.section.compat')}>
        <CompatInput
          locale={locale}
          login={login}
          tz={tzQuery(r)?.tz}
          placeholder={t('ui.compat.placeholder')}
          cta={t('ui.compat.cta')}
          invalidText={t('ui.error.invalidLogin')}
        />
      </Section>
      <ShareButtons
        labels={{
          copy: t('ui.share.copy'),
          copied: t('ui.share.copied'),
          copyFailed: t('ui.share.copyFailed'),
          download: t('ui.share.download'),
          x: t('ui.share.x'),
        }}
        cardHref={cardPath('natal', locale, [login], tzQuery(r))}
        sharePath={canonicalPath(locale, r)}
        shareText={`${t('meta.serviceName')} · ${login} · ${signLine(tNatal, r)}`}
      />
      <Disclaimer text={t('ui.disclaimer')} />
    </main>
  );
}
