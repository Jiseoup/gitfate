import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { ExampleCards } from '@/components/ExampleCards';
import { HomeSearch } from '@/components/HomeSearch';

vi.mock('next/navigation', () => ({ useRouter: vi.fn() }));
const push = vi.fn();
afterEach(() => {
  cleanup();
  push.mockReset();
});

function show() {
  vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
  render(<HomeSearch locale="ko" label="아이디" placeholder="예: octocat" cta="보기" invalidText="잘못된 아이디" />);
}

test('a valid login goes to its reading', async () => {
  show();
  await userEvent.type(screen.getByLabelText('아이디'), ' torvalds {enter}');
  expect(push).toHaveBeenCalledWith('/ko/torvalds');
});

test('an invalid login shows the error and does not navigate', async () => {
  show();
  await userEvent.type(screen.getByLabelText('아이디'), '-bad--name{enter}');
  expect(screen.getByText('잘못된 아이디')).toBeTruthy();
  expect(push).not.toHaveBeenCalled();
});

test('example cards link to the reading and show the natal card image', () => {
  render(<ExampleCards locale="en" heading="Peek" />);
  const links = screen.getAllByRole('link');
  expect(links.map((a) => a.getAttribute('href'))).toEqual([
    '/en/torvalds',
    '/en/gvanrossum',
    '/en/karpathy',
    '/en/yyx990803',
  ]);
  expect(screen.getByAltText('karpathy').getAttribute('src')).toBe('/api/card/natal/en/karpathy.png');
});
