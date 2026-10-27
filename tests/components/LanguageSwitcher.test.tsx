import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { usePathname, useRouter } from 'next/navigation';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

vi.mock('next/navigation', () => ({ usePathname: vi.fn(), useRouter: vi.fn() }));

const push = vi.fn();
const locales = [
  { code: 'ko', name: '한국어' },
  { code: 'en', name: 'English' },
];

function show(locale: string, pathname: string, search = '') {
  vi.mocked(usePathname).mockReturnValue(pathname);
  window.history.replaceState(null, '', `${pathname}${search}`);
  render(<LanguageSwitcher locale={locale} locales={locales} label="언어" />);
}

beforeEach(() => {
  vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
});
afterEach(() => {
  cleanup();
  push.mockReset();
});

test('lists every language with the current one selected', () => {
  show('ko', '/ko');
  const select = screen.getByLabelText('언어') as HTMLSelectElement;
  expect(select.value).toBe('ko');
  expect([...select.options].map((o) => o.textContent)).toEqual(['한국어', 'English']);
});

test('switching keeps the rest of the path and the query string', async () => {
  show('ko', '/ko/Jiseoup', '?tz=Asia/Seoul');
  await userEvent.selectOptions(screen.getByLabelText('언어'), 'en');
  expect(push).toHaveBeenCalledWith('/en/Jiseoup?tz=Asia/Seoul');
});

test('works on the home page and on compat paths', async () => {
  show('ko', '/ko');
  await userEvent.selectOptions(screen.getByLabelText('언어'), 'en');
  expect(push).toHaveBeenLastCalledWith('/en');
  cleanup();
  show('en', '/en/a/vs/b');
  await userEvent.selectOptions(screen.getByLabelText('언어'), 'ko');
  expect(push).toHaveBeenLastCalledWith('/ko/a/vs/b');
});
