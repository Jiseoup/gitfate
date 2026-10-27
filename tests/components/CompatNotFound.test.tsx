import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { useParams } from 'next/navigation';
import { CompatNotFoundView, CompatProblemProvider, type CompatProblem } from '@/components/CompatProblem';
import type { NotFoundMessages } from '@/components/NotFoundView';
import CompatLayout from '@/app/[locale]/[user]/vs/[other]/layout';
import { lookupProfile } from '@/reading/user';

vi.mock('next/navigation', () => ({ useParams: vi.fn() }));
vi.mock('@/reading/user', () => ({ lookupProfile: vi.fn() }));
afterEach(cleanup);

const m = (p: string): NotFoundMessages => ({
  notFound: `${p}-notFound`,
  blocked: `${p}-blocked`,
  invalidLogin: `${p}-invalid`,
  home: `${p}-home`,
  disclaimer: `${p}-disclaimer`,
});
const messages = { ko: m('ko'), en: m('en') };

function show(locale: string, problem: CompatProblem | null) {
  vi.mocked(useParams).mockReturnValue({ locale });
  render(
    <CompatProblemProvider problem={problem}>
      <CompatNotFoundView messages={messages} />
    </CompatProblemProvider>,
  );
}

test('shows the login of the failing side with the reason, in the URL locale', () => {
  show('ko', { status: 'not-found', login: 'ghosty' });
  expect(screen.getByText('ghosty')).toBeTruthy();
  expect(screen.getByText('ko-notFound')).toBeTruthy();
  cleanup();
  show('en', { status: 'invalid', login: '-bad--' });
  expect(screen.getByText('-bad--')).toBeTruthy();
  expect(screen.getByText('en-invalid')).toBeTruthy();
  cleanup();
  show('en', { status: 'blocked', login: 'hidden-one' });
  expect(screen.getByText('en-blocked')).toBeTruthy();
});

test('without a known problem it falls back to the generic message', () => {
  show('ko', null);
  expect(screen.getByText('ko-notFound')).toBeTruthy();
  expect(screen.getByText('ko-disclaimer')).toBeTruthy();
});

test('layout reports the first failing side, a before b, and decodes the segment', async () => {
  const ok = { status: 'ok' as const, profile: {} as never };
  vi.mocked(lookupProfile).mockImplementation(async (l) =>
    l === 'ghosty' ? { status: 'not-found' } : l === '-bad' ? { status: 'invalid' } : ok,
  );
  const call = async (user: string, other: string) => {
    const el = await CompatLayout({ children: null, params: Promise.resolve({ locale: 'ko', user, other }) } as never);
    return (el as { props: { problem: CompatProblem | null } }).props.problem;
  };
  expect(await call('jiseoup', 'ghosty')).toEqual({ status: 'not-found', login: 'ghosty' });
  expect(await call('-bad', 'ghosty')).toEqual({ status: 'invalid', login: '-bad' });
  expect(await call('jiseoup', 'torvalds')).toBeNull();
  vi.mocked(lookupProfile).mockRejectedValue(new Error('boom'));
  expect(await call('jiseoup', 'torvalds')).toBeNull();
  expect(vi.mocked(lookupProfile)).toHaveBeenCalledTimes(8);
});
