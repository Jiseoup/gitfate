import Image from 'next/image';
import Link from 'next/link';
import { localDateKey, tzLabel } from '@/core/time';
import type { CompatSide } from '@/reading/compat';
import type { Compatibility } from '@/core/compat';
import { createT } from '@/i18n/messages';
import { sizedAvatarUrl } from '@/lib/avatar-url';
import { compatBandText, compatFlowText, compatVariantSeed, displayName } from './compat-text';
import { Disclaimer } from './Disclaimer';
import { formatLongDate } from './format';
import { ShareButtons } from './ShareButtons';
import { SignTile } from './SignTile';
import { signTitle } from './sign-text';

const SUBS = ['pair', 'review', 'incident'] as const;
const AVATAR_PX = 72;

function Person({ side, locale }: { side: CompatSide; locale: string }) {
  const t = createT(locale);
  const { profile, chart } = side;
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
      {/* Served straight from GitHub at 2× size: no Vercel image optimization quota. */}
      <Image
        src={sizedAvatarUrl(profile.avatarUrl, AVATAR_PX * 2)}
        unoptimized
        alt=""
        width={AVATAR_PX}
        height={AVATAR_PX}
        className="h-16 w-16 rounded-full ring-2 ring-stone-200 sm:h-18 sm:w-18"
      />
      <div className="min-w-0 max-w-full">
        <p className="truncate font-bold">{displayName(side)}</p>
        <Link href={`/${locale}/${profile.login}`} className="font-mono text-sm text-stone-500 hover:underline">
          @{profile.login}
        </Link>
        <p className="text-xs text-stone-500">
          {t('ui.joined', { date: formatLongDate(locale, localDateKey(new Date(profile.createdAt), side.tz.tz)) })}
        </p>
      </div>
      <SignTile stem={chart.dayMaster} title={signTitle(t, chart.dayMaster)} />
      <p className="font-semibold">{t(`terms.sign.${chart.dayMaster}`)}</p>
      <p className="min-h-[2lh] text-sm text-stone-700">{t(`natal.archetype.${chart.dayMaster}.name`)}</p>
      {side.topLanguages.length > 0 && (
        <p className="text-xs text-stone-500">{side.topLanguages.join(' · ')}</p>
      )}
      <p className="text-xs text-stone-500">
        {t(`ui.tz.source.${side.tz.source}`, { label: tzLabel(side.tz.tz, new Date(profile.createdAt)) })}
      </p>
    </div>
  );
}

export function CompatResult({ locale, a, b, result, shared, cardHref, sharePath }: {
  locale: string;
  a: CompatSide;
  b: CompatSide;
  result: Compatibility;
  shared: string[];
  cardHref: string;
  sharePath: string;
}) {
  const t = createT(locale);
  const tc = createT(locale, compatVariantSeed(a, b));
  const list = new Intl.ListFormat(locale, { type: 'conjunction' }).format(shared);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-8 sm:px-6">
      <h1 className="sr-only">{`${a.profile.login} × ${b.profile.login}`}</h1>
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200 sm:p-6">
        <div className="flex items-start gap-2 sm:gap-4">
          <Person side={a} locale={locale} />
          <div className="flex shrink-0 flex-col items-center pt-4" aria-label={t('ui.section.compat')}>
            <p className="text-5xl font-bold tabular-nums text-red-700">{result.score}</p>
            <p className="text-xs text-stone-500">/ 100</p>
          </div>
          <Person side={b} locale={locale} />
        </div>
      </section>
      <section className="space-y-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200 sm:p-6">
        <h2 className="text-lg font-bold">{t('ui.section.compat')}</h2>
        <p className="font-medium">{compatBandText(locale, a, b, result)}</p>
        <ul className="space-y-2">
          {SUBS.map((k) => (
            <li key={k} className="flex items-center gap-3 text-sm">
              <span className="w-32 shrink-0 text-stone-700">{t(`compat.sub.${k}`)}</span>
              <span className="h-3 flex-1 overflow-hidden rounded-full bg-stone-200">
                <span className="block h-full rounded-full bg-red-600" style={{ width: `${result.sub[k]}%` }} />
              </span>
              <span className="w-8 text-right tabular-nums text-stone-600">{result.sub[k]}</span>
            </li>
          ))}
        </ul>
        <p className="text-stone-700">{compatFlowText(locale, a, b, result)}</p>
        <p className="text-stone-700">
          {shared.length > 0 ? tc('compat.shared.some', { languages: list }) : tc('compat.shared.none')}
        </p>
      </section>
      <ShareButtons
        labels={{
          copy: t('ui.share.copy'),
          copied: t('ui.share.copied'),
          copyFailed: t('ui.share.copyFailed'),
          download: t('ui.share.download'),
          x: t('ui.share.x'),
        }}
        cardHref={cardHref}
        sharePath={sharePath}
        shareText={`${t('meta.serviceName')} · ${a.profile.login} × ${b.profile.login} · ${result.score}`}
      />
      <Disclaimer text={t('ui.disclaimer')} />
    </main>
  );
}
