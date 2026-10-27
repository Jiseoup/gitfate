import Link from 'next/link';
import { cardPath } from '@/lib/card-url';

export const EXAMPLE_LOGINS = ['torvalds', 'gaearon', 'sindresorhus', 'yyx990803'];

/** Famous developers' natal cards, each linking to their reading. */
export function ExampleCards({ locale, heading }: { locale: string; heading: string }) {
  return (
    <section aria-labelledby="examples-heading" className="w-full space-y-3">
      <h2 id="examples-heading" className="text-sm font-medium text-stone-600">{heading}</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {EXAMPLE_LOGINS.map((login) => (
          <li key={login}>
            <Link href={`/${locale}/${login}`} className="block overflow-hidden rounded-lg border border-stone-200 bg-white">
              {/* Plain <img>: the card route is dynamic and a missing image should just show its alt text. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cardPath('natal', locale, [login])}
                alt={login}
                width={1200}
                height={630}
                loading="lazy"
                className="aspect-[1200/630] w-full bg-stone-100 object-cover text-sm"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
