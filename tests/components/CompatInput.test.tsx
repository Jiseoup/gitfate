import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { CompatInput } from '@/components/CompatInput';

vi.mock('next/navigation', () => ({ useRouter: vi.fn() }));
const push = vi.fn();
afterEach(() => {
  cleanup();
  push.mockReset();
});

function show(tz?: string) {
  vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
  render(<CompatInput locale="ko" login="JiSeoup" tz={tz} placeholder="상대 아이디" cta="보기" invalidText="잘못된 아이디" />);
}

test('goes to the compat page without a tz query when the reading did not use ?tz=', async () => {
  show();
  await userEvent.type(screen.getByLabelText('상대 아이디'), ' torvalds {enter}');
  expect(push).toHaveBeenCalledWith('/ko/JiSeoup/vs/torvalds');
});

test("carries the user's chosen timezone over as ?tzA=", async () => {
  show('America/Argentina/Buenos_Aires');
  await userEvent.type(screen.getByLabelText('상대 아이디'), 'torvalds{enter}');
  expect(push).toHaveBeenCalledWith('/ko/JiSeoup/vs/torvalds?tzA=America%2FArgentina%2FBuenos_Aires');
});

test('an invalid partner login shows the error and does not navigate', async () => {
  show('Asia/Seoul');
  await userEvent.type(screen.getByLabelText('상대 아이디'), '-bad--{enter}');
  expect(screen.getByText('잘못된 아이디')).toBeTruthy();
  expect(push).not.toHaveBeenCalled();
});
