'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { isBlocked } from '@/lib/blocklist';
import { DEFAULT_LOCALE } from '@/i18n/config';
import { isValidLogin } from '@/lib/login';
import { Disclaimer } from './Disclaimer';

export interface NotFoundMessages {
  notFound: string;
  blocked: string;
  invalidLogin: string;
  home: string;
  disclaimer: string;
}

function safeDecode(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

export function NotFoundView({ messages }: { messages: Record<string, NotFoundMessages> }) {
  const params = useParams<{ locale?: string; user?: string }>();
  const locale = params?.locale && messages[params.locale] ? params.locale : DEFAULT_LOCALE;
  const m = messages[locale];
  const user = params?.user ? safeDecode(params.user) : null;
  const text =
    user === null ? m.notFound : !isValidLogin(user) ? m.invalidLogin : isBlocked(user) ? m.blocked : m.notFound;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <p className="text-6xl font-bold text-red-700">404</p>
      {user && <p className="font-mono text-stone-500">{user}</p>}
      <p className="text-lg">{text}</p>
      <Link href={`/${locale}`} className="underline underline-offset-2">{m.home}</Link>
      <Disclaimer text={m.disclaimer} />
    </main>
  );
}
