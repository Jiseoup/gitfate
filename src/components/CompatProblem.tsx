'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createContext, useContext, type ReactNode } from 'react';
import { DEFAULT_LOCALE } from '@/i18n/config';
import { Disclaimer } from './Disclaimer';
import type { NotFoundMessages } from './NotFoundView';

/** Which side of a compat URL cannot be shown, and why. Computed on the server by the route layout. */
export interface CompatProblem {
  status: 'invalid' | 'not-found' | 'blocked';
  login: string;
}

const ProblemContext = createContext<CompatProblem | null>(null);

// not-found files receive no props, so the layout hands the reason down through context.
export function CompatProblemProvider({ problem, children }: { problem: CompatProblem | null; children: ReactNode }) {
  return <ProblemContext.Provider value={problem}>{children}</ProblemContext.Provider>;
}

export function CompatNotFoundView({ messages }: { messages: Record<string, NotFoundMessages> }) {
  const params = useParams<{ locale?: string }>();
  const problem = useContext(ProblemContext);
  const locale = params?.locale && messages[params.locale] ? params.locale : DEFAULT_LOCALE;
  const m = messages[locale];
  const text = !problem
    ? m.notFound
    : problem.status === 'invalid'
      ? m.invalidLogin
      : problem.status === 'blocked'
        ? m.blocked
        : m.notFound;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <p className="text-6xl font-bold text-red-700">404</p>
      {problem && <p className="font-mono text-stone-500">{problem.login}</p>}
      <p className="text-lg">{text}</p>
      <Link href={`/${locale}`} className="underline underline-offset-2">{m.home}</Link>
      <Disclaimer text={m.disclaimer} />
    </main>
  );
}
