import type { Metadata } from 'next';
import '../globals.css';
import { notFound } from 'next/navigation';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { LOCALES, isSupportedLocale } from '@/i18n/config';
import { createT } from '@/i18n/messages';
import { siteUrl } from '@/lib/site-url';

// Root layout (Next i18n pattern): the locale segment owns <html lang>. Unmatched URLs use
// app/global-not-found.tsx; `/` and unsupported locale codes are redirected by src/proxy.ts.
// `dynamicParams` stays at its default (true): the nested [user] segments are not in this list and must render on demand.
export function generateStaticParams() {
  return LOCALES.map((l) => ({ locale: l.code }));
}

export async function generateMetadata({ params }: LayoutProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};
  const t = createT(locale);
  return {
    // Resolves relative metadata URLs (canonical, Open Graph card images) to absolute ones.
    metadataBase: siteUrl(),
    title: { default: t('meta.serviceName'), template: `%s · ${t('meta.serviceName')}` },
    description: t('meta.tagline'),
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const t = createT(locale);
  return (
    <html lang={locale} className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <header className="flex justify-end px-4 py-3">
          <LanguageSwitcher locale={locale} locales={LOCALES} label={t('ui.nav.language')} />
        </header>
        {children}
      </body>
    </html>
  );
}
