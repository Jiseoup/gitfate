import { CompatProblemProvider, type CompatProblem } from '@/components/CompatProblem';
import { isSupportedLocale } from '@/i18n/config';
import { lookupProfile } from '@/reading/user';

function safeDecode(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

// Only profile lookups (7-day fetch cache): enough to say which side a 404 is about. The page does the full assembly.
async function findProblem(a: string, b: string): Promise<CompatProblem | null> {
  try {
    const [ra, rb] = await Promise.all([lookupProfile(safeDecode(a)), lookupProfile(safeDecode(b))]);
    if (ra.status === 'invalid' || ra.status === 'blocked' || ra.status === 'not-found') {
      return { status: ra.status, login: safeDecode(a) };
    }
    if (rb.status === 'invalid' || rb.status === 'blocked' || rb.status === 'not-found') {
      return { status: rb.status, login: safeDecode(b) };
    }
  } catch {
    // The page reports real errors; the layout only decorates the 404.
  }
  return null;
}

export default async function CompatLayout({
  children,
  params,
}: LayoutProps<'/[locale]/[user]/vs/[other]'>) {
  const { locale, user, other } = await params;
  const problem = isSupportedLocale(locale) ? await findProblem(user, other) : null;
  return <CompatProblemProvider problem={problem}>{children}</CompatProblemProvider>;
}
