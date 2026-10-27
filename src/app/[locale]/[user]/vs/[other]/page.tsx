import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { CompatResult } from '@/components/CompatResult';
import { compatBandText } from '@/components/compat-text';
import { Disclaimer } from '@/components/Disclaimer';
import { isSupportedLocale } from '@/i18n/config';
import { createT } from '@/i18n/messages';
import { cardPath } from '@/lib/card-url';
import { buildCompatReading, type CompatReading } from '@/reading/compat';

type OkReading = Extract<CompatReading, { status: 'ok' }>;

// One assembly per request, shared by generateMetadata and the page.
const getReading = cache((a: string, b: string, tzA: string | null, tzB: string | null) =>
  buildCompatReading(a, b, { tzA, tzB, now: new Date() }),
);

function paramOf(searchParams: Record<string, string | string[] | undefined>, key: string): string | null {
  const v = searchParams[key];
  return typeof v === 'string' ? v : null;
}

/** Only a `?tzA=` / `?tzB=` the reading actually used. */
function tzQuery(r: OkReading): Record<string, string> | undefined {
  const query: Record<string, string> = {};
  for (const [key, side] of [['tzA', r.a], ['tzB', r.b]] as const) {
    if (side.tz.source === 'param' && side.tz.tz.kind === 'iana') query[key] = side.tz.tz.name;
  }
  return Object.keys(query).length > 0 ? query : undefined;
}

function canonicalPath(locale: string, r: OkReading): string {
  const query = tzQuery(r);
  return `/${locale}/${r.a.profile.login}/vs/${r.b.profile.login}${query ? `?${new URLSearchParams(query)}` : ''}`;
}

type Props = PageProps<'/[locale]/[user]/vs/[other]'>;

/** `null` for an unsupported locale, checked before any GitHub request. */
async function load(props: Props) {
  const { locale, user, other } = await props.params;
  if (!isSupportedLocale(locale)) return null;
  const search = await props.searchParams;
  return { locale, reading: await getReading(user, other, paramOf(search, 'tzA'), paramOf(search, 'tzB')) };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const loaded = await load(props);
  if (!loaded) return {};
  const { locale, reading: r } = loaded;
  if (r.status !== 'ok') return {};
  const t = createT(locale);
  const title = `${r.a.profile.login} × ${r.b.profile.login}`;
  // Both Sign names first, then the score line.
  const signs = `${t(`terms.sign.${r.a.chart.dayMaster}`)} × ${t(`terms.sign.${r.b.chart.dayMaster}`)}`;
  const description = `${signs} · ${compatBandText(locale, r.a, r.b, r.result)}`;
  const logins = [r.a.profile.login, r.b.profile.login];
  return {
    title,
    description,
    alternates: { canonical: canonicalPath(locale, r) },
    openGraph: {
      type: 'website',
      siteName: t('meta.serviceName'),
      title: `${title} · ${t('meta.serviceName')}`,
      description,
      url: canonicalPath(locale, r),
      images: [{ url: cardPath('compat', locale, logins, tzQuery(r)), width: 1200, height: 630, alt: title }],
    },
    twitter: { card: 'summary_large_image' },
  };
}

export default async function CompatPage(props: Props) {
  const loaded = await load(props);
  if (!loaded) notFound();
  const { locale, reading: r } = loaded;
  if (r.status === 'unavailable') {
    const t = createT(locale);
    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
        <p className="text-lg">{t('ui.error.rateLimited')}</p>
        <Disclaimer text={t('ui.disclaimer')} />
      </main>
    );
  }
  if (r.status !== 'ok') notFound();
  return (
    <CompatResult
      locale={locale}
      a={r.a}
      b={r.b}
      result={r.result}
      shared={r.shared}
      cardHref={cardPath('compat', locale, [r.a.profile.login, r.b.profile.login], tzQuery(r))}
      sharePath={canonicalPath(locale, r)}
    />
  );
}
