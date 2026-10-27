import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { DEFAULT_LOCALE } from '@/i18n/config';
import { createT } from '@/i18n/messages';

const t = createT(DEFAULT_LOCALE);

export const metadata: Metadata = {
  title: `404 · ${t('meta.serviceName')}`,
  description: t('meta.tagline'),
};

// URLs that match no route (no [locale] root layout above them) render this full document.
export default function GlobalNotFound() {
  return (
    <html lang={DEFAULT_LOCALE}>
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center antialiased">
        <p className="text-5xl font-bold">404</p>
        <Link href={`/${DEFAULT_LOCALE}`} className="underline underline-offset-2">
          {t('meta.serviceName')} · {t('ui.nav.home')}
        </Link>
      </body>
    </html>
  );
}
