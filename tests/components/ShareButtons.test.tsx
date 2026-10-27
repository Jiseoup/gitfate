import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ShareButtons } from '@/components/ShareButtons';

const writeText = vi.fn<(text: string) => Promise<void>>();

beforeEach(() => {
  writeText.mockReset().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  window.history.replaceState(null, '', '/ko/JiSeoup?tz=Asia/Seoul');
});
afterEach(cleanup);

const labels = {
  copy: '링크 복사',
  copied: '복사됐어요!',
  copyFailed: '복사하지 못했어요.',
  download: '카드 이미지 저장',
  x: 'X에 공유',
};

function renderButtons() {
  render(
    <ShareButtons
      labels={labels}
      cardHref="/api/card/natal/ko/JiSeoup.png?tz=Asia%2FSeoul"
      sharePath="/ko/JiSeoup?tz=Asia%2FSeoul"
      shareText="gitfate · JiSeoup"
    />,
  );
}

test('copy link writes the current URL and confirms', async () => {
  renderButtons();
  expect(screen.queryByText('복사됐어요!')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: '링크 복사' }));
  expect(writeText).toHaveBeenCalledWith(window.location.href);
  expect(window.location.href).toBe('http://localhost:3000/ko/JiSeoup?tz=Asia/Seoul');
  expect(await screen.findByText('복사됐어요!')).toBeTruthy();
});

test('download links the natal card and X links the intent URL', () => {
  renderButtons();
  const download = screen.getByRole('link', { name: '카드 이미지 저장' });
  expect(download.getAttribute('href')).toBe('/api/card/natal/ko/JiSeoup.png?tz=Asia%2FSeoul');
  expect(download.hasAttribute('download')).toBe(true);
  const x = new URL(screen.getByRole('link', { name: 'X에 공유' }).getAttribute('href')!);
  expect(x.origin + x.pathname).toBe('https://x.com/intent/post');
  expect(x.searchParams.get('text')).toBe('gitfate · JiSeoup');
  expect(x.searchParams.get('url')).toBe('http://localhost:3000/ko/JiSeoup?tz=Asia%2FSeoul');
});

test('copy failure or a missing clipboard shows a fallback hint', async () => {
  writeText.mockRejectedValueOnce(new Error('denied'));
  renderButtons();
  fireEvent.click(screen.getByRole('button', { name: '링크 복사' }));
  expect(await screen.findByText('복사하지 못했어요.')).toBeTruthy();
  cleanup();
  Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
  renderButtons();
  fireEvent.click(screen.getByRole('button', { name: '링크 복사' }));
  expect(screen.getByText('복사하지 못했어요.')).toBeTruthy();
  expect(screen.queryByText('복사됐어요!')).toBeNull();
});
