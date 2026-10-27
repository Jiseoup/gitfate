import { notFound } from 'next/navigation';
import { Disclaimer } from '@/components/Disclaimer';
import { ExampleCards } from '@/components/ExampleCards';
import { HomeSearch } from '@/components/HomeSearch';
import { isSupportedLocale } from '@/i18n/config';
import { createT } from '@/i18n/messages';

export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const t = createT(locale);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-8 px-6 py-12 text-center">
      <div className="space-y-4">
        <p className="text-sm font-medium tracking-wide text-stone-500">
          <span className="font-bold text-stone-700">{t('meta.serviceName')}</span> · {t('meta.tagline')}
        </p>
        <h1 className="text-3xl font-bold sm:text-4xl">{t('ui.home.headline')}</h1>
        <p className="text-stone-600">{t('ui.home.lead')}</p>
      </div>
      <HomeSearch
        locale={locale}
        label={t('ui.home.inputLabel')}
        placeholder={t('ui.home.placeholder')}
        cta={t('ui.home.submit')}
        invalidText={t('ui.error.invalidLogin')}
      />
      <ExampleCards locale={locale} heading={t('ui.home.examples')} />
      <Disclaimer text={t('ui.disclaimer')} />
    </main>
  );
}
