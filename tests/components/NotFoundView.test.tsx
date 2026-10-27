import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { useParams } from 'next/navigation';
import { NotFoundView, type NotFoundMessages } from '@/components/NotFoundView';
import { isBlocked } from '@/lib/blocklist';

vi.mock('next/navigation', () => ({ useParams: vi.fn() }));
vi.mock('@/lib/blocklist', () => ({ isBlocked: vi.fn(() => false) }));
afterEach(cleanup);

const m = (p: string): NotFoundMessages => ({
  notFound: `${p}-notFound`,
  blocked: `${p}-blocked`,
  invalidLogin: `${p}-invalid`,
  home: `${p}-home`,
  disclaimer: `${p}-disclaimer`,
});
const messages = { ko: m('ko'), en: m('en') };

function show(params: Record<string, string>) {
  vi.mocked(useParams).mockReturnValue(params);
  render(<NotFoundView messages={messages} />);
}

test('explains why, in the URL locale', () => {
  show({ locale: 'ko', user: 'ghosty' });
  expect(screen.getByText('ko-notFound')).toBeTruthy();
  expect(screen.getByText('ko-disclaimer')).toBeTruthy();
  cleanup();
  show({ locale: 'en', user: '-bad--name' });
  expect(screen.getByText('en-invalid')).toBeTruthy();
  cleanup();
  vi.mocked(isBlocked).mockReturnValueOnce(true);
  show({ locale: 'ko', user: 'hidden-one' });
  expect(screen.getByText('ko-blocked')).toBeTruthy();
  cleanup();
  show({ locale: 'en', user: '%E0%A4%A' });
  expect(screen.getByText('en-invalid')).toBeTruthy();
  expect(screen.getByText('%E0%A4%A')).toBeTruthy();
});
